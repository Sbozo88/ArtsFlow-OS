import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDd08E67Gi32NDYdAiDtCemIQVTqRe5Qf8",
  authDomain: "artflow-os.firebaseapp.com",
  projectId: "artflow-os",
  storageBucket: "artflow-os.firebasestorage.app",
  messagingSenderId: "74071605345",
  appId: "1:74071605345:web:88f58dcf358d6ecd0faa20"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
