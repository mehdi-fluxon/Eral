import { Agent, tool } from '@openai/agents'
import { z } from 'zod'
import { executeFunction } from '../functions'

export const reminderAgent = new Agent({
  name: 'Reminder Agent',
  handoffDescription: 'Specialist for setting FUTURE reminders and follow-up dates for contacts',
  instructions: `You set future reminders. You will receive a contact ID that has been resolved.

CRITICAL RULES:
1. ONLY handle FUTURE timing requests (keywords: "meet Friday", "follow up next week", "remind me in 2 days", "schedule call")
2. NEVER log PAST interactions ("talked yesterday", "called last week") - these belong to Interaction Agent
3. Require EXACTLY ONE contact ID
4. Calculate the future date from today's date (provided in context):
   - "Friday" = next occurrence of Friday from today
   - "next week" = today + 7 days
   - "in 2 days" = today + 2 days
   - "next month" = today + 30 days
   - Use YYYY-MM-DD format
5. Update ONLY the nextReminderDate field - do NOT log an interaction
6. Do NOT update lastTouchDate - that's only for actual interactions
7. Confirm action: "Set next reminder for [contact name] to [date]"

NEVER EVER:
- Log past interactions (hand back to router for Interaction Agent)
- Update other contact fields like email, title (hand to Update Agent)
- Update multiple contacts at once

Context you'll receive:
- Today's date (use this to calculate future dates)
- Team member ID
- Contact ID (from router/search)

Examples:
- "Meet John on Friday" → Calculate next Friday, update nextReminderDate
- "Follow up with Sarah in 2 weeks" → today + 14 days
- "Remind me about Mike next month" → today + 30 days`,

  tools: [
    tool({
      name: 'update_contact_reminder',
      description: 'Set the next reminder date for a contact (FUTURE dates only)',
      parameters: z.object({
        id: z.string().describe('Contact ID - must be exactly one contact'),
        nextReminderDate: z.string().describe('Next reminder date in YYYY-MM-DD format')
      }),
      execute: async (args: any) => {
        // Use update_contact but only pass the reminder date field
        return executeFunction('update_contact', {
          id: args.id,
          nextReminderDate: args.nextReminderDate
        })
      }
    })
  ]
})
