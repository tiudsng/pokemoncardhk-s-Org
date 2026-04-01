import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded Firebase config
const firebaseConfig = {
  projectId: "gen-lang-client-0326385388",
  appId: "1:122336191579:web:2de07c0acb51b8b24c8b7e",
  apiKey: "AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0",
  authDomain: "gen-lang-client-0326385388.firebaseapp.com",
  storageBucket: "gen-lang-client-0326385388.firebasestorage.app",
  messagingSenderId: "122336191579",
  measurementId: "",
  // Use emulator in dev
  // For production with non-default DB 'abcd', use the REST URL directly
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use databaseId parameter for non-default Firestore database
// @ts-ignore - databaseId is supported in firebase 10.x
export const db = getFirestore(app, 'abcd');

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
