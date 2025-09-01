// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "trainsmart-ai-q4a19",
  "appId": "1:6010033705:web:7bd9362b3e8bfed02dae38",
  "storageBucket": "trainsmart-ai-q4a19.firebasestorage.app",
  "apiKey": "AIzaSyBMdaVSeE9xXLz684zeCSOVQkf8hZfX3do",
  "authDomain": "trainsmart-ai-q4a19.firebaseapp.com",
  "measurementId": "G-B16J0E9XSY",
  "messagingSenderId": "6010033705"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with offline persistence
const db = initializeFirestore(app, {});

if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db);
  } catch (err: any) {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence is not supported in this browser.');
    }
  }
}


export { app, auth, db };
