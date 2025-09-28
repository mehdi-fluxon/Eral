'use client'

import { useState, useEffect } from 'react'
import AddNoteModal from './AddNoteModal'
import LogInteractionModal from './LogInteractionModal'
import EditInteractionModal from './EditInteractionModal'

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TimelineNote {
  id: string
  type: 'note'
  content: string
  teamMember: TeamMember
  date: string
  createdAt: string
}

interface TimelineInteraction {
  id: string
  type: 'interaction'
  interactionType: string
  subject?: string
  content: string
  outcome?: string
  teamMember: TeamMember
  date: string
  createdAt: string
  updatedAt: string
}

type TimelineItem = TimelineNote | TimelineInteraction

interface ActivityTimelineProps {
  contactId: string
  onActivityAdded?: () => void
}

const INTERACTION_TYPES = {
  EMAIL: { label: 'Email', icon: '📧', color: 'bg-blue-100 text-blue-800' },
  CALL: { label: 'Call', icon: '📞', color: 'bg-green-100 text-green-800' },
  MEETING: { label: 'Meeting', icon: '🤝', color: 'bg-purple-100 text-purple-800' },
  LINKEDIN: { label: 'LinkedIn', icon: '💼', color: 'bg-blue-100 text-blue-800' },
  FOLLOWUP: { label: 'Follow-up', icon: '🔄', color: 'bg-orange-100 text-orange-800' },
  PROPOSAL: { label: 'Proposal', icon: '📄', color: 'bg-indigo-100 text-indigo-800' },
  OTHER: { label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' }
}

export default function ActivityTimeline({ contactId, onActivityAdded }: ActivityTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showLogInteraction, setShowLogInteraction] = useState(false)
  const [editingInteraction, setEditingInteraction] = useState<TimelineInteraction | null>(null)
  const [showActivityMenu, setShowActivityMenu] = useState(false)

  useEffect(() => {
    fetchTimeline()
  }, [contactId])

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/timeline`)
      if (response.ok) {
        const data = await response.json()
        setTimeline(data)
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivityAdded = () => {
    fetchTimeline()
    if (onActivityAdded) onActivityAdded()
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTimeline()
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) return

    try {
      const response = await fetch(`/api/interactions/${interactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTimeline()
      }
    } catch (error) {
      console.error('Failed to delete interaction:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    })
  }

  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      let processed = line
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={idx} className="ml-4" dangerouslySetInnerHTML={{ __html: processed.replace(/^[•-]\s*/, '') }} />
        )
      }
      
      return <p key={idx} dangerouslySetInnerHTML={{ __html: processed }} />
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading activity...</div>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
        
        <div className="relative">
          <button
            onClick={() => setShowActivityMenu(!showActivityMenu)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <span>Add Activity</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showActivityMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  setShowAddNote(true)
                  setShowActivityMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
              >
                <span>💭</span>
                <span>Add Note</span>
              </button>
              <button
                onClick={() => {
                  setShowLogInteraction(true)
                  setShowActivityMenu(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 border-t border-gray-100"
              >
                <span>📝</span>
                <span>Log Interaction</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
          <p className="text-gray-500 mb-6">Start tracking your interactions and notes with this contact</p>
          <button
            onClick={() => setShowLogInteraction(true)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Log your first interaction →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={`${item.type}-${item.id}`} className="border-l-2 border-gray-200 pl-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {item.type === 'note' ? (
                      <span className="text-xl">💭</span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        INTERACTION_TYPES[item.interactionType as keyof typeof INTERACTION_TYPES]?.color || INTERACTION_TYPES.OTHER.color
                      }`}>
                        {INTERACTION_TYPES[item.interactionType as keyof typeof INTERACTION_TYPES]?.icon || INTERACTION_TYPES.OTHER.icon}
                        {' '}
                        {INTERACTION_TYPES[item.interactionType as keyof typeof INTERACTION_TYPES]?.label || item.interactionType}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{item.teamMember.name}</span>
                  </div>

                  {item.type === 'interaction' && item.subject && (
                    <div className="font-medium text-gray-900 mb-1">{item.subject}</div>
                  )}

                  <div className="text-gray-700 text-sm space-y-1">
                    {renderContent(item.content)}
                  </div>

                  {item.type === 'interaction' && item.outcome && (
                    <div className="mt-2 bg-gray-50 rounded p-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">Outcome:</div>
                      <div className="text-sm text-gray-700">{item.outcome}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {item.type === 'interaction' && (
                    <button
                      onClick={() => setEditingInteraction(item)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => item.type === 'note' ? handleDeleteNote(item.id) : handleDeleteInteraction(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddNote && (
        <AddNoteModal
          contactId={contactId}
          onClose={() => setShowAddNote(false)}
          onSuccess={handleActivityAdded}
        />
      )}

      {showLogInteraction && (
        <LogInteractionModal
          contactId={contactId}
          onClose={() => setShowLogInteraction(false)}
          onSuccess={handleActivityAdded}
        />
      )}

      {editingInteraction && (
        <EditInteractionModal
          interaction={editingInteraction}
          onClose={() => setEditingInteraction(null)}
          onSuccess={handleActivityAdded}
        />
      )}
    </div>
  )
}