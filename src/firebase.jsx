// firebase.jsx
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeOWolwZFXfknJv5iOjPs9D3iRFZ3if6U",
  authDomain: "comunaaaa-19055.firebaseapp.com",
  projectId: "comunaaaa-19055",
  storageBucket: "comunaaaa-19055.firebasestorage.app",
  messagingSenderId: "430830456212",
  appId: "1:430830456212:web:6f084994bcecafc5155381",
  measurementId: "G-HXSJKPW12P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };