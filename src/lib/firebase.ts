
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// IMPORTANT: Replace with your Firebase project's configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcaHxOOJnqkxMGd_llzP-4GzlGtYPV9Yo",
  authDomain: "metalgalvano-22e5b.firebaseapp.com",
  projectId: "metalgalvano-22e5b",
  storageBucket: "metalgalvano-22e5b.firebasestorage.app",
  messagingSenderId: "21385291737",
  appId: "1:21385291737:web:d1a48669f69ba344829bc8"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
