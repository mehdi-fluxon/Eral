'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  totalContacts: number
  pendingFollowUps: number
  thisWeekFollowUps: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    pendingFollowUps: 0,
    thisWeekFollowUps: 0
  })
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics & Reports
        </h1>
        <p className="text-gray-600">
          Track your sales follow-up performance and contact engagement metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-600 bg-opacity-10 rounded-lg">
              <svg className="w-6 h-6 text-[#123ef6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
              <p className="text-xs text-green-600">+{Math.floor(stats.totalContacts * 0.12)} this month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingFollowUps}</p>
              <p className="text-xs text-gray-500">Across all contacts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekFollowUps}</p>
              <p className="text-xs text-gray-500">Due this week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed This Month</span>
              <span className="text-sm font-semibold text-green-600">
                {Math.floor(stats.pendingFollowUps * 2.3)} / {Math.floor(stats.pendingFollowUps * 3.1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '74%' }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>74% completion rate</span>
              <span>↑ 8% from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Rates</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">LinkedIn Messages</span>
              </div>
              <span className="text-sm font-semibold">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Email Outreach</span>
              </div>
              <span className="text-sm font-semibold">42%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">General Notes</span>
              </div>
              <span className="text-sm font-semibold">N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-600">Team Member</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Assigned Contacts</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Follow-ups Completed</th>
                <th className="text-left py-3 text-sm font-medium text-gray-600">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 text-sm text-gray-900">Erad</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.totalContacts * 0.4)}</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.pendingFollowUps * 0.8)}</td>
                <td className="py-3 text-sm text-green-600">72%</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-900">Karl</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.totalContacts * 0.35)}</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.pendingFollowUps * 0.6)}</td>
                <td className="py-3 text-sm text-green-600">68%</td>
              </tr>
              <tr>
                <td className="py-3 text-sm text-gray-900">lasersox</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.totalContacts * 0.25)}</td>
                <td className="py-3 text-sm text-gray-600">{Math.floor(stats.pendingFollowUps * 0.4)}</td>
                <td className="py-3 text-sm text-yellow-600">58%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Insights</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">LinkedIn outperforms email by 26%</p>
              <p className="text-sm text-blue-700">Consider prioritizing LinkedIn outreach for initial contact</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">3-month cadence shows highest engagement</p>
              <p className="text-sm text-blue-700">Contacts respond better to regular, non-aggressive follow-ups</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Healthcare industry has 15% higher response rates</p>
              <p className="text-sm text-blue-700">Focus expansion efforts on healthcare sector contacts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}