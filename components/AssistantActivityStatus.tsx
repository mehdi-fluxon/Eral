'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search, Plus, Edit, Trash2, Database, CheckCircle, XCircle, Sparkles } from 'lucide-react'

interface Activity {
  id: string
  functionName: string
  status: 'started' | 'success' | 'error'
  description: string
  timestamp: string
  duration?: number
  error?: string
}

const getIcon = (functionName: string, status: string) => {
  if (status === 'error') return <XCircle className="w-4 h-4" />
  if (status === 'success') {
    if (functionName.includes('search') || functionName.includes('get')) return <Search className="w-4 h-4" />
    if (functionName.includes('create') || functionName.includes('add')) return <CheckCircle className="w-4 h-4" />
    if (functionName.includes('update')) return <CheckCircle className="w-4 h-4" />
    if (functionName.includes('delete')) return <CheckCircle className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }
  if (functionName.includes('search') || functionName.includes('get')) return <Search className="w-4 h-4 animate-pulse" />
  if (functionName.includes('create') || functionName.includes('add')) return <Plus className="w-4 h-4 animate-pulse" />
  if (functionName.includes('update')) return <Edit className="w-4 h-4 animate-pulse" />
  if (functionName.includes('delete')) return <Trash2 className="w-4 h-4 animate-pulse" />
  return <Database className="w-4 h-4 animate-pulse" />
}

export default function AssistantActivityStatus({ threadId }: { threadId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)

  useEffect(() => {
    // Poll for activity updates
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/assistant/activities')
        const data = await response.json()
        
        if (data.activities) {
          setActivities(data.activities.slice(0, 5)) // Show last 5 activities
          
          // Find current activity (most recent "started" status)
          const current = data.activities.find((a: Activity) => a.status === 'started')
          setCurrentActivity(current || null)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      }
    }, 500) // Update every 500ms

    return () => clearInterval(interval)
  }, [threadId])

  // If there's a current activity, show it as the main status
  if (currentActivity) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-2">
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">
              AI Assistant is working...
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {currentActivity.description}
            </div>
          </div>
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      </div>
    )
  }

  // Show recent activities when not actively working
  if (activities.length > 0) {
    const recentActivity = activities[0]
    
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`rounded-full p-2 ${
              recentActivity.status === 'success' ? 'bg-green-100' : 
              recentActivity.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {getIcon(recentActivity.functionName, recentActivity.status)}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {recentActivity.status === 'success' ? 'Completed' : 
               recentActivity.status === 'error' ? 'Failed' : 'Processing'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {recentActivity.description}
              {recentActivity.duration && (
                <span className="ml-2 text-gray-400">
                  ({recentActivity.duration < 1000 ? `${recentActivity.duration}ms` : `${(recentActivity.duration / 1000).toFixed(1)}s`})
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Show mini timeline of recent activities */}
        {activities.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              {activities.slice(1, 4).map((activity) => (
                <div
                  key={activity.id}
                  className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-400' : 
                    activity.status === 'error' ? 'bg-red-400' : 'bg-gray-300'
                  }`}
                  title={activity.description}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default state when no activities
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="bg-gray-100 rounded-full p-2">
          <Sparkles className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-sm text-gray-500">
          AI Assistant is ready...
        </div>
      </div>
    </div>
  )
}