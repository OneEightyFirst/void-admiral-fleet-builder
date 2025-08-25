// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7GsEhT1w_pQf9uW9j5Umqfs8HopTuGDk",
  authDomain: "void-admiral-fleet-builder.firebaseapp.com",
  projectId: "void-admiral-fleet-builder",
  storageBucket: "void-admiral-fleet-builder.firebasestorage.app",
  messagingSenderId: "816010965474",
  appId: "1:816010965474:web:f7bd29b54e07a9d89409bb",
  measurementId: "G-S5EHJ9XTYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
