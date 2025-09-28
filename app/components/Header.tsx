'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div>
                <span className="font-bold text-xl text-gray-900">LuxonAI</span>
                <div className="text-xs text-gray-500">Intelligent Contact Management</div>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/contacts" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Contacts
              </Link>
              <Link href="/follow-ups" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Follow-ups
              </Link>
              <Link href="/reminders" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Reminders
              </Link>
              <Link href="/analytics" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                Analytics
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
            <Link href="/contacts" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
              Add Contact
            </Link>
            <Link href="/reminders" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Weekly Reminder
            </Link>
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
              <Link href="/follow-ups" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Follow-ups
              </Link>
              <Link href="/reminders" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Reminders
              </Link>
              <Link href="/analytics" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                Analytics
              </Link>
              <Link href="/ai-agent" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                🤖 AI Agent
              </Link>
              <Link href="/api-docs" className="block px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors">
                API Docs
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}