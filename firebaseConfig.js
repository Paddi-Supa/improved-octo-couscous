import { initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from './utils/secureStorageShim';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFGrVna3kJExzOT1cKBIB-rRa61fu3Ls4",
  authDomain: "real-paddi.firebaseapp.com",
  projectId: "real-paddi",
  storageBucket: "real-paddi.firebasestorage.app",
  messagingSenderId: "914435298977",
  appId: "1:914435298977:web:549f4175af46d3997882e0",
  measurementId: "G-JQKEQT82V0"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  // Use the SecureStore-backed shim so auth persistence stores data securely.
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { app, db };

