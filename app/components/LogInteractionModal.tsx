'use client'

import { useState, useEffect } from 'react'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'
import RichTextEditor from './RichTextEditor'

interface TeamMember {
  id: string
  name: string
  email: string
}

interface LogInteractionModalProps {
  contactId: string
  onClose: () => void
  onSuccess: () => void
}

const INTERACTION_TYPES = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'CALL', label: 'Call' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'LINKEDIN', label: 'LinkedIn message' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'PROPOSAL', label: 'Proposal sent' },
  { value: 'OTHER', label: 'Other' }
]

export default function LogInteractionModal({ contactId, onClose, onSuccess }: LogInteractionModalProps) {
  const { toasts, showToast, removeToast } = useToast()
  const [formData, setFormData] = useState({
    type: 'EMAIL',
    subject: '',
    content: '',
    interactionDate: new Date().toISOString().split('T')[0],
    teamMemberId: '',
    updateLastTouch: true
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-members')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, teamMemberId: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content: formData.content.trim()
        })
      })

      if (response.ok) {
        showToast('Interaction logged successfully!', 'success')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 500)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to log interaction', 'error')
      }
    } catch (error) {
      console.error('Failed to log interaction:', error)
      showToast('Failed to log interaction', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
          <h2 className="text-xl font-semibold mb-4">Log Interaction</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interaction Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  required
                >
                  {INTERACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member *
                </label>
                <select
                  value={formData.teamMemberId}
                  onChange={(e) => setFormData({ ...formData, teamMemberId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  required
                >
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.interactionDate}
                onChange={(e) => setFormData({ ...formData, interactionDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject / Title
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                placeholder="Brief title for this interaction..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Describe the interaction..."
              />
            </div>

            <div className="flex items-center space-x-2 bg-indigo-50 p-3 rounded-lg">
              <input
                type="checkbox"
                id="updateLastTouch"
                checked={formData.updateLastTouch}
                onChange={(e) => setFormData({ ...formData, updateLastTouch: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="updateLastTouch" className="text-sm text-gray-700">
                Update &quot;Last touch date&quot; and recalculate next reminder based on cadence
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Logging...' : 'Log Interaction'}
              </button>
            </div>
          </form>
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
    </>
  )
}