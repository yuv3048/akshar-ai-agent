import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "ai-agent-3efdb.firebaseapp.com",
  projectId: "ai-agent-3efdb",
  storageBucket: "ai-agent-3efdb.firebasestorage.app",
  messagingSenderId: "301433836026",
  appId: "1:164e4f7e480827a9971443:web:164e4f7e480827a9971443",
  measurementId: "G-K8DJJNEFS8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();