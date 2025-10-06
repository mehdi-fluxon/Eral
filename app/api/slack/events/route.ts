import { NextRequest, NextResponse } from 'next/server'
import { slackClient } from '@/lib/slack-client'

/**
 * @swagger
 * /api/slack/events:
 *   post:
 *     tags: [Slack Integration]
 *     summary: Handle Slack Events API
 *     description: Webhook endpoint for Slack Events API to handle messages and interactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [url_verification, event_callback]
 *               challenge:
 *                 type: string
 *                 description: Challenge token for URL verification
 *               event:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   user:
 *                     type: string
 *                   text:
 *                     type: string
 *                   channel:
 *                     type: string
 *                   ts:
 *                     type: string
 *     responses:
 *       200:
 *         description: Event processed successfully
 *       400:
 *         description: Invalid event payload
 */

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log('Slack event received:')

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      console.log('Responding to URL verification with challenge:', payload.challenge)
      return NextResponse.json({ challenge: payload.challenge })
    }

    // Handle event callbacks
    if (payload.type === 'event_callback') {
      const event = payload.event

      // Handle app mentions and direct messages
      if (event.type === 'app_mention' || event.type === 'message') {
        // Ignore messages from bots
        if (event.bot_id) {
          return NextResponse.json({ status: 'ignored' })
        }

        // Process message asynchronously to avoid timeout
        setImmediate(async () => {
          try {
            await slackClient.handleMessage(event)
          } catch (error) {
            console.error('Error processing Slack message:', error)
          }
        })

        return NextResponse.json({ status: 'processing' })
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Slack events webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process Slack event' },
      { status: 500 }
    )
  }
}