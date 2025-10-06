import { WebClient } from '@slack/web-api'
import { luxonAIAssistant } from '../ai-assistant/assistant'
import { executeFunction } from '../ai-assistant/functions'

export class SlackClient {
  private client: WebClient
  private threadMap: Map<string, string> = new Map() // userId -> threadId

  constructor() {
    this.client = new WebClient(process.env.SLACK_BOT_TOKEN)
  }

  private async getSlackUserEmail(userId: string): Promise<string | null> {
    try {
      const result = await this.client.users.info({ user: userId })
      return result.user?.profile?.email || null
    } catch (error) {
      console.error('Error fetching Slack user email:', error)
      return null
    }
  }

  private async getTeamMemberIdByEmail(email: string): Promise<string | null> {
    try {
      const result = await executeFunction('search_team_members', { search: email })
      if (result.teamMembers && result.teamMembers.length > 0) {
        return result.teamMembers[0].id
      }
      return null
    } catch (error) {
      console.error('Error looking up team member by email:', error)
      return null
    }
  }

  private async getTeamMemberIdForSlackUser(slackUserId: string): Promise<string | undefined> {
    console.log('🔍 [Slack] Looking up team member for Slack user:', slackUserId)

    const email = await this.getSlackUserEmail(slackUserId)
    if (!email) {
      console.log('❌ [Slack] Could not retrieve email for Slack user:', slackUserId)
      return undefined
    }

    console.log('✅ [Slack] Found email for Slack user:', email)

    const teamMemberId = await this.getTeamMemberIdByEmail(email)
    if (!teamMemberId) {
      console.log('❌ [Slack] No team member found for email:', email)
      return undefined
    }

    console.log('✅ [Slack] Found team member ID:', teamMemberId)
    return teamMemberId
  }

  private extractTextFromBlocks(blocks: Array<{
    type: string
    elements?: Array<{
      type: string
      elements?: Array<{
        type: string
        text?: string
      }>
    }>
    text?: { text: string }
  }>): string {
    let text = ''

    for (const block of blocks) {
      if (block.type === 'rich_text' && block.elements) {
        for (const element of block.elements) {
          if (element.type === 'rich_text_section' && element.elements) {
            for (const item of element.elements) {
              if (item.type === 'text' && item.text) {
                text += item.text
              }
            }
          }
        }
      } else if (block.type === 'section' && block.text && block.text.text) {
        text += block.text.text
      }
    }

    return text.trim()
  }

  async handleMessage(event: {
    bot_id?: string
    thread_ts?: string
    user: string
    text?: string
    type?: string
    channel_type?: string
    blocks?: Array<{
      type: string
      elements?: Array<{
        type: string
        elements?: Array<{
          type: string
          text?: string
        }>
      }>
      text?: { text: string }
    }>
    channel: string
    ts: string
  }) {
    try {
      // Ignore bot messages
      if (event.bot_id) {
        return
      }

      // Only respond to:
      // 1. app_mention events (when bot is @mentioned)
      // 2. Direct messages (channel_type === 'im')
      // Ignore regular channel messages without mention
      const isAppMention = event.type === 'app_mention'
      const isDirectMessage = event.channel_type === 'im' || event.channel?.startsWith('D')

      if (!isAppMention && !isDirectMessage) {
        console.log('Ignoring message - not a mention or DM')
        return
      }

      // Extract text from Slack message (handle both text and blocks)
      let messageText = event.text || ''

      // If text is empty, try to extract from blocks (rich text format)
      if (!messageText && event.blocks) {
        messageText = this.extractTextFromBlocks(event.blocks)
      }

      console.log('Extracted message text:', messageText)

      // If still no text, skip
      if (!messageText || messageText.trim() === '') {
        console.log('No text content in message, skipping')
        return
      }

      // Get team member ID for the Slack user
      const teamMemberId = await this.getTeamMemberIdForSlackUser(event.user)

      // Process message with AI agent (no thread management needed with Agents SDK)
      const result = await luxonAIAssistant.processMessage(messageText, event.user, teamMemberId)

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

  async handleSlashCommand(payload: { user_id: string; text: string; channel_id: string; response_url: string }) {
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
      // Get team member ID for the Slack user
      const teamMemberId = await this.getTeamMemberIdForSlackUser(userId)

      // Process message with AI agent (no thread management needed with Agents SDK)
      const result = await luxonAIAssistant.processMessage(text, userId, teamMemberId)

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