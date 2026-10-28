import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Firebase client configuration for the current environment (development / staging / production).
 *
 * These values are PUBLIC identifiers, not secrets: they ship inside every app build. They are
 * supplied per environment (EAS environment variables or a local .env.local — see .env.example)
 * so that environments cannot be mixed up and the API key can be rotated and restricted without
 * code changes. Access control is enforced by Firebase Security Rules and App Check.
 *
 * Each value must be referenced as `process.env.EXPO_PUBLIC_...` (dot notation) so Expo inlines it.
 * Private provider credentials must never be added here.
 */
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    try {
        auth = Platform.OS === 'web'
            ? getAuth(app)
            : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
        // initializeAuth throws if auth was already initialised (e.g. after a fast refresh).
        auth = getAuth(app);
    }

    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, auth, db, storage };
