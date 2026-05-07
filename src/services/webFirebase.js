// ════════════════════════════════════════════════
// COOP TAFERNOUT — Web Firebase Service
// Firebase integration for web version
// ════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authentication service for web
export class WebAuthService {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });

    // Sign in anonymously for web access
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Data service for web
export class WebDataService {
  constructor() {
    this.authService = new WebAuthService();
  }

  async loadData() {
    try {
      if (!this.authService.isAuthenticated()) {
        // Use localStorage as fallback
        const data = localStorage.getItem('tafernout_web_data');
        return data ? JSON.parse(data) : null;
      }

      const docRef = doc(db, 'web_app', 'data');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Cache locally
        localStorage.setItem('tafernout_web_data', JSON.stringify(data));
        return data;
      } else {
        // Use localStorage
        const data = localStorage.getItem('tafernout_web_data');
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('Web data load error:', error);
      // Fallback to localStorage
      const data = localStorage.getItem('tafernout_web_data');
      return data ? JSON.parse(data) : null;
    }
  }

  async saveData(data) {
    try {
      // Always save to localStorage
      localStorage.setItem('tafernout_web_data', JSON.stringify(data));

      if (!this.authService.isAuthenticated()) {
        return;
      }

      // Save to Firestore
      const docRef = doc(db, 'web_app', 'data');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Web data save error:', error);
    }
  }

  // Real-time listener for data changes
  subscribeToData(callback) {
    if (!this.authService.isAuthenticated()) {
      return () => {}; // No-op
    }

    const docRef = doc(db, 'web_app', 'data');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data);
      }
    });
  }
}