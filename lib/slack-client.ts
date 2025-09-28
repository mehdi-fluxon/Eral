import { WebClient } from '@slack/web-api'
import { luxonAIAssistant } from './openai-assistant'

export class SlackClient {
  private client: WebClient
  private threadMap: Map<string, string> = new Map() // userId -> threadId

  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN)
  }

  async handleMessage(event: any) {
    try {
      // Ignore bot messages and messages in threads (for now)
      if (event.bot_id || event.thread_ts) {
        return
      }

      // Get or create thread for this user
      let threadId = this.threadMap.get(event.user)
      if (!threadId) {
        const thread = await luxonAIAssistant.createThread()
        threadId = thread.id
        this.threadMap.set(event.user, threadId)
      }

      // Process message with AI agent
      const result = await luxonAIAssistant.processMessage(threadId, event.text)

      // Format response for Slack
      const formattedResponse = this.formatResponseForSlack(result.response)

      // Send response
      await this.client.chat.postMessage({
        channel: event.channel,
        text: formattedResponse,
        thread_ts: event.ts, // Reply in thread
      })
    } catch (error) {
      console.error('Error handling Slack message:', error)
      
      // Send error message to user
      await this.client.chat.postMessage({
        channel: event.channel,
        text: '🚨 Sorry, I encountered an error processing your request. Please try again.',
        thread_ts: event.ts,
      })
    }
  }

  async handleSlashCommand(payload: any) {
    try {
      const { user_id, text, channel_id, response_url } = payload

      // Immediate response to avoid timeout
      const response = {
        text: '🤖 Processing your request...',
        response_type: 'ephemeral'
      }

      // Process command asynchronously
      this.processSlashCommandAsync(user_id, text, channel_id, response_url)

      return response
    } catch (error) {
      console.error('Error handling slash command:', error)
      return {
        text: '🚨 Sorry, I encountered an error processing your command.',
        response_type: 'ephemeral'
      }
    }
  }

  private async processSlashCommandAsync(userId: string, text: string, channelId: string, responseUrl: string) {
    try {
      // Get or create thread for this user
      let threadId = this.threadMap.get(userId)
      if (!threadId) {
        const thread = await luxonAIAssistant.createThread()
        threadId = thread.id
        this.threadMap.set(userId, threadId)
      }

      // Process message with AI agent
      const result = await luxonAIAssistant.processMessage(threadId, text)

      // Format response for Slack
      const formattedResponse = this.formatResponseForSlack(result.response)

      // Send delayed response
      await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: formattedResponse,
          response_type: 'ephemeral'
        }),
      })
    } catch (error) {
      console.error('Error processing slash command async:', error)
      
      // Send error response
      await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '🚨 Sorry, I encountered an error processing your command. Please try again.',
          response_type: 'ephemeral'
        }),
      })
    }
  }

  private formatResponseForSlack(response: string): string {
    // Convert markdown-style formatting to Slack formatting
    let formatted = response
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold: ** to *
      .replace(/\*(.*?)\*/g, '_$1_')     // Italic: * to _
      .replace(/`(.*?)`/g, '`$1`')       // Code: keep as is
      .replace(/###\s*(.*)/g, '*$1*')    // H3 headers to bold
      .replace(/##\s*(.*)/g, '*$1*')     // H2 headers to bold
      .replace(/#\s*(.*)/g, '*$1*')      // H1 headers to bold

    // Add emoji for better visual appeal
    if (formatted.includes('overdue')) {
      formatted = '🔴 ' + formatted
    } else if (formatted.includes('created') || formatted.includes('added') || formatted.includes('updated')) {
      formatted = '✅ ' + formatted
    } else if (formatted.includes('found') || formatted.includes('results')) {
      formatted = '📋 ' + formatted
    }

    return formatted
  }

  async sendDirectMessage(userId: string, message: string) {
    try {
      // Open DM channel
      const result = await this.client.conversations.open({
        users: userId
      })

      if (result.channel?.id) {
        await this.client.chat.postMessage({
          channel: result.channel.id,
          text: this.formatResponseForSlack(message)
        })
      }
    } catch (error) {
      console.error('Error sending direct message:', error)
    }
  }

  async sendToChannel(channelId: string, message: string) {
    try {
      await this.client.chat.postMessage({
        channel: channelId,
        text: this.formatResponseForSlack(message)
      })
    } catch (error) {
      console.error('Error sending channel message:', error)
    }
  }
}

export const slackClient = new SlackClient()