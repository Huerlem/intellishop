import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Firebase client configuration for the current environment (development / staging / production).
 *
 * These values are PUBLIC identifiers, not secrets: they ship inside every app build. They are
 * supplied per environment (EAS environment variables or a local .env.local — see .env.example)
 * so that environments cannot be mixed up and the API key can be rotated and restricted without
 * code changes. Access control is enforced by Firebase Security Rules (firestore.rules,
 * storage.rules) and server-side checks in Cloud Functions.
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

/** Cloud Functions region (co-located with Firestore; see docs/AI_ARCHITECTURE.md §2). */
export const FUNCTIONS_REGION = 'europe-west2';

/**
 * Local Firebase Emulator Suite host for development builds only (e.g. "192.168.1.20" or
 * "localhost"). Ignored in staging and production builds.
 */
const appEnv = Constants.expoConfig?.extra?.appEnv ?? 'development';
const emulatorHost = appEnv === 'development' ? process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST : undefined;

export const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;

let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;

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
    functions = getFunctions(app, FUNCTIONS_REGION);

    if (emulatorHost) {
        try {
            connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
            connectFirestoreEmulator(db, emulatorHost, 8080);
            connectStorageEmulator(storage, emulatorHost, 9199);
            connectFunctionsEmulator(functions, emulatorHost, 5001);
        } catch {
            // Already connected (fast refresh).
        }
    }
}

export const usingEmulators = Boolean(isFirebaseConfigured && emulatorHost);

export { app, auth, db, storage, functions };
