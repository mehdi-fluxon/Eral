'use client'

import { useState } from 'react'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TimelineInteraction {
  id: string
  type: 'interaction'
  interactionType: string
  content: string
  teamMember: TeamMember
  date: string
  createdAt: string
  updatedAt: string
}

interface EditInteractionModalProps {
  interaction: TimelineInteraction
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

export default function EditInteractionModal({ interaction, onClose, onSuccess }: EditInteractionModalProps) {
  const { toasts, showToast, removeToast } = useToast()
  const [formData, setFormData] = useState({
    type: interaction.interactionType,
    content: interaction.content,
    interactionDate: new Date(interaction.date).toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) {
      showToast('Please enter interaction content', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/interactions/${interaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content: formData.content.trim()
        })
      })

      if (response.ok) {
        showToast('Interaction updated successfully!', 'success')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 500)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to update interaction', 'error')
      }
    } catch (error) {
      console.error('Failed to update interaction:', error)
      showToast('Failed to update interaction', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
          <h2 className="text-xl font-semibold mb-4">Edit Interaction</h2>
          
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                rows={8}
                placeholder="Describe the interaction..."
                required
              />
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
                {loading ? 'Updating...' : 'Update Interaction'}
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