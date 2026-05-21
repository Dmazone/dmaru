import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDGrWls_wYmIJqWvOCUwk2WVKz6EpHDrIQ",
  authDomain: "dmaru-7148b.firebaseapp.com",
  projectId: "dmaru-7148b",
  storageBucket: "dmaru-7148b.firebasestorage.app",
  messagingSenderId: "680074484899",
  appId: "1:680074484899:web:2744486c464d2be48bb316",
  measurementId: "G-2HL16N8SHS"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
