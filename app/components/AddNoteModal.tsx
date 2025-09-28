'use client'

import { useState, useEffect } from 'react'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

interface TeamMember {
  id: string
  name: string
  email: string
}

interface AddNoteModalProps {
  contactId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddNoteModal({ contactId, onClose, onSuccess }: AddNoteModalProps) {
  const { toasts, showToast, removeToast } = useToast()
  const [content, setContent] = useState('')
  const [teamMemberId, setTeamMemberId] = useState('')
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
          setTeamMemberId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      showToast('Please enter note content', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          teamMemberId
        })
      })

      if (response.ok) {
        showToast('Note added successfully!', 'success')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 500)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to add note', 'error')
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      showToast('Failed to add note', 'error')
    } finally {
      setLoading(false)
    }
  }

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    
    setContent(newText)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
          <h2 className="text-xl font-semibold mb-4">Add Note</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Member
              </label>
              <select
                value={teamMemberId}
                onChange={(e) => setTeamMemberId(e.target.value)}
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Note Content
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**')}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    title="Bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const lines = content.split('\n')
                      const textarea = document.getElementById('note-content') as HTMLTextAreaElement
                      const start = textarea?.selectionStart || 0
                      const lineStart = content.lastIndexOf('\n', start - 1) + 1
                      const newContent = content.substring(0, lineStart) + '• ' + content.substring(lineStart)
                      setContent(newContent)
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    title="Bullet point"
                  >
                    •
                  </button>
                </div>
              </div>
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                rows={8}
                placeholder="Enter your note... Use **text** for bold and • for bullet points"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Use **text** for bold and start lines with • for bullet points
              </p>
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
                {loading ? 'Adding...' : 'Add Note'}
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