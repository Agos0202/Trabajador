// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeOWolwZFXfknJv5iOjPs9D3iRFZ3if6U",
  authDomain: "comunaaaa-19055.firebaseapp.com",
  projectId: "comunaaaa-19055",
  storageBucket: "comunaaaa-19055.firebasestorage.app",
  messagingSenderId: "430830456212",
  appId: "1:430830456212:web:6f084994bcecafc5155381",
  measurementId: "G-HXSJKPW12P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Eliminado porque no se usa
const db = getFirestore(app);

export { db };