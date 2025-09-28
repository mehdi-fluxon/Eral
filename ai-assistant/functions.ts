import { specs } from './swagger'

// Convert OpenAPI spec to OpenAI function schemas
export function generateOpenAIFunctions() {
  const functions = []
  
  // Contact functions
  functions.push({
    name: "search_contacts",
    description: "Search and filter contacts with pagination. Use this to find contacts by name, company, reminder status, etc.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search by name, email, job title, labels, company, or team member"
        },
        reminderStatus: {
          type: "string",
          enum: ["OVERDUE", "DUE_TODAY", "DUE_THIS_WEEK", "UPCOMING", "NO_REMINDER"],
          description: "Filter by reminder status"
        },
        teamMember: {
          type: "string", 
          description: "Filter by team member ID"
        },
        cadence: {
          type: "string",
          enum: ["1_DAY", "2_DAYS", "3_DAYS", "5_DAYS", "7_DAYS", "2_WEEKS", "3_WEEKS", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "9_MONTHS", "12_MONTHS", "18_MONTHS", "24_MONTHS"],
          description: "Filter by cadence frequency"
        },
        company: {
          type: "string",
          description: "Filter by company ID"
        },
        page: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "Page number for pagination"
        },
        limit: {
          type: "integer", 
          minimum: 1,
          maximum: 100,
          default: 50,
          description: "Number of contacts per page"
        }
      }
    }
  })

  functions.push({
    name: "create_contact",
    description: "Create a new contact with associated companies and team members",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Contact name"
        },
        email: {
          type: "string", 
          format: "email",
          description: "Contact email"
        },
        jobTitle: {
          type: "string",
          description: "Job title"
        },
        linkedinUrl: {
          type: "string",
          format: "uri", 
          description: "LinkedIn profile URL"
        },
        referrer: {
          type: "string",
          description: "Who referred this contact"
        },
        labels: {
          type: "string",
          description: "Comma-separated labels"
        },
        cadence: {
          type: "string",
          enum: ["1_DAY", "2_DAYS", "3_DAYS", "5_DAYS", "7_DAYS", "2_WEEKS", "3_WEEKS", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "9_MONTHS", "12_MONTHS", "18_MONTHS", "24_MONTHS"],
          default: "3_MONTHS",
          description: "Follow-up frequency"
        },
        lastTouchDate: {
          type: "string",
          format: "date",
          description: "Last contact date (YYYY-MM-DD)"
        },
        generalNotes: {
          type: "string",
          description: "General notes"
        },
        customFields: {
          type: "object",
          description: "Custom fields as key-value pairs",
          additionalProperties: {
            type: "string"
          }
        },
        companyIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of company IDs to associate"
        },
        teamMemberIds: {
          type: "array", 
          items: {
            type: "string"
          },
          description: "Array of team member IDs to associate"
        }
      },
      required: ["name", "email"]
    }
  })

  functions.push({
    name: "get_contact_by_id",
    description: "Get a specific contact by ID with all associated data",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Contact ID"
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "update_contact",
    description: "Update contact information and associations",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Contact ID"
        },
        name: {
          type: "string",
          description: "Contact name"
        },
        email: {
          type: "string",
          format: "email", 
          description: "Contact email"
        },
        jobTitle: {
          type: "string",
          description: "Job title"
        },
        linkedinUrl: {
          type: "string",
          format: "uri",
          description: "LinkedIn profile URL"
        },
        referrer: {
          type: "string",
          description: "Who referred this contact"
        },
        labels: {
          type: "string",
          description: "Comma-separated labels"
        },
        cadence: {
          type: "string",
          enum: ["1_DAY", "2_DAYS", "3_DAYS", "5_DAYS", "7_DAYS", "2_WEEKS", "3_WEEKS", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "9_MONTHS", "12_MONTHS", "18_MONTHS", "24_MONTHS"],
          description: "Follow-up frequency"
        },
        lastTouchDate: {
          type: "string",
          format: "date",
          description: "Last contact date (YYYY-MM-DD)"
        },
        nextReminderDate: {
          type: "string",
          format: "date",
          description: "Next reminder date (YYYY-MM-DD) - use this for custom reminder timing"
        },
        generalNotes: {
          type: "string",
          description: "General notes"
        },
        customFields: {
          type: "object",
          description: "Custom fields as key-value pairs",
          additionalProperties: {
            type: "string"
          }
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "add_note_to_contact",
    description: "Add a note to a contact. This automatically updates the last touch date and recalculates reminders.",
    parameters: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "Contact ID"
        },
        content: {
          type: "string",
          description: "Note content with rich text support"
        },
        teamMemberId: {
          type: "string",
          description: "ID of team member creating the note",
          default: "default_user"
        }
      },
      required: ["contactId", "content"]
    }
  })

  functions.push({
    name: "add_interaction_to_contact", 
    description: "Log an interaction (call, email, meeting, etc.) with a contact. This automatically updates last touch date and recalculates reminders.",
    parameters: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "Contact ID"
        },
        type: {
          type: "string",
          enum: ["EMAIL", "CALL", "MEETING", "LINKEDIN", "FOLLOWUP", "PROPOSAL", "OTHER"],
          description: "Type of interaction"
        },
        subject: {
          type: "string",
          description: "Interaction subject"
        },
        content: {
          type: "string", 
          description: "Interaction details"
        },
        outcome: {
          type: "string",
          description: "Interaction outcome"
        },
        interactionDate: {
          type: "string",
          format: "date",
          description: "Interaction date (YYYY-MM-DD)"
        },
        teamMemberId: {
          type: "string",
          description: "ID of team member logging the interaction",
          default: "default_user"
        },
        updateLastTouch: {
          type: "boolean", 
          default: true,
          description: "Whether to update contact last touch date and recalculate reminder"
        }
      },
      required: ["contactId", "type", "content"]
    }
  })

  functions.push({
    name: "get_contact_timeline",
    description: "Get chronological timeline of notes and interactions for a contact",
    parameters: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "Contact ID"
        }
      },
      required: ["contactId"]
    }
  })

  functions.push({
    name: "get_dashboard_stats",
    description: "Get dashboard statistics including contact counts by reminder status",
    parameters: {
      type: "object",
      properties: {}
    }
  })

  functions.push({
    name: "create_company",
    description: "Create a new company",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Company name"
        },
        website: {
          type: "string",
          format: "uri",
          description: "Company website"
        },
        industry: {
          type: "string",
          description: "Industry sector"
        },
        size: {
          type: "string",
          description: "Company size"
        }
      },
      required: ["name"]
    }
  })

  functions.push({
    name: "create_team_member",
    description: "Create a new team member",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Team member name"
        },
        email: {
          type: "string",
          format: "email",
          description: "Team member email"
        }
      },
      required: ["name", "email"]
    }
  })

  return functions
}

// Function to execute API calls based on function name and parameters
export async function executeFunction(functionName: string, parameters: any, baseUrl: string = 'http://localhost:3001') {
  const url = new URL(baseUrl)
  
  try {
    switch (functionName) {
      case 'search_contacts': {
        const searchParams = new URLSearchParams()
        if (parameters.search) searchParams.append('search', parameters.search)
        if (parameters.reminderStatus) searchParams.append('reminderStatus', parameters.reminderStatus)
        if (parameters.teamMember) searchParams.append('teamMember', parameters.teamMember)
        if (parameters.cadence) searchParams.append('cadence', parameters.cadence)
        if (parameters.company) searchParams.append('company', parameters.company)
        if (parameters.page) searchParams.append('page', parameters.page.toString())
        if (parameters.limit) searchParams.append('limit', parameters.limit.toString())

        const response = await fetch(`${baseUrl}/api/contacts?${searchParams}`)
        return await response.json()
      }

      case 'create_contact': {
        const response = await fetch(`${baseUrl}/api/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters)
        })
        return await response.json()
      }

      case 'get_contact_by_id': {
        const response = await fetch(`${baseUrl}/api/contacts/${parameters.id}`)
        return await response.json()
      }

      case 'update_contact': {
        const { id, ...updateData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        return await response.json()
      }

      case 'add_note_to_contact': {
        const { contactId, ...noteData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...noteData,
            teamMemberId: noteData.teamMemberId || 'default_user'
          })
        })
        return await response.json()
      }

      case 'add_interaction_to_contact': {
        const { contactId, ...interactionData } = parameters
        const response = await fetch(`${baseUrl}/api/contacts/${contactId}/interactions`, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...interactionData,
            teamMemberId: interactionData.teamMemberId || 'default_user',
            interactionDate: interactionData.interactionDate || new Date().toISOString().split('T')[0]
          })
        })
        return await response.json()
      }

      case 'get_contact_timeline': {
        const response = await fetch(`${baseUrl}/api/contacts/${parameters.contactId}/timeline`)
        return await response.json()
      }

      case 'get_dashboard_stats': {
        const response = await fetch(`${baseUrl}/api/dashboard/stats`)
        return await response.json()
      }

      case 'create_company': {
        const response = await fetch(`${baseUrl}/api/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters)
        })
        return await response.json()
      }

      case 'create_team_member': {
        const response = await fetch(`${baseUrl}/api/team-members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters)
        })
        return await response.json()
      }

      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error)
    throw error
  }
}