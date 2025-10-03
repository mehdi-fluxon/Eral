/**
 * API Schema - Single source of truth for all API capabilities
 * This is queryable by the LLM to understand what it can do
 */

export const API_SCHEMA = {
  contacts: {
    search: {
      description: "Search and filter contacts with pagination",
      filters: {
        reminderStatus: {
          type: "enum",
          values: {
            OVERDUE: {
              description: "Contacts with nextReminderDate < today",
              dateRange: { type: "before", anchor: "today" }
            },
            DUE_TODAY: {
              description: "Contacts with nextReminderDate = today",
              dateRange: { type: "exact", anchor: "today" }
            },
            DUE_THIS_WEEK: {
              description: "Contacts with nextReminderDate from tomorrow to today+7 days (excludes today and overdue)",
              dateRange: { type: "range", start: "tomorrow", end: "today+7" }
            },
            UPCOMING: {
              description: "Contacts with nextReminderDate >= tomorrow",
              dateRange: { type: "after", anchor: "tomorrow" }
            },
            NO_REMINDER: {
              description: "Contacts with no reminder date set",
              dateRange: null
            }
          },
          examples: {
            "this week": ["DUE_TODAY", "DUE_THIS_WEEK"],
            "overdue": ["OVERDUE"],
            "upcoming": ["UPCOMING"],
            "all": null
          }
        },
        teamMember: {
          type: "string",
          description: "Filter by team member ID",
          requiresSearch: true,
          searchFunction: "search_team_members"
        },
        cadence: {
          type: "enum",
          values: ["1_DAY", "2_DAYS", "3_DAYS", "5_DAYS", "7_DAYS", "2_WEEKS", "3_WEEKS", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "9_MONTHS", "12_MONTHS", "18_MONTHS", "24_MONTHS"],
          description: "Filter by follow-up cadence frequency"
        },
        company: {
          type: "string",
          description: "Filter by company ID",
          requiresSearch: true,
          searchFunction: "search_companies"
        },
        search: {
          type: "string",
          description: "Free-text search across name, email, job title, labels, company name, team member name"
        }
      },
      pagination: {
        page: { type: "number", default: 1, description: "Page number" },
        limit: { type: "number", default: 50, max: 100, description: "Results per page" }
      },
      returns: {
        contacts: "array",
        pagination: "object"
      }
    },
    create: {
      required: ["name", "email", "teamMemberIds"],
      optional: ["jobTitle", "linkedinUrl", "referrer", "labels", "cadence", "lastTouchDate", "generalNotes", "customFields", "companyIds"],
      defaults: {
        cadence: "3_MONTHS"
      }
    },
    update: {
      required: ["id"],
      optional: ["name", "email", "jobTitle", "linkedinUrl", "referrer", "labels", "cadence", "lastTouchDate", "nextReminderDate", "generalNotes", "customFields", "companyIds", "teamMemberIds"],
      warning: "Only include fields you want to change. Omit companyIds/teamMemberIds to preserve existing relationships."
    }
  },

  dateLogic: {
    today: "Current date at 00:00:00",
    tomorrow: "today + 1 day",
    "this week": {
      description: "From today through today+7 days",
      filters: ["DUE_TODAY", "DUE_THIS_WEEK"],
      maxDate: "today+7"
    },
    "this month": {
      description: "From today through end of current month",
      filters: ["DUE_THIS_MONTH"],
      maxDate: "end of month"
    },
    "next 30 days": {
      description: "From today through today+30",
      filters: null,
      customLogic: "Use DUE_THIS_MONTH or filter results client-side"
    }
  },

  relationships: {
    contact_to_company: {
      type: "many-to-many",
      searchRequired: true,
      note: "Must search for company by name first, then use company ID"
    },
    contact_to_team_member: {
      type: "many-to-many",
      searchRequired: true,
      note: "Must search for team member first, then use team member ID"
    }
  }
}

/**
 * Query planner - helps LLM understand how to fulfill user requests
 */
export function planQuery(userIntent: string, schema: typeof API_SCHEMA) {
  // This will be called by LLM to understand its approach
  return {
    steps: [],
    warnings: [],
    suggestions: []
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQuery(functionName: string, parameters: any, schema: typeof API_SCHEMA) {
  const errors: string[] = []
  const warnings: string[] = []

  // Add validation logic here

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Post-process results to ensure they match user intent
 */
export function validateResults(userIntent: string, results: any, expectedDateRange?: { start: Date, end: Date }) {
  const issues: string[] = []

  // Check if results fall within expected date range
  if (expectedDateRange && results.contacts) {
    for (const contact of results.contacts) {
      if (contact.nextReminderDate) {
        const reminderDate = new Date(contact.nextReminderDate)
        if (reminderDate < expectedDateRange.start || reminderDate >= expectedDateRange.end) {
          issues.push(`Contact ${contact.name} has reminder ${contact.nextReminderDate} outside requested range`)
        }
      }
    }
  }

  return { valid: issues.length === 0, issues }
}
