'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { CADENCE_OPTIONS, getReminderBadgeColor, getReminderBadgeText, type ReminderStatus } from '@/lib/cadence'
import Toast from '@/app/components/Toast'
import { useToast } from '@/app/hooks/useToast'
import ActivityTimeline from '@/app/components/ActivityTimeline'

interface Company {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface Note {
  id: string
  content: string
  createdAt: string
  teamMember: TeamMember
}

interface Contact {
  id: string
  name: string
  email: string
  jobTitle?: string
  linkedinUrl?: string
  referrer?: string
  labels?: string
  cadence: string
  lastTouchDate: string
  nextReminderDate: string | null
  reminderStatus: ReminderStatus
  generalNotes?: string
  customFields?: Record<string, string>
  companies: Array<{ company: Company }>
  teamMembers: Array<{ teamMember: TeamMember }>
  notes: Note[]
}

export default function ContactDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCustomFieldInput, setShowCustomFieldInput] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [showRenameField, setShowRenameField] = useState<string | null>(null)
  const [renameFieldValue, setRenameFieldValue] = useState('')
  const [newLabel, setNewLabel] = useState('')
  
  const getLabelColor = (label: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-yellow-100 text-yellow-800', 
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800'
    ]
    let hash = 0
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getLabelsArray = () => {
    return formData.labels ? formData.labels.split(',').map(l => l.trim()).filter(l => l) : []
  }

  const addLabel = () => {
    if (newLabel.trim()) {
      const currentLabels = getLabelsArray()
      if (!currentLabels.includes(newLabel.trim())) {
        const updatedLabels = [...currentLabels, newLabel.trim()]
        setFormData({ ...formData, labels: updatedLabels.join(', ') })
      }
      setNewLabel('')
    }
  }

  const removeLabel = (labelToRemove: string) => {
    const currentLabels = getLabelsArray()
    const updatedLabels = currentLabels.filter(label => label !== labelToRemove)
    setFormData({ ...formData, labels: updatedLabels.join(', ') })
  }
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jobTitle: '',
    linkedinUrl: '',
    referrer: '',
    labels: '',
    cadence: '3_MONTHS',
    lastTouchDate: '',
    generalNotes: '',
    customFields: {} as Record<string, string>,
    companyIds: [] as string[],
    teamMemberIds: [] as string[]
  })

  useEffect(() => {
    fetchContact()
    fetchCompanies()
    fetchTeamMembers()
  }, [id])

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setContact(data)
        setFormData({
          name: data.name,
          email: data.email,
          jobTitle: data.jobTitle || '',
          linkedinUrl: data.linkedinUrl || '',
          referrer: data.referrer || '',
          labels: data.labels || '',
          cadence: data.cadence,
          lastTouchDate: new Date(data.lastTouchDate).toISOString().split('T')[0],
          generalNotes: data.generalNotes || '',
          customFields: data.customFields || {},
          companyIds: data.companies.map((c: any) => c.company.id),
          teamMemberIds: data.teamMembers.map((m: any) => m.teamMember.id)
        })
      } else {
        showToast('Contact not found', 'error')
        router.push('/contacts')
      }
    } catch (error) {
      console.error('Failed to fetch contact:', error)
      showToast('Failed to load contact', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setAllCompanies(data)
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-members')
      if (response.ok) {
        const data = await response.json()
        setAllTeamMembers(data)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditMode(false)
        showToast('Contact updated successfully!', 'success')
        await fetchContact()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to update contact', 'error')
      }
    } catch (error) {
      console.error('Failed to update contact:', error)
      showToast('Failed to update contact', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Contact deleted successfully!', 'success')
        router.push('/contacts')
      } else {
        showToast('Failed to delete contact', 'error')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      showToast('Failed to delete contact', 'error')
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const toggleCompany = (companyId: string) => {
    setFormData(prev => ({
      ...prev,
      companyIds: prev.companyIds.includes(companyId)
        ? prev.companyIds.filter(id => id !== companyId)
        : [...prev.companyIds, companyId]
    }))
  }

  const toggleTeamMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(memberId)
        ? prev.teamMemberIds.filter(id => id !== memberId)
        : [...prev.teamMemberIds, memberId]
    }))
  }

  const addCustomField = () => {
    if (newFieldName.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, [newFieldName.trim()]: '' }
      }))
      setNewFieldName('')
      setShowCustomFieldInput(false)
    }
  }

  const updateCustomField = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value }
    }))
  }

  const startRename = (key: string) => {
    setShowRenameField(key)
    setRenameFieldValue(key)
  }

  const confirmRename = (oldKey: string) => {
    if (renameFieldValue.trim() && renameFieldValue !== oldKey) {
      setFormData(prev => {
        const newFields = { ...prev.customFields }
        newFields[renameFieldValue.trim()] = newFields[oldKey]
        delete newFields[oldKey]
        return { ...prev, customFields: newFields }
      })
    }
    setShowRenameField(null)
    setRenameFieldValue('')
  }

  const removeCustomField = (key: string) => {
    setFormData(prev => {
      const newFields = { ...prev.customFields }
      delete newFields[key]
      return { ...prev, customFields: newFields }
    })
  }

  const getCadenceLabel = (cadence: string) => {
    return CADENCE_OPTIONS.find(opt => opt.value === cadence)?.label || cadence
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">Loading contact...</div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8 text-red-600">Contact not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => router.push('/contacts')}
          className="text-blue-600 hover:text-blue-700"
        >
          ← Back to Contacts
        </button>
        <div className="flex space-x-3">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditMode(false)
                  fetchContact()
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              {!editMode ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
                  <p className="text-gray-600 mt-1">{contact.email}</p>
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-3xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 w-full"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-gray-600 border border-gray-300 rounded-lg px-3 py-2 w-full"
                    placeholder="Email"
                  />
                </div>
              )}
            </div>
            <span className={`px-3 py-1 text-sm rounded ${getReminderBadgeColor(contact.reminderStatus)}`}>
              {getReminderBadgeText(contact.reminderStatus)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
            {!editMode ? (
              <div className="text-gray-900">
                {contact.jobTitle || <span className="text-gray-400">Not provided</span>}
              </div>
            ) : (
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="e.g., CEO, VP of Sales"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
            {!editMode ? (
              <div className="text-gray-900">
                {contact.linkedinUrl ? (
                  <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {contact.linkedinUrl}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>
            ) : (
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="https://linkedin.com/in/username"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Referrer</label>
            {!editMode ? (
              <div className="text-gray-900">
                {contact.referrer || <span className="text-gray-400">Not provided</span>}
              </div>
            ) : (
              <input
                type="text"
                value={formData.referrer}
                onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="Who referred this contact?"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
            {!editMode ? (
              <div className="text-gray-900">
                {contact.labels ? (
                  <div className="flex flex-wrap gap-1">
                    {contact.labels.split(',').map((label, index) => (
                      <span key={index} className={`px-2 py-1 text-xs rounded-full font-medium ${getLabelColor(label.trim())}`}>
                        {label.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">No labels</span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addLabel()
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    placeholder="Add a label (e.g., hot-lead, vip)"
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                {getLabelsArray().length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {getLabelsArray().map((label, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLabelColor(label)}`}
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cadence</label>
            {!editMode ? (
              <div className="text-gray-900">{getCadenceLabel(contact.cadence)}</div>
            ) : (
              <select
                value={formData.cadence}
                onChange={(e) => setFormData({ ...formData, cadence: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                {CADENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Touch Date</label>
            {!editMode ? (
              <div className="text-gray-900">{formatDate(contact.lastTouchDate)}</div>
            ) : (
              <input
                type="date"
                value={formData.lastTouchDate}
                onChange={(e) => setFormData({ ...formData, lastTouchDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Next Reminder Date</label>
            <div className="text-gray-900">{formatDate(contact.nextReminderDate)}</div>
            {editMode && (
              <p className="text-xs text-gray-500 mt-1">Auto-calculated based on cadence and last touch date</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Companies</label>
          {!editMode ? (
            <div className="flex flex-wrap gap-2">
              {contact.companies.length > 0 ? (
                contact.companies.map(({ company }) => (
                  <span key={company.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                    {company.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No companies</span>
              )}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
              {allCompanies.map(company => (
                <label key={company.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.companyIds.includes(company.id)}
                    onChange={() => toggleCompany(company.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{company.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
          {!editMode ? (
            <div className="flex flex-wrap gap-2">
              {contact.teamMembers.length > 0 ? (
                contact.teamMembers.map(({ teamMember }) => (
                  <span key={teamMember.id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm">
                    {teamMember.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No team members</span>
              )}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
              {allTeamMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={formData.teamMemberIds.includes(member.id)}
                    onChange={() => toggleTeamMember(member.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{member.name} ({member.email})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">General Notes</label>
          {!editMode ? (
            <div className="text-gray-900 whitespace-pre-wrap">
              {contact.generalNotes || <span className="text-gray-400">No notes</span>}
            </div>
          ) : (
            <textarea
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              rows={4}
              placeholder="Add notes about this contact..."
            />
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Custom Fields</label>
            {editMode && !showCustomFieldInput && (
              <button
                type="button"
                onClick={() => setShowCustomFieldInput(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Field
              </button>
            )}
          </div>
          {!editMode ? (
            <div className="space-y-2">
              {contact.customFields && Object.keys(contact.customFields).length > 0 ? (
                Object.entries(contact.customFields).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-sm font-medium text-gray-700 w-40">{key}:</span>
                    <span className="text-sm text-gray-900">{value || '-'}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400">No custom fields</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {showCustomFieldInput && (
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Field name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomField()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomFieldInput(false)
                      setNewFieldName('')
                    }}
                    className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {Object.entries(formData.customFields).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  {showRenameField === key ? (
                    <>
                      <input
                        type="text"
                        value={renameFieldValue}
                        onChange={(e) => setRenameFieldValue(e.target.value)}
                        className="w-40 px-2 py-1 border border-gray-300 rounded bg-white text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            confirmRename(key)
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => confirmRename(key)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRenameField(null)
                          setRenameFieldValue('')
                        }}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRename(key)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 w-40 text-left"
                    >
                      {key}:
                    </button>
                  )}
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateCustomField(key, e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded bg-white text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomField(key)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {Object.keys(formData.customFields).length === 0 && !showCustomFieldInput && (
                <p className="text-sm text-gray-500">No custom fields added yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <ActivityTimeline contactId={id} onActivityAdded={fetchContact} />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Delete Contact</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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