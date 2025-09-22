'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkEmailWhitelist = async (email) => {
    try {
      const emailsRef = collection(db, 'zapier-emails')
      const q = query(emailsRef, where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      return !querySnapshot.empty
    } catch (error) {
      console.error('Error checking email whitelist:', error)
      return false
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verify email is still in whitelist
        const isWhitelisted = await checkEmailWhitelist(user.email)
        if (!isWhitelisted) {
          await signOut(auth)
          setUser(null)
          setError('Your access has been revoked. Please contact support.')
        } else {
          setUser(user)
          setError(null)
        }
      } else {
        setUser(null)
        setError(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  )
}