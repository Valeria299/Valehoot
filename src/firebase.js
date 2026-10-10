import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Pego AQUÍ el código que copié de Firebase:
const firebaseConfig = {
  apiKey: "AIzaSyDx1d26P-BgCHKZjjUf1obNup2mDL1mM14",
  authDomain: "valehoot-29.firebaseapp.com",
  projectId: "valehoot-29",
  storageBucket: "valehoot-29.firebasestorage.app",
  messagingSenderId: "950510169464",
  appId: "1:950510169464:web:b52496c5d15c694c176c8d"
};

// Esto inicializa la conexión
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);