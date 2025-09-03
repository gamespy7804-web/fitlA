// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";

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
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);

// Firestore instance variable
let db: Firestore;

// Function to get the Firestore instance, enabling persistence on first call
const getDb = (): Firestore => {
  if (!db) {
    // Initialize Firestore
    db = initializeFirestore(app, {});

    // Enable offline persistence if in a browser environment
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(db)
        .catch((err: any) => {
          if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed: multiple tabs open. Persistence can only be enabled in one tab at a time.');
          } else if (err.code == 'unimplemented') {
            console.warn('Firestore persistence is not supported in this browser.');
          }
        });
    }
  }
  return db;
};

// Export the initialized services
export { app, auth, getDb as db };
