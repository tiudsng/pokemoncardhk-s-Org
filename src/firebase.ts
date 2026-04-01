import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0",
  authDomain: "gen-lang-client-0326385388.firebaseapp.com",
  projectId: "gen-lang-client-0326385388",
  storageBucket: "gen-lang-client-0326385388.firebasestorage.app",
  messagingSenderId: "122336191579",
  appId: "1:122336191579:web:2de07c0acb51b8b24c8b7e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, GoogleAuthProvider };
