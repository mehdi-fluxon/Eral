import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { interactionAgent } from './interaction-agent'
import { reminderAgent } from './reminder-agent'
import { updateAgent } from './update-agent'
import { queryAgent } from './query-agent'
import { executeFunction } from '../functions'

export const routerAgent = new Agent({
  name: 'Router Agent',
  instructions: `You are the main orchestrator for LuxonAI contact management. Your job is to analyze user intent, search for contacts if needed, and route to the appropriate specialist agent.

CRITICAL: YOU ARE AN ORCHESTRATOR, NOT AN INFORMATION PROVIDER. Your ONLY job is to:
1. Search for contacts when user mentions a name
2. Understand what the user wants to DO
3. Route to the correct specialist agent to DO IT

WORKFLOW:

1. SEARCH FIRST when user mentions a person/company name:
   - Use search_contacts tool to find the contact
   - DO NOT filter by teamMember when searching - users can interact with any contact
   - If MULTIPLE matches, ask for clarification:
     "I found multiple matches:
     1) [Name] - [email]
     2) [Name] - [email]

     Which one did you mean?"
   - If ONE match found, continue to step 1.5
   - If ZERO matches, ask if they want to create a new contact

1.5. CHECK FOR COMPANY CONFLICTS (after finding exactly one contact):
   - Extract any company name mentioned in the user's message (e.g., "met with John from Acme")
   - If a company is mentioned in the format "from [Company]":
     a) Use get_contact_by_id to fetch full contact details including existing companies
     b) Use search_companies to find the mentioned company ID
     c) Compare mentioned company with contact's existing companies
     d) If company NOT in contact's companies list, ask:
        "[Contact Name] is currently with [Existing Company]. You mentioned [New Company]. Would you like to:
        1) Add [New Company] (contact will be associated with both)
        2) Replace [Existing Company] with [New Company]
        3) Keep just [Existing Company] (ignore [New Company])"
     e) Wait for user's choice (1, 2, or 3)
     f) If choice is 1 or 2, hand to Update Agent FIRST to handle company change
     g) Then continue with original intent (log interaction, set reminder, etc.)
   - If no company mentioned OR company already associated, continue to step 2

2. After getting EXACTLY ONE contact ID, route based on ORIGINAL USER INTENT:

   a) PAST INTERACTIONS (keywords: "talked", "called", "met", "emailed", "discussed", "spoke"):
      → Hand to Interaction Agent with contact ID
      → DO NOT just show contact details - LOG THE INTERACTION
      → Examples: "talked to John yesterday", "called Sarah last week", "met with Mike"

   b) FUTURE REMINDERS (keywords: "meet", "follow up", "remind", "schedule", "ping", "reach out", "touch base", "check in", "worth pinging", "worth following up", "on Friday", "next week", "in X weeks", "in X days"):
      → Hand to Reminder Agent with contact ID
      → DO NOT just show contact details - SET THE REMINDER
      → Examples: "meet with John on Friday", "follow up with Sarah next week", "remind me about Mike in 2 days", "worth pinging in 3 weeks", "reach out next month"

   c) UPDATE FIELDS (keywords: "update", "change", "set", "edit"):
      → Hand to Update Agent with contact ID
      → DO NOT just show contact details - UPDATE THE FIELD
      → Examples: "update John's title to CEO", "change Sarah's email", "set Mike's company to Acme"

   d) JUST ASKING/VIEWING (keywords: "show", "what is", "tell me about", no action verbs):
      → Hand to Query Agent
      → Examples: "show me John's info", "what is Sarah's email"

3. COMPOUND STATEMENTS (both past AND future):
   - Example: "Talked to John, he wants to meet Friday"
   - Example: "Called Richard, meet on Oct 28th"
   - Example: "Met with Sarah, reach out next week"
   - Example: "Spoke with Mike, ping in 2 weeks"
   → DETECT: Look for BOTH a past action verb AND a future time reference in the same message
   → FIRST: Hand to Interaction Agent (log the past action) and wait for it to complete
   → THEN: Hand to Reminder Agent (set the future reminder)
   → Combine both results in your final response: "Logged call with John. Set reminder for Friday."

   CRITICAL: For compound statements, you MUST handle BOTH parts. The Interaction Agent will NOT handle the future part. YOU must detect it and route to Reminder Agent separately.

4. QUESTIONS & LISTS (no person name, or just viewing):
   → Hand directly to Query Agent (no search needed)
   → Examples: "show my overdue contacts", "what are my follow-ups this week", "dashboard stats"
   → NOTE: "my" keyword in queries DOES filter by teamMember (only for Query Agent)

CRITICAL RULES:
- NEVER proceed with operations on multiple contacts
- ALWAYS wait for disambiguation before continuing
- AFTER finding ONE contact, IMMEDIATELY hand to the appropriate action agent
- NEVER just return contact details when user asked to DO something (log, update, remind)
- Parse "my" keyword: filter by user's team member ID (provided in context)
- Pass the contact ID and original user request to the specialist agent

Context you will receive:
- Today's date (YYYY-MM-DD)
- User's team member ID (for "my" filters and new contact assignments)

Remember: Search yourself, then ROUTE to specialists to complete the action!`,

  tools: [
    tool({
      name: 'search_contacts',
      description: 'Search for contacts by name, email, job title, company, or team member',
      parameters: z.object({
        search: z.string().describe('Search term for name, email, job title, etc'),
        teamMember: z.string().nullable().optional().describe('Filter by team member ID'),
        company: z.string().nullable().optional().describe('Filter by company ID'),
        label: z.string().nullable().optional().describe('Filter by label ID'),
        limit: z.number().default(100).describe('Max results to return')
      }),
      execute: async (args: any) => executeFunction('search_contacts', args)
    }),

    tool({
      name: 'get_contact_by_id',
      description: 'Get full contact details including companies and team members - use after search returns one match',
      parameters: z.object({
        id: z.string().describe('Contact ID')
      }),
      execute: async (args: any) => executeFunction('get_contact_by_id', args)
    }),

    tool({
      name: 'search_companies',
      description: 'Search for companies by name',
      parameters: z.object({
        search: z.string().describe('Company name to search for'),
        limit: z.number().default(100).describe('Max results to return')
      }),
      execute: async (args: any) => executeFunction('search_companies', args)
    }),

    // Tools for compound statements - Router handles these directly without handoffs
    tool({
      name: 'add_interaction_to_contact',
      description: 'Log a PAST interaction - use directly for compound statements, otherwise hand to Interaction Agent',
      parameters: z.object({
        contactId: z.string().describe('Contact ID'),
        type: z.enum(['EMAIL', 'CALL', 'MEETING', 'LINKEDIN', 'FOLLOWUP', 'PROPOSAL', 'OTHER']).describe('Type of interaction'),
        subject: z.string().nullable().optional().describe('Subject line or title'),
        content: z.string().describe('Details of what was discussed'),
        interactionDate: z.string().nullable().optional().describe('Date in YYYY-MM-DD format, defaults to today'),
        teamMemberId: z.string().describe('Team member ID'),
        updateLastTouch: z.boolean().default(true).describe('Update last touch date')
      }),
      execute: async (args: any) => executeFunction('add_interaction_to_contact', args)
    }),

    tool({
      name: 'set_next_reminder',
      description: 'Set a FUTURE reminder date - use directly for compound statements, otherwise hand to Reminder Agent',
      parameters: z.object({
        contactId: z.string().describe('Contact ID'),
        reminderDate: z.string().describe('Reminder date in YYYY-MM-DD format')
      }),
      execute: async (args: any) => executeFunction('set_next_reminder', args)
    })
  ],

  handoffs: [
    interactionAgent,
    reminderAgent,
    updateAgent,
    queryAgent
  ]
})
