import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCBNtuAVG5RggXd1BR6_4vGyhsDvAWZgW4",
  authDomain: "ai-tax-calculator-e1834.firebaseapp.com",
  projectId: "ai-tax-calculator-e1834",
  storageBucket: "ai-tax-calculator-e1834.firebasestorage.app",
  messagingSenderId: "877325288078",
  appId: "1:877325288078:web:b28686007639dcf536bfdf"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)