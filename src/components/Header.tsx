'use client'

import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">AI Tax Calculator</h1>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user.displayName || user.email}
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}