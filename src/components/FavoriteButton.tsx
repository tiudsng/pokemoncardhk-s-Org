import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ listingId, className }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isGuest) {
      setLoading(false);
      return;
    }

    const checkFavorite = async () => {
      try {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          where('listingId', '==', listingId)
        );
        const snapshot = await getDocs(q);
        setIsFavorite(!snapshot.empty);
      } catch (error) {
        console.error("Error checking favorite:", error);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [user, listingId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || user.isGuest) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const q = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid),
          where('listingId', '==', listingId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (docSnapshot) => {
          await deleteDoc(doc(db, 'favorites', docSnapshot.id));
        });
        setIsFavorite(false);
      } else {
        await setDoc(doc(collection(db, 'favorites')), {
          userId: user.uid,
          listingId: listingId,
          createdAt: new Date()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 animate-pulse" />;

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all ${
        isFavorite 
          ? 'bg-red-50 dark:bg-red-900/20 text-red-500' 
          : 'bg-white/80 dark:bg-black/40 text-gray-400 hover:text-red-500'
      } ${className}`}
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
    </button>
  );
};
