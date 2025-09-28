import { NextRequest, NextResponse } from 'next/server'
import { slackClient } from '@/lib/slack-client'

/**
 * @swagger
 * /api/slack/command:
 *   post:
 *     tags: [Slack Integration] 
 *     summary: Handle Slack slash commands
 *     description: Handle slash commands like /luxonai to interact with the AI agent
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               team_id:
 *                 type: string
 *               team_domain:
 *                 type: string
 *               channel_id:
 *                 type: string
 *               channel_name:
 *                 type: string
 *               user_id:
 *                 type: string
 *               user_name:
 *                 type: string
 *               command:
 *                 type: string
 *               text:
 *                 type: string
 *               response_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Command processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 response_type:
 *                   type: string
 *                   enum: [ephemeral, in_channel]
 *       400:
 *         description: Invalid command payload
 */

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Slack
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries())

    // Verify it's a valid Slack request (you should implement proper verification)
    if (!payload.token || !payload.user_id) {
      return NextResponse.json(
        { error: 'Invalid Slack request' },
        { status: 400 }
      )
    }

    // Handle the slash command
    const response = await slackClient.handleSlashCommand(payload)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Slack slash command error:', error)
    return NextResponse.json(
      { 
        text: '🚨 Sorry, I encountered an error processing your command.',
        response_type: 'ephemeral'
      },
      { status: 500 }
    )
  }
}