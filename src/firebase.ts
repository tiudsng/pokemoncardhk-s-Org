import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Hardcoded Firebase config - no external JSON needed
alert("firebase.ts 開始執行...");
console.log("firebase.ts loading...");

const firebaseConfig = {
  projectId: "gen-lang-client-0326385388",
  appId: "1:122336191579:web:2de07c0acb51b8b24c8b7e",
  apiKey: "AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0",
  authDomain: "gen-lang-client-0326385388.firebaseapp.com",
  firestoreDatabaseId: "abcd",
  storageBucket: "gen-lang-client-0326385388.firebasestorage.app",
  messagingSenderId: "122336191579",
  measurementId: ""
};

alert("firebase.ts config loaded! API Key: " + firebaseConfig.apiKey);
console.log("✅ firebaseConfig defined:", firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Firestore persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence failed: Browser does not support it');
  }
});

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
