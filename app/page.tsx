'use client'

import { useState, useEffect } from 'react'
import ContactList from './components/ContactList'

interface DashboardStats {
  overdueContacts: number
  dueTodayContacts: number
  dueThisWeekContacts: number
  dueThisMonthContacts: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    overdueContacts: 0,
    dueTodayContacts: 0,
    dueThisWeekContacts: 0,
    dueThisMonthContacts: 0
  })
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              LuxonAI Dashboard
            </h1>
            <p className="text-gray-600">
              Intelligent contact management - Building stronger relationships through AI.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Today</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setActiveFilter(activeFilter === 'OVERDUE' ? null : 'OVERDUE')}
          className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow text-left ${
            activeFilter === 'OVERDUE' ? 'ring-2 ring-red-500 bg-red-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${activeFilter === 'OVERDUE' ? 'bg-red-200' : 'bg-red-100'}`}>
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueContacts}</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setActiveFilter(activeFilter === 'DUE_TODAY' ? null : 'DUE_TODAY')}
          className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow text-left ${
            activeFilter === 'DUE_TODAY' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${activeFilter === 'DUE_TODAY' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dueTodayContacts}</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setActiveFilter(activeFilter === 'DUE_THIS_WEEK' ? null : 'DUE_THIS_WEEK')}
          className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow text-left ${
            activeFilter === 'DUE_THIS_WEEK' ? 'ring-2 ring-green-500 bg-green-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${activeFilter === 'DUE_THIS_WEEK' ? 'bg-green-200' : 'bg-green-100'}`}>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dueThisWeekContacts}</p>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setActiveFilter(activeFilter === 'DUE_THIS_MONTH' ? null : 'DUE_THIS_MONTH')}
          className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow text-left ${
            activeFilter === 'DUE_THIS_MONTH' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${activeFilter === 'DUE_THIS_MONTH' ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dueThisMonthContacts || 0}</p>
            </div>
          </div>
        </button>
      </div>

      <ContactList reminderFilter={activeFilter} />
    </div>
  )
}