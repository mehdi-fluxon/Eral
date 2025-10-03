import { z } from 'zod'
import { tool } from '@openai/agents'

// Base URL for API calls
const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

// Headers for internal API calls
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add internal API key for server-to-server authentication
  if (process.env.INTERNAL_API_KEY) {
    headers['x-internal-api-key'] = process.env.INTERNAL_API_KEY
  }

  return headers
}

// Maps AI assistant function calls to actual API endpoints
export async function executeFunction(functionName: string, parameters: any) {
  const headers = getHeaders()

  try {
    switch (functionName) {
      // ==================== CONTACTS ====================

      case 'search_contacts': {
        const searchParams = new URLSearchParams()
        if (parameters.search) searchParams.append('search', parameters.search)
        if (parameters.reminderStatus) searchParams.append('reminderStatus', parameters.reminderStatus)
        if (parameters.teamMember) searchParams.append('teamMember', parameters.teamMember)
        if (parameters.cadence) searchParams.append('cadence', parameters.cadence)
        if (parameters.company) searchParams.append('company', parameters.company)
        if (parameters.page) searchParams.append('page', parameters.page.toString())
        if (parameters.limit) searchParams.append('limit', parameters.limit.toString())

        const response = await fetch(`${baseUrl}/api/contacts?${searchParams}`, { headers })
        return await response.json()
      }

      case 'create_contact': {
        const response = await fetch(`${baseUrl}/api/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(parameters)
        })
        return await response.json()
      }

      case 'get_contact_by_id': {
        const response = await fetch(`${baseUrl}/api/contacts/${parameters.id}`, { headers })
        return await response.json()
      }

      case 'update_contact': {
        const { id, ...updateData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        })
        return await response.json()
      }

      case 'delete_contact': {
        const response = await fetch(`${baseUrl}/api/contacts/${parameters.id}`, {
          method: 'DELETE',
          headers
        })
        return await response.json()
      }

      // ==================== NOTES ====================

      case 'add_note_to_contact': {
        const { contactId, ...noteData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${contactId}/notes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(noteData)
        })
        return await response.json()
      }

      case 'delete_note': {
        const response = await fetch(`${baseUrl}/api/notes/${parameters.id}`, {
          method: 'DELETE',
          headers
        })
        return await response.json()
      }

      // ==================== INTERACTIONS ====================

      case 'add_interaction_to_contact': {
        const { contactId, ...interactionData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${contactId}/interactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...interactionData,
            interactionDate: interactionData.interactionDate || new Date().toISOString().split('T')[0],
            updateLastTouch: interactionData.updateLastTouch !== false
          })
        })
        return await response.json()
      }

      case 'update_interaction': {
        const { id, ...updateData } = parameters
        const response = await fetch(`${baseUrl}/api/interactions/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        })
        return await response.json()
      }

      case 'delete_interaction': {
        const response = await fetch(`${baseUrl}/api/interactions/${parameters.id}`, {
          method: 'DELETE',
          headers
        })
        return await response.json()
      }

      // ==================== TIMELINE ====================

      case 'get_contact_timeline': {
        const response = await fetch(`${baseUrl}/api/contacts/${parameters.contactId}/timeline`, { headers })
        return await response.json()
      }

      // ==================== DASHBOARD ====================

      case 'get_dashboard_stats': {
        const response = await fetch(`${baseUrl}/api/dashboard/stats`, { headers })
        return await response.json()
      }

      // ==================== COMPANIES ====================

      case 'search_companies': {
        const searchParams = new URLSearchParams()
        if (parameters.search) searchParams.append('search', parameters.search)
        const response = await fetch(`${baseUrl}/api/companies?${searchParams}`, { headers })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to search companies: ${response.status}`)
        }
        return data
      }

      case 'create_company': {
        const response = await fetch(`${baseUrl}/api/companies`, {
          method: 'POST',
          headers,
          body: JSON.stringify(parameters)
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to create company: ${response.status}`)
        }
        return data
      }

      case 'get_company_by_id': {
        const response = await fetch(`${baseUrl}/api/companies/${parameters.id}`, { headers })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to get company: ${response.status}`)
        }
        return data
      }

      case 'update_company': {
        const { id, ...updateData } = parameters
        const response = await fetch(`${baseUrl}/api/companies/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to update company: ${response.status}`)
        }
        return data
      }

      case 'delete_company': {
        const response = await fetch(`${baseUrl}/api/companies/${parameters.id}`, {
          method: 'DELETE',
          headers
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || `Failed to delete company: ${response.status}`)
        }
        return data
      }

      // ==================== TEAM MEMBERS ====================

      case 'search_team_members': {
        const searchParams = new URLSearchParams()
        if (parameters.search) searchParams.append('search', parameters.search)
        const response = await fetch(`${baseUrl}/api/team-members?${searchParams}`, { headers })
        return await response.json()
      }

      case 'create_team_member': {
        const response = await fetch(`${baseUrl}/api/team-members`, {
          method: 'POST',
          headers,
          body: JSON.stringify(parameters)
        })
        return await response.json()
      }

      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  } catch (error: any) {
    console.error(`Error executing function ${functionName}:`, error)
    throw error
  }
}

// Generate Agent tools for Agents SDK
export function generateAgentTools() {
  const cadenceEnum = z.enum(["1_DAY", "2_DAYS", "3_DAYS", "5_DAYS", "7_DAYS", "2_WEEKS", "3_WEEKS", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "9_MONTHS", "12_MONTHS", "18_MONTHS", "24_MONTHS"])
  const reminderStatusEnum = z.enum(["OVERDUE", "DUE_TODAY", "DUE_THIS_WEEK", "UPCOMING", "NO_REMINDER"])
  const interactionTypeEnum = z.enum(["EMAIL", "CALL", "MEETING", "LINKEDIN", "FOLLOWUP", "PROPOSAL", "OTHER"])

  return [
    // ==================== CONTACTS ====================
    tool({
      name: "search_contacts",
      description: "Search and filter contacts with pagination. Use this to find contacts by name, company, reminder status, etc. All parameters have defaults and can be omitted.",
      parameters: z.object({}),
      execute: async (args: any) => executeFunction('search_contacts', args)
    }),
    tool({
      name: "create_contact",
      description: "Create a new contact with associated companies and team members. IMPORTANT: Always include the current user's team member ID in teamMemberIds unless user explicitly assigns to someone else.",
      parameters: z.object({
        name: z.string().describe("Contact name"),
        email: z.string().email().describe("Contact email"),
        jobTitle: z.string().nullable().optional().describe("Job title"),
        linkedinUrl: z.string().nullable().optional().describe("LinkedIn profile URL"),
        referrer: z.string().nullable().optional().describe("Who referred this contact"),
        labels: z.string().nullable().optional().describe("Comma-separated labels"),
        cadence: cadenceEnum.default("3_MONTHS").nullable().optional().describe("Follow-up frequency"),
        lastTouchDate: z.string().nullable().optional().describe("Last contact date (YYYY-MM-DD)"),
        generalNotes: z.string().nullable().optional().describe("General notes"),
        customFields: z.record(z.string()).nullable().optional().describe("Custom fields as key-value pairs"),
        companyIds: z.array(z.string()).nullable().optional().describe("Array of company IDs to associate"),
        teamMemberIds: z.array(z.string()).describe("Array of team member IDs to associate - REQUIRED, use current user's team member ID from context")
      }),
      execute: async (args: any) => executeFunction('create_contact', args)
    }),

    tool({
      name: "get_contact_by_id",
      description: "Get a specific contact by ID with all associated data",
      parameters: z.object({
        id: z.string().describe("Contact ID")
      }),
      execute: async (args: any) => executeFunction('get_contact_by_id', args)
    }),

    tool({
      name: "update_contact",
      description: "Update contact information and associations. IMPORTANT: Only include fields you want to change. Omit companyIds and teamMemberIds to preserve existing relationships.",
      parameters: z.object({
        id: z.string().describe("Contact ID"),
        name: z.string().nullable().optional().describe("Contact name"),
        email: z.string().email().nullable().optional().describe("Contact email"),
        jobTitle: z.string().nullable().optional().describe("Job title"),
        linkedinUrl: z.string().nullable().optional().describe("LinkedIn profile URL"),
        referrer: z.string().nullable().optional().describe("Who referred this contact"),
        labels: z.string().nullable().optional().describe("Comma-separated labels"),
        cadence: cadenceEnum.nullable().optional().describe("Follow-up frequency"),
        lastTouchDate: z.string().nullable().optional().describe("Last contact date (YYYY-MM-DD)"),
        nextReminderDate: z.string().nullable().optional().describe("Next reminder date (YYYY-MM-DD) - use this for custom reminder timing"),
        generalNotes: z.string().nullable().optional().describe("General notes"),
        customFields: z.record(z.string()).nullable().optional().describe("Custom fields as key-value pairs"),
        companyIds: z.array(z.string()).nullable().optional().describe("Array of company IDs to associate with this contact"),
        teamMemberIds: z.array(z.string()).nullable().optional().describe("Array of team member IDs to associate with this contact")
      }),
      execute: async (args: any) => executeFunction('update_contact', args)
    }),

    tool({
      name: "delete_contact",
      description: "Permanently delete a contact and all associated notes and interactions",
      parameters: z.object({
        id: z.string().describe("Contact ID")
      }),
      execute: async (args: any) => executeFunction('delete_contact', args)
    }),

    // ==================== NOTES ====================

    tool({
      name: "add_note_to_contact",
      description: "Add a note to a contact. This automatically updates the last touch date and recalculates reminders.",
      parameters: z.object({
        contactId: z.string().describe("Contact ID"),
        content: z.string().describe("Note content with rich text support"),
        teamMemberId: z.string().describe("ID of team member creating the note")
      }),
      execute: async (args: any) => executeFunction('add_note_to_contact', args)
    }),

    tool({
      name: "delete_note",
      description: "Permanently delete a note",
      parameters: z.object({
        id: z.string().describe("Note ID")
      }),
      execute: async (args: any) => executeFunction('delete_note', args)
    }),

    // ==================== INTERACTIONS ====================

    tool({
      name: "add_interaction_to_contact",
      description: "Log an interaction (call, email, meeting, etc.) with a contact. This automatically updates last touch date and recalculates reminders by default.",
      parameters: z.object({
        contactId: z.string().describe("Contact ID"),
        type: interactionTypeEnum.describe("Type of interaction"),
        subject: z.string().nullable().optional().describe("Interaction subject"),
        content: z.string().describe("Interaction details"),
        outcome: z.string().nullable().optional().describe("Interaction outcome"),
        interactionDate: z.string().nullable().optional().describe("Interaction date (YYYY-MM-DD), defaults to today"),
        teamMemberId: z.string().describe("ID of team member logging the interaction"),
        updateLastTouch: z.boolean().default(true).nullable().optional().describe("Whether to update contact last touch date and recalculate reminder (defaults to true)")
      }),
      execute: async (args: any) => executeFunction('add_interaction_to_contact', args)
    }),

    tool({
      name: "update_interaction",
      description: "Update interaction details",
      parameters: z.object({
        id: z.string().describe("Interaction ID"),
        type: interactionTypeEnum.nullable().optional().describe("Type of interaction"),
        subject: z.string().nullable().optional().describe("Interaction subject"),
        content: z.string().nullable().optional().describe("Interaction details"),
        outcome: z.string().nullable().optional().describe("Interaction outcome"),
        interactionDate: z.string().nullable().optional().describe("Interaction date (YYYY-MM-DD)")
      }),
      execute: async (args: any) => executeFunction('update_interaction', args)
    }),

    tool({
      name: "delete_interaction",
      description: "Permanently delete an interaction",
      parameters: z.object({
        id: z.string().describe("Interaction ID")
      }),
      execute: async (args: any) => executeFunction('delete_interaction', args)
    }),

    // ==================== TIMELINE & DASHBOARD ====================

    tool({
      name: "get_contact_timeline",
      description: "Get chronological timeline of notes and interactions for a contact",
      parameters: z.object({
        contactId: z.string().describe("Contact ID")
      }),
      execute: async (args: any) => executeFunction('get_contact_timeline', args)
    }),

    tool({
      name: "get_dashboard_stats",
      description: "Get dashboard statistics including contact counts by reminder status",
      parameters: z.object({}),
      execute: async (args: any) => executeFunction('get_dashboard_stats', args)
    }),

    // ==================== COMPANIES ====================

    tool({
      name: "search_companies",
      description: "Search companies by name or industry. Use this to find companies before creating or updating.",
      parameters: z.object({
        search: z.string().nullable().optional().describe("Search by company name or industry (case-insensitive partial match)")
      }),
      execute: async (args: any) => executeFunction('search_companies', args)
    }),

    tool({
      name: "create_company",
      description: "Create a new company",
      parameters: z.object({
        name: z.string().describe("Company name"),
        website: z.string().nullable().optional().describe("Company website"),
        industry: z.string().nullable().optional().describe("Industry sector"),
        size: z.string().nullable().optional().describe("Company size")
      }),
      execute: async (args: any) => executeFunction('create_company', args)
    }),

    tool({
      name: "get_company_by_id",
      description: "Get a specific company by ID with contact count",
      parameters: z.object({
        id: z.string().describe("Company ID")
      }),
      execute: async (args: any) => executeFunction('get_company_by_id', args)
    }),

    tool({
      name: "update_company",
      description: "Update company information",
      parameters: z.object({
        id: z.string().describe("Company ID"),
        name: z.string().nullable().optional().describe("Company name"),
        website: z.string().nullable().optional().describe("Company website"),
        industry: z.string().nullable().optional().describe("Industry sector"),
        size: z.string().nullable().optional().describe("Company size")
      }),
      execute: async (args: any) => executeFunction('update_company', args)
    }),

    tool({
      name: "delete_company",
      description: "Permanently delete a company",
      parameters: z.object({
        id: z.string().describe("Company ID")
      }),
      execute: async (args: any) => executeFunction('delete_company', args)
    }),

    // ==================== TEAM MEMBERS ====================

    tool({
      name: "search_team_members",
      description: "Search team members by name or email. Use this to find team members before creating or assigning.",
      parameters: z.object({
        search: z.string().nullable().optional().describe("Search by team member name or email (case-insensitive partial match)")
      }),
      execute: async (args: any) => executeFunction('search_team_members', args)
    }),

    tool({
      name: "create_team_member",
      description: "Create a new team member",
      parameters: z.object({
        name: z.string().describe("Team member name"),
        email: z.string().email().describe("Team member email")
      }),
      execute: async (args: any) => executeFunction('create_team_member', args)
    }),
  ]
}
