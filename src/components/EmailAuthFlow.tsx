'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { signInWithPopup } from 'firebase/auth'

export default function EmailAuthFlow() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('email') // 'email' or 'password' only (no 'signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if email exists in zapier-emails collection
  const checkEmailInZapier = async (email) => {
    try {
      const zapierRef = collection(db, 'zapier-emails')
      const q = query(zapierRef, where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data()
        console.log('Found user in zapier-emails:', { 
          email: data.email, 
          hasPassword: !!data.password,
          hasName: !!data.name 
        })
        return data
      }
      console.log('Email not found in zapier-emails:', email)
      return null
    } catch (error) {
      console.error('Error checking email:', error)
      return null
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check if email exists in zapier-emails collection
      const zapierData = await checkEmailInZapier(email)
      
      if (!zapierData) {
        // Email not found in zapier-emails
        setError('This email is not registered.')
        setLoading(false)
        return
      }
      
      // Email exists, proceed to password step
      setStep('password')
      
    } catch (error) {
      setError('Error checking email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // First verify the credentials against zapier-emails collection
      const zapierData = await checkEmailInZapier(email)
      
      if (!zapierData) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }
      
      // Check if password matches
      if (zapierData.password !== password) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }
      
      // Credentials are valid in Firestore
      // Now we need to ensure Firebase Auth is set up correctly
      
      // Import both functions we might need
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
      
      if (zapierData.password !== password) {
        setError('Invalid email or password.')
        console.log('Password mismatch:', { stored: zapierData.password, entered: password })
        setLoading(false)
        return
      }
      
      // Credentials are valid in Firestore, now handle Firebase Auth
      try {
        // First attempt: Try to sign in
        // Try to sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password)
        console.log('Successfully signed in existing user')
      } catch (signInError) {
        console.log('Sign in error code:', signInError.code)
        
        if (signInError.code === 'auth/user-not-found' || 
            signInError.code === 'auth/invalid-credential' ||
            signInError.code === 'auth/invalid-login-credentials') {
          // User doesn't exist in Firebase Auth, create them
          console.log('User not found in Firebase Auth, creating new user...')
          
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            
            // Update profile with name from Firestore if available
            if (zapierData.name) {
              await updateProfile(userCredential.user, { displayName: zapierData.name })
            }
            
            console.log('Successfully created and signed in new user')
            // User is now signed in
          } catch (createError) {
            console.error('Error creating user:', createError)
            
            if (createError.code === 'auth/email-already-in-use') {
              // This shouldn't happen but handle it
              setError('Email already in use. Please try signing in again.')
            } else if (createError.code === 'auth/weak-password') {
              setError('Password does not meet security requirements.')
            } else {
              setError('Error creating account. Please ensure Email/Password auth is enabled in Firebase.')
            }
            setLoading(false)
            return
          }
        } else if (signInError.code === 'auth/wrong-password') {
          setError('Invalid password.')
          try {
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            
            // Update profile with name from Firestore if available
            if (zapierData.name) {
              await updateProfile(userCredential.user, { displayName: zapierData.name })
            }
            
            console.log('Successfully created and signed in new user')
          } catch (createError) {
            console.error('Error creating user:', createError)
            if (createError.code === 'auth/email-already-in-use') {
              // User exists but with different password, need to handle this
              setError('Account configuration error. The password may have been changed.')
            } else {
              setError('Error creating account. Please try again.')
            }
            setLoading(false)
            return
          }
        } else if (signInError.code === 'auth/wrong-password') {
          // User exists in Firebase Auth but password doesn't match
          // This means password was changed in Firebase but not in Firestore
          setError('Invalid password. Please use your most recent password.')
        } else {
          console.error('Auth error:', signInError)
          setError('Error signing in. Please try again.')
        }
        
        if (signInError.code !== 'auth/user-not-found') {
          setLoading(false)
          return
        }
      }
      // If we reach here, sign-in was successful
      console.log('Sign-in completed successfully')
      
    } catch (error) {
      console.error('General sign-in error:', error)
      setError('Error signing in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const userEmail = result.user.email
      
      // Check if email exists in zapier-emails
      const zapierData = await checkEmailInZapier(userEmail)
      
      if (!zapierData) {
        await auth.signOut()
        setError('Your Google account is not registered.')
        return
      }
      
      // Email is registered, sign-in successful
      
    } catch (error) {
      setError('Error with Google sign-in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">AI Tax Calculator</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' ? 'Sign in to your account' : 'Enter your password'}
          </p>
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Checking...' : 'Continue with email'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Signing in as <span className="font-medium">{email}</span>
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setPassword('')
                  setError('')
                }}
                className="ml-2 text-black hover:underline"
              >
                Change
              </button>
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}