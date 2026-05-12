import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCV7f9PSdp3XOzCqjFwoXCi-BIb9rZdFIo",
  authDomain: "mynotes-64970.firebaseapp.com",
  projectId: "mynotes-64970",
  storageBucket: "mynotes-64970.firebasestorage.app",
  messagingSenderId: "203740245081",
  appId: "1:203740245081:web:0c476fa02ff2d2bc27d548",
  measurementId: "G-VNVWTCG580"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()