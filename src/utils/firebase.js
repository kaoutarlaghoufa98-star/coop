// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRHMDyDsQZ9NYBhEcN1RmLU5rf2oGeGJg",
  authDomain: "patispredict-76993.firebaseapp.com",
  projectId: "patispredict-76993",
  storageBucket: "patispredict-76993.firebasestorage.app",
  messagingSenderId: "729179366358",
  appId: "1:729179366358:web:b7cde4fffae51283cdba77",
  measurementId: "G-WDHP8L8JB8"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Sign in anonymously
export const initFirebase = async () => {
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously');
  } catch (error) {
    console.error('Firebase auth error:', error);
  }
};