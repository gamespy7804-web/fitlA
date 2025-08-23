
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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

export { app, auth };
