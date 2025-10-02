'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="LuxonAI"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/contacts" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Contacts
              </Link>
              <Link href="/companies" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Companies
              </Link>
              <Link href="/team" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Team
              </Link>
              <Link href="/ai-agent" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                🤖 AI Agent
              </Link>
              <Link href="/api-docs" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                API Docs
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {session?.user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-gray-700 hover:text-red-600 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <button 
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Dashboard
              </Link>
              <Link href="/contacts" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Contacts
              </Link>
              <Link href="/companies" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Companies
              </Link>
              <Link href="/team" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Team
              </Link>
              <Link href="/ai-agent" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                🤖 AI Agent
              </Link>
              <Link href="/api-docs" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                API Docs
              </Link>
              {session?.user && (
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}