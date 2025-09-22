'use client'
import { useAuth } from '../contexts/AuthContext'
import { Dashboard } from './Dashboard'
import { LoginPage } from './LoginPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }
  
  return <Dashboard />
}