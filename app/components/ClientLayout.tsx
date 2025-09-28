'use client'

import Header from './Header'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="w-full px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}