'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ContactForm from './ContactForm'
import { CADENCE_OPTIONS, getReminderBadgeColor, getReminderBadgeText, type ReminderStatus } from '@/lib/cadence'

interface Company {
  id: string
  name: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

interface Contact {
  id: string
  name: string
  email: string
  linkedinUrl?: string
  cadence: string
  lastTouchDate: string
  nextReminderDate: string | null
  reminderStatus: ReminderStatus
  companies: Array<{ company: Company }>
  teamMembers: Array<{ teamMember: TeamMember }>
  generalNotes?: string
  customFields?: Record<string, string>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ContactListProps {
  reminderFilter?: string | null
}

export default function ContactList({ reminderFilter }: ContactListProps) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [teamMemberFilter, setTeamMemberFilter] = useState('')
  const [cadenceFilter, setCadenceFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [reminderStatusFilter, setReminderStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [companies, setCompanies] = useState<Company[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    fetchContacts()
    fetchCompanies()
    fetchTeamMembers()
  }, [])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
    fetchContacts(1)
  }, [debouncedSearchTerm, teamMemberFilter, cadenceFilter, companyFilter, reminderStatusFilter, reminderFilter])

  useEffect(() => {
    fetchContacts(currentPage)
  }, [currentPage])

  const fetchContacts = async (page = currentPage) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      if (teamMemberFilter) params.append('teamMember', teamMemberFilter)
      if (cadenceFilter) params.append('cadence', cadenceFilter)
      if (companyFilter) params.append('company', companyFilter)
      if (reminderStatusFilter) params.append('reminderStatus', reminderStatusFilter)
      if (reminderFilter) params.append('reminderStatus', reminderFilter)
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/contacts?${params.toString()}`)
      const data = await response.json()
      setContacts(data.contacts)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getCadenceLabel = (cadence: string) => {
    return CADENCE_OPTIONS.find(opt => opt.value === cadence)?.label || cadence
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading && contacts.length === 0) {
    return <div className="text-center py-8">Loading contacts...</div>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
          <ContactForm onSuccess={() => fetchContacts(currentPage)} />
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search contacts by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />

          <div className="grid grid-cols-4 gap-3">
            <select
              value={teamMemberFilter}
              onChange={(e) => setTeamMemberFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Team Members</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>

            <select
              value={cadenceFilter}
              onChange={(e) => setCadenceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Cadences</option>
              {CADENCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>

            <select
              value={reminderStatusFilter}
              onChange={(e) => setReminderStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
            >
              <option value="">All Reminders</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DUE_TODAY">Due Today</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="NO_REMINDER">No Reminder</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name / Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Companies
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cadence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Touch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Reminder
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr 
                key={contact.id} 
                onClick={() => router.push(`/contacts/${contact.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {contact.companies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {contact.companies.map(({ company }) => (
                        <span key={company.id} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {company.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {contact.teamMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {contact.teamMembers.map(({ teamMember }) => (
                        <span key={teamMember.id} className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {teamMember.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {getCadenceLabel(contact.cadence)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(contact.lastTouchDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(contact.nextReminderDate)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${getReminderBadgeColor(contact.reminderStatus)}`}>
                    {getReminderBadgeText(contact.reminderStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} contacts
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                      pageNum === pagination.page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {contacts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || teamMemberFilter || cadenceFilter || companyFilter || reminderStatusFilter
            ? 'No contacts match your filters.'
            : 'No contacts found. Add your first contact to get started.'}
        </div>
      )}
    </div>
  )
}