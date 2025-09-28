'use client'

import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

interface WeeklyReminder {
  message: string
  followUps: Record<string, any[]>
}

export default function RemindersPage() {
  const { toasts, showToast, removeToast } = useToast()
  const [reminder, setReminder] = useState<WeeklyReminder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklyReminder()
  }, [])

  const fetchWeeklyReminder = async () => {
    try {
      const response = await fetch('/api/reminders/weekly')
      const data = await response.json()
      setReminder(data)
    } catch (error) {
      console.error('Failed to fetch weekly reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (reminder?.message) {
      try {
        await navigator.clipboard.writeText(reminder.message)
        showToast('Reminder copied to clipboard!', 'success')
      } catch (err) {
        console.error('Failed to copy:', err)
        showToast('Failed to copy to clipboard', 'error')
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading weekly reminder...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Weekly Reminders
            </h1>
            <p className="text-gray-600">
              Generate Slack-formatted reminders for team follow-ups.
            </p>
          </div>
          <button
            onClick={fetchWeeklyReminder}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Refresh Reminder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Slack Message Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Slack Message
            </h2>
            {reminder?.message && (
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            )}
          </div>
          
          {reminder?.message ? (
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap border">
              {reminder.message}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders this week</h3>
              <p className="mt-1 text-sm text-gray-500">
                All follow-ups are up to date!
              </p>
            </div>
          )}
        </div>

        {/* Follow-up Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Follow-up Summary
          </h2>
          
          {reminder?.followUps && Object.keys(reminder.followUps).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(reminder.followUps).map(([assignee, followUps]) => (
                <div key={assignee} className="border-l-4 border-[#123ef6] pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {assignee}
                  </h3>
                  <div className="space-y-2">
                    {followUps.map((followUp: any, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {followUp.contact.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {followUp.contact.company?.name}
                            </div>
                            {followUp.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {followUp.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(followUp.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500">
                No follow-ups due this week.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          How to use Weekly Reminders
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>1. <strong>Review</strong> the generated Slack message above</p>
          <p>2. <strong>Copy</strong> the message using the copy button</p>
          <p>3. <strong>Paste</strong> it into your team's Slack channel</p>
          <p>4. <strong>Schedule</strong> this as a recurring weekly task</p>
        </div>
      </div>

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}