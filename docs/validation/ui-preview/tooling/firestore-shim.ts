import { firestoreModule as m } from '../test-utils/memoryFirestore';
export const { getFirestore, collection, doc, query, where, orderBy, limit, serverTimestamp, deleteField, increment, Timestamp, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch, onSnapshot } = m;
export const connectFirestoreEmulator = () => {};
