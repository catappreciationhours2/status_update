// firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "people-cdb62.firebaseapp.com",
  projectId: "people-cdb62",
  storageBucket: "people-cdb62.firebasestorage.app",
  messagingSenderId: "548932893372",
  appId: "1:548932893372:web:3229fc7daab50fb2ab2eb9",
  measurementId: "G-S98G8VM22R"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { 
  app, 
  auth, 
  db, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot
};
