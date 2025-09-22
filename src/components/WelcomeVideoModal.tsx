'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Play } from 'lucide-react'

export default function WelcomeVideoModal() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) return

      try {
        // Check if user document exists AND has seen video
        const userRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userRef)
        
        // Only show video if explicitly marked as false or document doesn't exist
        if (!userDoc.exists()) {
          // First time user - show video and create document
          setShowModal(true)
          await setDoc(userRef, {
            email: user.email,
            hasSeenWelcomeVideo: true,
            firstLoginDate: new Date().toISOString()
          })
        } else if (userDoc.data()?.hasSeenWelcomeVideo === false) {
          // User exists but hasn't seen video
          setShowModal(true)
          await setDoc(userRef, {
            hasSeenWelcomeVideo: true,
          }, { merge: true })
        }
        // If hasSeenWelcomeVideo is true or any other value, don't show modal
        
      } catch (error) {
        console.error('Error checking welcome video status:', error)
        // On error, don't show video to avoid annoying users
        setShowModal(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkFirstTimeUser()
  }, [user])

  const handleClose = () => {
    setShowModal(false)
  }

  if (isLoading || !showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-black">Welcome to AI Tax Calculator!</h2>
            <p className="text-gray-600 mt-1">Watch this quick introduction to get started</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Video Content */}
        <div className="p-6">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: '60vh' }}
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23f3f4f6'/%3E%3Cg transform='translate(400,225)'%3E%3Ccircle r='40' fill='%23374151'/%3E%3Cpath d='M-10,-15 L-10,15 L20,0 Z' fill='white'/%3E%3C/g%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='18'%3EWelcome Video%3C/text%3E%3C/svg%3E"
            >
              <source 
                src="https://storage.googleapis.com/msgsndr/hbnmPfgq4CkZ3S5hY5EZ/media/68d19a1a83739a2edb76e300.mp4" 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Video Description */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-black mb-2">What you'll learn:</h3>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• How to use the tax calculator effectively</li>
              <li>• Understanding donation tax benefits</li>
              <li>• Getting the most from AI tax advice</li>
              <li>• Navigating the different tools available</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            You can always access help and tutorials from the main menu
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}