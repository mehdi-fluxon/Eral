import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const queryAgent = new Agent({
  name: 'Query Agent',
  handoffDescription: 'Specialist for answering questions, showing contact lists, stats, and timelines - READ-ONLY operations',
  instructions: `You answer questions and provide information. READ-ONLY operations only.

Your responsibilities:
- Show contact lists filtered by various criteria (overdue, due this week, by company, by label, etc.)
- Display dashboard statistics
- Show interaction timeline/history for contacts
- Answer "when is" questions about reminder dates
- List contacts by team member

Response formatting - BE CONCISE:
For contact lists, use this format:
**[Name]** - [email]
Next: YYYY-MM-DD

(blank line between contacts)

Rules:
- If contact has NO email, omit the email line entirely (just show: **Name**)
- If contact has NO reminder date, omit the "Next:" line
- PRESERVE the order from API - it's already sorted
- NO introductions like "Here are your contacts"
- NO "Next Steps" or suggestions

For stats/dashboard: Show clear numbers with labels

NEVER EVER:
- Update any data
- Log interactions
- Set reminders
- Create contacts

Context you'll receive:
- Today's date (for calculating date ranges)
- Team member ID (for filtering "my contacts")`,

  tools: [
    tool({
      name: 'search_contacts',
      description: 'Search and filter contacts with various criteria',
      parameters: z.object({
        search: z.string().optional().describe('Free-text search across name, email, job title'),
        startDate: z.string().optional().describe('Filter contacts with nextReminderDate >= this date (YYYY-MM-DD)'),
        endDate: z.string().optional().describe('Filter contacts with nextReminderDate <= this date (YYYY-MM-DD)'),
        reminderStatus: z.enum(['OVERDUE', 'DUE_TODAY', 'DUE_THIS_WEEK', 'UPCOMING', 'NO_REMINDER']).optional().describe('Preset reminder status filter'),
        teamMember: z.string().optional().describe('Filter by team member ID'),
        company: z.string().optional().describe('Filter by company ID'),
        label: z.string().optional().describe('Filter by label ID'),
        cadence: z.string().optional().describe('Filter by cadence value'),
        page: z.number().optional().describe('Page number for pagination'),
        limit: z.number().default(100).describe('Results per page')
      }),
      execute: async (args: any) => executeFunction('search_contacts', args)
    }),

    tool({
      name: 'get_dashboard_stats',
      description: 'Get dashboard statistics (total contacts, overdue, due this week, etc.)',
      parameters: z.object({
        teamMember: z.string().optional().describe('Filter stats by team member ID')
      }),
      execute: async (args: any) => executeFunction('get_dashboard_stats', args)
    }),

    tool({
      name: 'get_contact_timeline',
      description: 'Get chronological timeline of interactions and notes for a contact',
      parameters: z.object({
        contactId: z.string().describe('Contact ID')
      }),
      execute: async (args: any) => executeFunction('get_contact_timeline', args)
    }),

    tool({
      name: 'get_labels',
      description: 'Get all available labels in the system',
      parameters: z.object({}),
      execute: async () => executeFunction('get_labels', {})
    }),

    tool({
      name: 'calculate_date_range',
      description: 'Calculate date ranges for time-based queries (this_week, next_week, this_month, etc.)',
      parameters: z.object({
        range: z.enum(['today', 'this_week', 'next_week', 'this_month', 'next_month', 'overdue']).describe('Time range to calculate')
      }),
      execute: async (args: any) => executeFunction('calculate_date_range', args)
    })
  ]
})
