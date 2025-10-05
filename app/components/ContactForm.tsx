'use client'

import { useState, useEffect } from 'react'
import { CADENCE_OPTIONS } from '@/lib/cadence'
import Toast from './Toast'
import { useToast } from '../hooks/useToast'

interface ContactFormProps {
  onSuccess: () => void
}

interface Company {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const { toasts, showToast, removeToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  const [showCustomFieldInput, setShowCustomFieldInput] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    linkedinUrl: '',
    referrer: '',
    labels: '',
    cadence: '3_MONTHS',
    lastTouchDate: new Date().toISOString().split('T')[0],
    generalNotes: '',
    companyIds: [] as string[],
    teamMemberIds: [] as string[]
  })
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

  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
      fetchTeamMembers()
    }
  }, [isOpen])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
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
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customFields: Object.keys(customFields).length > 0 ? customFields : null
        })
      })

      if (response.ok) {
        setFormData({
          name: '',
          firstName: '',
          lastName: '',
          email: '',
          jobTitle: '',
          linkedinUrl: '',
          referrer: '',
          labels: '',
          cadence: '3_MONTHS',
          lastTouchDate: new Date().toISOString().split('T')[0],
          generalNotes: '',
          companyIds: [],
          teamMemberIds: []
        })
        setCustomFields({})
        setNewLabel('')
        setIsOpen(false)
        showToast('Contact created successfully!', 'success')
        onSuccess()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to create contact', 'error')
      }
    } catch (error) {
      console.error('Failed to create contact:', error)
      showToast('Failed to create contact', 'error')
    } finally {
      setLoading(false)
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
      setCustomFields(prev => ({ ...prev, [newFieldName.trim()]: '' }))
      setNewFieldName('')
      setShowCustomFieldInput(false)
    }
  }

  const updateCustomField = (key: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [key]: value }))
  }

  const removeCustomField = (key: string) => {
    setCustomFields(prev => {
      const newFields = { ...prev }
      delete newFields[key]
      return newFields
    })
  }

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Add Contact
        </button>
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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., CEO, VP of Sales"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referrer
              </label>
              <input
                type="text"
                value={formData.referrer}
                onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Who referred this contact?"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cadence
              </label>
              <select
                value={formData.cadence}
                onChange={(e) => setFormData({ ...formData, cadence: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                {CADENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Touch Date
              </label>
              <input
                type="date"
                value={formData.lastTouchDate}
                onChange={(e) => setFormData({ ...formData, lastTouchDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Companies
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-white">
              {companies.map(company => (
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
              {companies.length === 0 && (
                <p className="text-sm text-gray-500">No companies available</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Members
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto bg-white">
              {teamMembers.map(member => (
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
              {teamMembers.length === 0 && (
                <p className="text-sm text-gray-500">No team members available</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labels
            </label>
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General Notes
            </label>
            <textarea
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              rows={3}
              placeholder="Add notes about this contact..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Custom Fields
              </label>
              {!showCustomFieldInput && (
                <button
                  type="button"
                  onClick={() => setShowCustomFieldInput(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Field
                </button>
              )}
            </div>

            {showCustomFieldInput && (
              <div className="mb-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Field name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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

            {Object.keys(customFields).length > 0 && (
              <div className="space-y-2 border border-gray-300 rounded-lg p-3 bg-white">
                {Object.entries(customFields).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-32">{key}:</span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateCustomField(key, e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Contact'}
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