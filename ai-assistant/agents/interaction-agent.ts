import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const interactionAgent = new Agent({
  name: 'Interaction Agent',
  handoffDescription: 'Specialist for logging PAST interactions like calls, meetings, emails - automatically updates last touch date',
  instructions: `You log PAST interactions with contacts. You will receive a contact ID that has been resolved.

CRITICAL RULES:
1. ONLY log PAST/COMPLETED interactions (keywords: "talked", "called", "met", "emailed", "discussed", "spoke")
2. Log the interaction and confirm briefly: "Logged [type] with [contact name]"
3. Require EXACTLY ONE contact ID - if you receive multiple IDs or unclear request, ask for clarification
4. DO NOT handle future actions - the Router will handle those separately
4. Calculate dates for temporal references:
   - "yesterday" = today's date - 1 day
   - "last week" = 7 days ago
   - "2 days ago" = today - 2 days
   - Use YYYY-MM-DD format
5. When logging interaction, lastTouchDate is automatically updated and reminders recalculated
6. Extract the type of interaction: EMAIL, CALL, MEETING, LINKEDIN, FOLLOWUP, PROPOSAL, OTHER

NEVER EVER:
- Handle future actions or set reminders (Router will handle those separately)
- Update contact fields like email or job title
- Search for contacts (already done by Router)
- Log interactions to multiple contacts at once
- Mention handing off to other agents (internal implementation detail)

Context you'll receive:
- Today's date
- Team member ID
- Contact ID (from router)`,


  tools: [
    tool({
      name: 'add_interaction_to_contact',
      description: 'Log a PAST interaction (call, email, meeting) with a contact',
      parameters: z.object({
        contactId: z.string().describe('Contact ID - must be exactly one contact'),
        type: z.enum(['EMAIL', 'CALL', 'MEETING', 'LINKEDIN', 'FOLLOWUP', 'PROPOSAL', 'OTHER']).describe('Type of interaction'),
        subject: z.string().nullable().optional().describe('Subject line or title of interaction'),
        content: z.string().describe('Details of what was discussed or communicated'),
        interactionDate: z.string().nullable().optional().describe('Date of interaction in YYYY-MM-DD format, defaults to today if not provided'),
        teamMemberId: z.string().describe('ID of team member logging this interaction'),
        updateLastTouch: z.boolean().default(true).describe('Whether to update contact last touch date - should always be true for past interactions')
      }),
      execute: async (args: any) => executeFunction('add_interaction_to_contact', args)
    }),

    tool({
      name: 'add_note_to_contact',
      description: 'Add a general note to a contact (not a specific interaction)',
      parameters: z.object({
        contactId: z.string().describe('Contact ID'),
        content: z.string().describe('Note content'),
        teamMemberId: z.string().describe('ID of team member creating the note'),
        noteDate: z.string().nullable().optional().describe('Note date in YYYY-MM-DD format, defaults to today')
      }),
      execute: async (args: any) => executeFunction('add_note_to_contact', args)
    })
  ]
})
