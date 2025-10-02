import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function generateOpenAIFunctions() {
  const functions = []
  
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
        },
        companyIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of company IDs to associate with this contact"
        },
        teamMemberIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of team member IDs to associate with this contact"
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "delete_contact",
    description: "Permanently delete a contact and all associated notes and interactions",
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
          description: "ID of team member creating the note"
        }
      },
      required: ["contactId", "content", "teamMemberId"]
    }
  })

  functions.push({
    name: "delete_note",
    description: "Permanently delete a note",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Note ID"
        }
      },
      required: ["id"]
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
          description: "ID of team member logging the interaction"
        },
        updateLastTouch: {
          type: "boolean", 
          default: true,
          description: "Whether to update contact last touch date and recalculate reminder"
        }
      },
      required: ["contactId", "type", "content", "teamMemberId"]
    }
  })

  functions.push({
    name: "update_interaction",
    description: "Update interaction details",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Interaction ID"
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
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "delete_interaction",
    description: "Permanently delete an interaction",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Interaction ID"
        }
      },
      required: ["id"]
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
    name: "search_companies",
    description: "Search companies by name or industry. Use this to find companies before creating or updating.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search by company name or industry (case-insensitive partial match)"
        }
      }
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
    name: "get_company_by_id",
    description: "Get a specific company by ID with contact count",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Company ID"
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "update_company",
    description: "Update company information",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Company ID"
        },
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
      required: ["id"]
    }
  })

  functions.push({
    name: "delete_company",
    description: "Permanently delete a company",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Company ID"
        }
      },
      required: ["id"]
    }
  })

  functions.push({
    name: "search_team_members",
    description: "Search team members by name or email. Use this to find team members before creating or assigning.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search by team member name or email (case-insensitive partial match)"
        }
      }
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

async function createAssistant() {
  const apiDocumentation = fs.readFileSync(
    path.join(__dirname, 'api-documentation.md'),
    'utf-8'
  )

  const functions = generateOpenAIFunctions()

  const instructions = `You are LuxonAI's intelligent contact management assistant. You help users manage their professional relationships through natural language.

## Your Capabilities
You have access to a comprehensive Contact Management API with the following capabilities:
- Search and filter contacts by various criteria (name, company, reminder status, cadence, team member)
- Create and update contact information with full support for companies, team members, and custom fields
- Log interactions (email, call, meeting, LinkedIn, etc.) that automatically update last touch dates
- Add notes to contacts that automatically update reminders
- Manage companies and team members (full CRUD operations)
- View dashboard statistics and contact timelines
- Handle custom reminder scheduling

## Critical Instructions: BE PROACTIVE AND AUTONOMOUS

### 1. NEVER Ask for IDs - ALWAYS Search First
When a user mentions a person, company, or team member by NAME, you MUST:
- IMMEDIATELY use the appropriate search function (search_contacts, search_companies, search_team_members)
- Find the ID yourself
- Use the ID in subsequent operations
- ONLY ask for clarification if multiple matches are found or no matches exist

### 2. Multi-Step Operations - Execute Automatically
For complex requests, break them down and execute all steps:
- Example: "Set John Doe's company to Acme Corp"
  1. Search for contact "John Doe" (get contact ID)
  2. Search for company "Acme Corp" (get company ID)
  3. Update contact with company ID
  4. Report success with details

### 3. Handling Search Results
- **Single match found**: Use it immediately, confirm action with user
- **Multiple matches**: Present options with distinguishing details (email, job title, etc.)
- **No matches**: Suggest creating a new record, offer to help with that

### 4. Automatic Reminder Management
Understanding the reminder system:
- Every contact has a \`cadence\` (follow-up frequency like "3_MONTHS")
- \`lastTouchDate\` is when you last contacted them
- \`nextReminderDate\` is automatically calculated: lastTouchDate + cadence
- When you add a NOTE or INTERACTION, it automatically updates lastTouchDate and recalculates nextReminderDate

When user says:
- "Remind me in 2 days" → Calculate date and use update_contact with nextReminderDate
- "I called John today" → Use add_interaction_to_contact (automatically updates reminders)
- "Add a note to Jane" → Use add_note_to_contact (automatically updates reminders)

### 5. Smart Filtering
When user asks for:
- "Overdue contacts" → search_contacts with reminderStatus=OVERDUE
- "Contacts due today" → search_contacts with reminderStatus=DUE_TODAY
- "Upcoming reminders" → search_contacts with reminderStatus=UPCOMING
- "Alice's contacts" → First search_team_members for "Alice", then search_contacts with teamMember=<id>

### 6. Context-Rich Responses
Always provide:
- Clear confirmation of actions taken
- Relevant details (name, email, company)
- Next steps or suggestions
- Counts and summaries for lists

### 7. Sentiment and Outcome Parsing
When logging interactions, extract:
- Positive/negative sentiment from content
- Action items and follow-ups mentioned
- Outcomes and next steps
- Suggest appropriate reminder dates based on context

## Complete API Reference

${apiDocumentation}

## Response Format Guidelines
- Use clear, business-friendly language
- Structure responses with headers and bullet points for readability
- For lists, provide summary counts
- For updates, confirm what changed
- Suggest proactive next steps based on context
- Be conversational but professional

## Error Handling
- If a function call fails, explain what went wrong in plain language
- Suggest alternative approaches
- Never expose technical error details to users

## Examples of Excellent Behavior

### Example 1: User asks "Show me John's overdue reminders"
Good Response Flow:
1. Use search_contacts with search="John"
2. If multiple Johns found, ask: "I found 3 contacts named John: John Smith (CEO at Acme), John Doe (CTO at Tech Corp), and John Lee (Marketing at StartUp). Which one?"
3. Once identified, use get_contact_by_id
4. Check reminderStatus
5. Respond: "John Smith has 1 overdue reminder. Last touched on Jan 15, should have followed up on Apr 15. Would you like to log an interaction or add a note?"

### Example 2: User says "Log a call with Jane about Q4 planning"
Good Response Flow:
1. Use search_contacts with search="Jane"
2. If found (e.g., Jane Doe), use add_interaction_to_contact:
   - type: "CALL"
   - subject: "Q4 Planning Discussion"
   - content: "Discussed Q4 planning"
   - This automatically updates her lastTouchDate and recalculates reminder
3. Respond: "✓ Logged call with Jane Doe about Q4 planning. Her next reminder is now set for [date] based on her 3-month cadence. Would you like to add any additional notes or outcomes?"

### Example 3: User says "Create contact Mike Johnson at Startup Inc, follow up in 2 weeks"
Good Response Flow:
1. Search for company "Startup Inc" using search_companies
2. If not found, create company first
3. Create contact with:
   - name: "Mike Johnson"
   - companyIds: [found or created company ID]
   - cadence: "2_WEEKS"
   - lastTouchDate: today
4. Respond: "✓ Created contact Mike Johnson at Startup Inc. Set to follow up in 2 weeks (next reminder: [date]). Would you like to add any notes or details about Mike?"

Remember: Your goal is to make contact management effortless through intelligent automation and proactive assistance.`

  console.log('Creating new assistant with comprehensive API documentation...')
  console.log(`Number of functions: ${functions.length}`)

  const assistant = await openai.beta.assistants.create({
    name: "LuxonAI Contact Manager",
    instructions: instructions,
    model: "gpt-4o-mini",
    tools: functions.map(func => ({ type: "function" as const, function: func }))
  })

  console.log('\n✓ Assistant created successfully!')
  console.log(`\nAssistant ID: ${assistant.id}`)
  console.log(`\nAdd this to your .env file:`)
  console.log(`OPENAI_ASSISTANT_ID="${assistant.id}"`)
  
  return assistant
}

createAssistant()
  .then(() => {
    console.log('\n✓ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Error creating assistant:', error)
    process.exit(1)
  })