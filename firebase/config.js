import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_nQIzUd1ZRiVgna12OdxiIkb0kFk2Owc",
  authDomain: "intellishop-1f62f.firebaseapp.com",
  projectId: "intellishop-1f62f",
  storageBucket: "intellishop-1f62f.appspot.com",
  messagingSenderId: "976818565718",
  appId: "1:976818565718:web:0573da6690e4647e9181f7",
  measurementId: "G-38BN1NQ60G"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with persistence
let auth;

try {
  if (Platform.OS !== 'web') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  // Fallback
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };