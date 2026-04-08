import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "eventflex-invincible.firebaseapp.com",
  projectId: "eventflex-invincible",
  storageBucket: "eventflex-invincible.firebasestorage.app",
  messagingSenderId: "441426621066",
  appId: "1:441426621066:web:b0026616f58ae819c73373"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)

export { auth , app};