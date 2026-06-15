import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
  push,
  type Unsubscribe,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAxsxafS6H0YNR632AJIF13XVdXETHMKo0',
  authDomain: 'college-diplomas.firebaseapp.com',
  databaseURL: 'https://college-diplomas-default-rtdb.firebaseio.com',
  projectId: 'college-diplomas',
  storageBucket: 'college-diplomas.firebasestorage.app',
  messagingSenderId: '181367907290',
  appId: '1:181367907290:web:7cf85370be4c3194d9d6e3',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser,
};

const BASE_PATH = import.meta.env.VITE_PROJECT_PATH;

const fullPath = (path: string): string => `${BASE_PATH}/${path}`;

const sanitizeForFirebase = <T>(value: T): T => {
  if (value === undefined) {
    return null as T;
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirebase(item));
    return sanitizedArray as T;
  }

  if (value && typeof value === 'object') {
    const sanitizedObject = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nested]) => {
      if (nested !== undefined) {
        acc[key] = sanitizeForFirebase(nested);
      }
      return acc;
    }, {});
    return sanitizedObject as T;
  }

  return value;
};

export class FirebaseService {
  static async getData<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, fullPath(path));
    return new Promise<T | null>((resolve) => {
      onValue(dataRef, (snapshot) => {
        resolve(snapshot.val() as T | null);
      }, { onlyOnce: true });
    });
  }

  static subscribeToData<T = unknown>(
    path: string,
    callback: (data: T | null) => void,
  ): Unsubscribe {
    const dataRef = ref(db, fullPath(path));
    return onValue(dataRef, (snapshot) => {
      callback(snapshot.val() as T | null);
    });
  }

  static async setData<T = unknown>(path: string, data: T): Promise<void> {
    const dataRef = ref(db, fullPath(path));
    await set(dataRef, sanitizeForFirebase(data));
  }

  static async updateData(path: string, updates: Record<string, unknown>): Promise<void> {
    const dataRef = ref(db, fullPath(path));
    await update(dataRef, sanitizeForFirebase(updates));
  }

  static async getSnapshot<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, fullPath(path));
    const snapshot = await get(dataRef);
    return snapshot.val() as T | null;
  }

  static async pushData<T = unknown>(path: string, data: T): Promise<string> {
    const listRef = ref(db, fullPath(path));
    const newRef = push(listRef);
    await set(newRef, sanitizeForFirebase(data));
    return newRef.key ?? '';
  }
}

export default FirebaseService;
