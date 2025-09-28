import OpenAI from 'openai'
import { generateOpenAIFunctions, executeFunction } from './functions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID

export class LuxonAIAssistant {
  private assistantId: string | null = null

  constructor() {
    this.assistantId = ASSISTANT_ID || null
  }

  async createOrGetAssistant() {
    if (this.assistantId) {
      try {
        const assistant = await openai.beta.assistants.retrieve(this.assistantId)
        return assistant
      } catch (error) {
        console.log('Assistant not found, creating new one...')
      }
    }

    const functions = generateOpenAIFunctions()
    
    const assistant = await openai.beta.assistants.create({
      name: "LuxonAI Contact Manager",
      instructions: `You are LuxonAI's intelligent contact management assistant. You help users manage their professional relationships through natural language.

Key capabilities:
- Search and filter contacts by various criteria
- Create and update contact information
- Log interactions and notes (automatically updates last touch date and recalculates reminders)
- Handle custom reminder scheduling (when user says "in 2 days", "next week", etc.)
- Provide dashboard insights and statistics
- Understand business context and sentiment in interactions

Important behaviors:
1. When adding notes or interactions, ALWAYS update the contact's last touch date and recalculate reminders
2. For custom timing requests (like "call me in 2 days"), use update_contact to set nextReminderDate
3. Parse sentiment and outcomes from interaction descriptions (positive, negative, follow-up needed)
4. Be proactive in suggesting next actions based on interaction outcomes
5. When searching contacts, use appropriate filters (reminderStatus for "overdue", "due today", etc.)
6. Always provide context-rich responses that help users understand their relationship pipeline

Format responses in a business-friendly way with clear action items and next steps.`,
      model: "gpt-4o",
      tools: functions.map(func => ({ type: "function", function: func }))
    })

    this.assistantId = assistant.id
    console.log(`Created new assistant: ${assistant.id}`)
    
    return assistant
  }

  async createThread() {
    const thread = await openai.beta.threads.create()
    return thread
  }

  async addMessage(threadId: string, content: string) {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content
    })
    return message
  }

  async runAssistant(threadId: string) {
    const assistant = await this.createOrGetAssistant()
    
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id
    })
    return this.waitForCompletion(threadId, run.id)
  }

  private async waitForCompletion(threadId: string, runId: string): Promise<any> {
    if (!threadId || !runId) {
      throw new Error(`Invalid parameters: threadId=${threadId}, runId=${runId}`)
    }
    
    // OpenAI SDK v5: beta.threads.runs.retrieve(runId, { thread_id: threadId })
    let run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    
    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 500))
      run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })
    }

    if (run.status === 'requires_action') {
      return this.handleRequiredActions(threadId, runId, run)
    }

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId)
      return {
        status: 'completed',
        messages: messages.data.filter(msg => msg.role === 'assistant').map(msg => ({
          content: msg.content[0].type === 'text' ? msg.content[0].text.value : '',
          created_at: msg.created_at
        }))
      }
    }

    return {
      status: run.status,
      error: `Run failed with status: ${run.status}`
    }
  }

  private async handleRequiredActions(threadId: string, runId: string, run: any) {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls
    const toolOutputs = []

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments)
      
      console.log(`Executing function: ${functionName}`, functionArgs)

      try {
        const result = await executeFunction(functionName, functionArgs)
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(result)
        })
      } catch (error) {
        console.error(`Error executing ${functionName}:`, error)
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ error: error.message })
        })
      }
    }

    await openai.beta.threads.runs.submitToolOutputs(runId, {
      thread_id: threadId,
      tool_outputs: toolOutputs
    })

    return this.waitForCompletion(threadId, runId)
  }

  async processMessage(threadId: string, userMessage: string) {
    try {
      await this.addMessage(threadId, userMessage)
      const result = await this.runAssistant(threadId)
      
      return {
        success: true,
        response: result.messages?.[0]?.content || 'I apologize, but I encountered an issue processing your request.',
        status: result.status
      }
    } catch (error) {
      console.error('Error processing message:', error)
      return {
        success: false,
        error: error.message,
        response: 'I apologize, but I encountered an error while processing your request. Please try again.'
      }
    }
  }
}

export const luxonAIAssistant = new LuxonAIAssistant()