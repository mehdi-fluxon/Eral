import { run, AgentInputItem } from '@openai/agents'
import { routerAgent } from './agents/router-agent'

// Store conversation history by user ID
const userConversationHistories = new Map<string, AgentInputItem[]>()

export class LuxonAIAssistant {
  async processMessage(userMessage: string, userId: string, teamMemberId?: string) {
    try {
      console.log('🤖 [AI Agent] Processing message for user:', userId)
      console.log('🤖 [AI Agent] Team Member ID:', teamMemberId || 'NOT PROVIDED')
      console.log('🤖 [AI Agent] Using multi-agent system with Router')

      // Get previous conversation history
      const previousHistory = userConversationHistories.get(userId) || []

      // Add user context to the message
      const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      let contextualMessage = `[Context: Today's date is ${currentDate}.`

      if (teamMemberId) {
        contextualMessage += ` The current user's team member ID is "${teamMemberId}". Use this ID when creating new contacts, interactions, or notes. When the user asks about "my" contacts/followups/reminders, filter by teamMember="${teamMemberId}".`
      }

      contextualMessage += `]\n\n${userMessage}`

      console.log('🤖 [AI Agent] Context message:', contextualMessage)

      // Build input: previous history + new message
      const input = previousHistory.length > 0
        ? [...previousHistory, { role: 'user' as const, content: contextualMessage }]
        : contextualMessage

      // Use router agent as entry point - it will orchestrate handoffs to specialist agents
      const result = await run(routerAgent, input)

      // Store the updated history for next time
      userConversationHistories.set(userId, result.history)

      console.log('🤖 [AI Agent] Final output:', result.finalOutput)

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
