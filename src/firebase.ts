import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBRsNlxZy-dn2kiz0LFTVdEs_JhCgJCfMU",
  authDomain: "the-store-7329a.firebaseapp.com",
  databaseURL: "https://the-store-7329a-default-rtdb.firebaseio.com",
  projectId: "the-store-7329a",
  storageBucket: "the-store-7329a.firebasestorage.app",
  messagingSenderId: "872665490977",
  appId: "1:872665490977:web:thestore7329a"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
