'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-[#060311] to-[#0d3a9a] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-[#123ef6] to-[#0d3a9a] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-xl">ERAL</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="hover:text-[#123ef6] transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/projects" className="hover:text-[#123ef6] transition-colors font-medium">
                Projects
              </Link>
              <Link href="/tasks" className="hover:text-[#123ef6] transition-colors font-medium">
                Tasks
              </Link>
              <Link href="/reports" className="hover:text-[#123ef6] transition-colors font-medium">
                Reports
              </Link>
              <Link href="/settings" className="hover:text-[#123ef6] transition-colors font-medium">
                Settings
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="bg-[#123ef6] hover:bg-[#0d3a9a] text-white px-4 py-2 rounded-lg font-medium transition-colors">
              New Task
            </button>
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium text-sm">JD</span>
            </div>
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-[#060311] border-t border-gray-700">
            <nav className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/dashboard" className="block px-3 py-2 hover:bg-[#123ef6] rounded-md transition-colors">
                Dashboard
              </Link>
              <Link href="/projects" className="block px-3 py-2 hover:bg-[#123ef6] rounded-md transition-colors">
                Projects
              </Link>
              <Link href="/tasks" className="block px-3 py-2 hover:bg-[#123ef6] rounded-md transition-colors">
                Tasks
              </Link>
              <Link href="/reports" className="block px-3 py-2 hover:bg-[#123ef6] rounded-md transition-colors">
                Reports
              </Link>
              <Link href="/settings" className="block px-3 py-2 hover:bg-[#123ef6] rounded-md transition-colors">
                Settings
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}