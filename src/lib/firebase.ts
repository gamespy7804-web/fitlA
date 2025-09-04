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

// Firestore instance promise
let firestorePromise: Promise<Firestore>;

// Function to get the Firestore instance, enabling persistence on first call
const getDbWithPersistence = (): Promise<Firestore> => {
  if (!firestorePromise) {
    firestorePromise = (async () => {
      const db = initializeFirestore(app, {});
      
      // Enable offline persistence if in a browser environment
      if (typeof window !== 'undefined') {
        try {
          await enableIndexedDbPersistence(db);
        } catch (err: any) {
          if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed: multiple tabs open. Persistence can only be enabled in one tab at a time.');
          } else if (err.code == 'unimplemented') {
            console.warn('Firestore persistence is not supported in this browser.');
          }
        }
      }
      return db;
    })();
  }
  return firestorePromise;
};

// Legacy db export for simplicity, now points to the promise-based one
const db = getDbWithPersistence;


// Export the initialized services
export { app, auth, db };