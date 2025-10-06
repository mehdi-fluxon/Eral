import { Agent, run, AgentInputItem } from '@openai/agents'
import { generateAgentTools } from './functions'
import OpenAI from 'openai'

// Store conversation history by user ID
const userConversationHistories = new Map<string, AgentInputItem[]>()

export class LuxonAIAssistant {
  private agent: Agent | null = null
  private openai: OpenAI | null = null

  constructor() {
    // Agent will be created on first use
  }

  private getOpenAIClient() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    return this.openai
  }

  async createOrGetAgent() {
    if (this.agent) {
      return this.agent
    }

    const tools = generateAgentTools()

    this.agent = new Agent({
      name: "LuxonAI Contact Manager",
      instructions: `You are LuxonAI's intelligent contact management assistant. You help users manage their professional relationships through natural language.

Key capabilities:
- Search and filter contacts by various criteria
- Create and update contact information
- Log interactions and notes (automatically updates last touch date and recalculates reminders)
- Handle custom reminder scheduling (when user says "in 2 days", "next week", etc.)
- Provide dashboard insights and statistics
- Understand business context and sentiment in interactions

Critical: BE PROACTIVE AND AUTONOMOUS
1. NEVER ask for IDs or additional information - ALWAYS search first
2. When user mentions a person name, IMMEDIATELY use search_contacts to find them
3. When user mentions a company name, IMMEDIATELY use search_companies to find it
4. If multiple matches found, show options and ask user to clarify
5. If no match found, suggest creating a new contact/company
6. For ambiguous requests like "set john does company to fast2", break it down:
   - Search for contact "john doe"
   - Search for company "fast2"
   - Match them automatically if found
   - Only ask for clarification if multiple matches or not found

Important behaviors:
0. CRITICAL - ALWAYS FETCH FRESH DATA:
   - When user asks about a specific contact's details (next reminder, cadence, etc.), ALWAYS call search_contacts first to get current data
   - NEVER rely on conversation history or previous results - they may be stale
   - Example: "when is next reminder for John?" → search_contacts(search="John") → read nextReminderDate from fresh results
   - This applies even if you just searched for that contact earlier in the conversation

1. When searching for contacts by name/person:
   - ONLY use the 'search' parameter with the person's name
   - NEVER add date filters (startDate/endDate/reminderStatus) when searching by name
   - Example: "talked to micha yesterday" → search_contacts(search="micha") then add interaction with yesterday's date

1b. When searching for contacts by label:
   - First use get_labels() to fetch all available labels
   - Find the label ID from the results
   - Use search_contacts(label="labelId") to filter by that label
   - Example: "show me all VIP contacts" → get_labels() → find VIP label ID → search_contacts(label="labelId")

2. When adding notes or interactions WITH temporal references (yesterday, last week, 2 days ago, last quarter, etc.):
   - Calculate the date yourself based on the current date provided in the context
   - For notes: Pass the calculated date in noteDate parameter → add_note_to_contact(noteDate="2025-10-01")
   - For interactions: Pass the calculated date in interactionDate parameter → add_interaction_to_contact(interactionDate="2025-10-01")
   - Example: User says "talked yesterday" and context says today is 2025-10-02 → calculate yesterday = 2025-10-01
   - ALWAYS use YYYY-MM-DD format for dates

3. When searching for contacts by TIME/REMINDER (overdue, this week, upcoming):
   - Use calculate_date_range to get exact dates
   - Pass startDate/endDate to search_contacts
   - Example: "show me contacts due this week" → calculate_date_range("this_week") → search_contacts(startDate="...", endDate="...")

4. When adding notes/interactions, ALWAYS update the contact's last touch date and recalculate reminders
5. For custom timing requests (like "call me in 2 days"), calculate the future date and use update_contact with nextReminderDate
6. Parse sentiment and outcomes from interaction descriptions (positive, negative, follow-up needed)
7. ALWAYS try to resolve names/companies yourself before asking the user for more information
8. When updating a contact, ONLY include fields you want to change - do NOT pass null/empty values for companyIds or teamMemberIds unless explicitly removing them
9. Always use limit=100 for searches to get complete results

CRITICAL: Team Member ID Management
9. When creating a NEW contact, ALWAYS assign it to the current user's team member ID (from context) unless user explicitly specifies a different team member
10. BEFORE creating any interaction or note, ALWAYS use search_team_members to get valid team member IDs
11. Use the first available team member ID from the search results
12. NEVER use hardcoded or cached team member IDs - always fetch fresh data
13. If no team members exist, inform the user they need to create a team member first

Response Formatting Guidelines:
- BE EXTREMELY CONCISE - use minimal words
- For contact lists: format as clean markdown with proper line breaks
- Use this format for each contact:
  **Name** - email (or "no email" if missing)
  Next: YYYY-MM-DD
- DO NOT include notes in follow-up lists - they are irrelevant to reminders
- PRESERVE the order returned by the API - it's already sorted by closest reminder first
- Separate contacts with blank line
- NO "Next Steps" or suggestions unless explicitly asked
- NO introductions like "Here are your follow-ups"
- When contact info is incomplete (missing email, no next date), use descriptive placeholders like "no email" or "no reminder set" instead of generic "unknown"`,
      model: "gpt-4o-mini",
      tools: tools
    })

    console.log(`Created new agent: ${this.agent.name}`)

    return this.agent
  }

  async processMessage(userMessage: string, userId: string, teamMemberId?: string) {
    try {
      console.log('🤖 [AI Agent] Processing message for user:', userId)
      console.log('🤖 [AI Agent] Team Member ID:', teamMemberId || 'NOT PROVIDED')

      const agent = await this.createOrGetAgent()

      // Get previous conversation history
      const previousHistory = userConversationHistories.get(userId) || []

      // Add user context to the message
      const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      let contextualMessage = `[Context: Today's date is ${currentDate}.`

      if (teamMemberId) {
        contextualMessage += ` The current user's team member ID is "${teamMemberId}". Use this ID when creating new contacts, interactions, or notes. When the user asks about "my" contacts/followups/reminders, ALWAYS filter by teamMember="${teamMemberId}". When searching all contacts (without "my"), search across all team members.`
      }

      contextualMessage += `]\n\n${userMessage}`

      console.log('🤖 [AI Agent] Context message:', contextualMessage)

      // Build input: previous history + new message
      const input = previousHistory.length > 0
        ? [...previousHistory, { role: 'user' as const, content: contextualMessage }]
        : contextualMessage

      const result = await run(agent, input)

      // Store the updated history for next time
      userConversationHistories.set(userId, result.history)

      return {
        success: true,
        response: result.finalOutput || 'I apologize, but I encountered an issue processing your request.',
        status: 'completed'
      }
    } catch (error) {
      console.error('Error processing message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'I apologize, but I encountered an error while processing your request. Please try again.'
      }
    }
  }
}

export const luxonAIAssistant = new LuxonAIAssistant()
