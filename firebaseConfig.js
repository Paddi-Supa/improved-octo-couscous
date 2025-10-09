import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';

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

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});