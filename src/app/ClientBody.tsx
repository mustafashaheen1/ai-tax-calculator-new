'use client'

interface ClientBodyProps {
  children: React.ReactNode
}

export default function ClientBody({ children }: ClientBodyProps) {
  return <>{children}</>
}