import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

// Extend the user type to support our guest user
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest?: boolean;
  rating?: number;
  totalReviews?: number;
  completedTransactions?: number;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getGuestUser = (): AppUser => {
  let guestId = localStorage.getItem('guest_uid');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_uid', guestId);
  }
  return {
    uid: guestId,
    email: null,
    displayName: '訪客',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
    isGuest: true,
    role: 'user'
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
          
          let userData = userSnap?.data();
          
          if (!userSnap?.exists()) {
            userData = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '匿名用戶',
              photoURL: currentUser.photoURL || '',
              createdAt: serverTimestamp(),
              rating: 5,
              totalReviews: 0,
              completedTransactions: 0,
              role: currentUser.email === 'appleyes516@gmail.com' ? 'admin' : 'user',
            };
            try {
              await setDoc(userRef, userData);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }

          const appUser: AppUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || '匿名用戶',
            photoURL: currentUser.photoURL,
            rating: userData?.rating || 5,
            totalReviews: userData?.totalReviews || 0,
            completedTransactions: userData?.completedTransactions || 0,
            role: currentUser.email === 'appleyes516@gmail.com' ? 'admin' : (userData?.role || 'user'),
          };
          setUser(appUser);
        } else {
          // If not logged in via Firebase, use a persistent guest user
          const guestUser = getGuestUser();
          setUser(guestUser);
          
          // Ensure guest user exists in Firestore
          const userRef = doc(db, 'users', guestUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${guestUser.uid}`);
          }
          
          if (!userSnap?.exists()) {
            try {
              await setDoc(userRef, {
                uid: guestUser.uid,
                email: '',
                displayName: guestUser.displayName,
                photoURL: guestUser.photoURL,
                createdAt: serverTimestamp(),
                isGuest: true
              });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `users/${guestUser.uid}`);
            }
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      // After sign out, the onAuthStateChanged will set the guest user
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut, showLoginModal, setShowLoginModal }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
