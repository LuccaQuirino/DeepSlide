import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firestore with custom databaseId if defined in config
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, firebaseConfig.firestoreDatabaseId || '(default)');

/**
 * Recursively sanitizes data for Cloud Firestore by converting any undefined values to null,
 * completely preventing:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val === undefined) {
        result[key] = null;
      } else if (val !== null && typeof val === 'object') {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
    return result as T;
  }
  return data;
}

export { 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  deleteDoc,
  updateDoc
};
export type { FirebaseUser };

