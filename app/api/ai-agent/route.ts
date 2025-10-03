import { NextRequest, NextResponse } from 'next/server'
import { luxonAIAssistant } from '@/ai-assistant/assistant'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * @swagger
 * /api/ai-agent:
 *   post:
 *     tags: [AI Agent]
 *     summary: Interact with LuxonAI Assistant
 *     description: Send natural language queries to the AI agent for contact management tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Natural language message to the AI agent
 *                 example: "Show me all overdue contacts"
 *             required:
 *               - message
 *     responses:
 *       200:
 *         description: AI agent response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *                   description: AI agent's response
 *                 status:
 *                   type: string
 *                   description: Processing status
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the team member ID for this user
    const teamMember = await prisma.teamMember.findUnique({
      where: { email: session.user.email }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found for this user' },
        { status: 404 }
      )
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Process the message with user context and conversation state
    const startTime = Date.now()
    const result = await luxonAIAssistant.processMessage(
      message,
      session.user.id!, // User ID for conversation state
      teamMember.id
    )
    const duration = Date.now() - startTime

    // Log conversation for analytics
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      userEmail: session.user.email,
      teamMemberId: teamMember.id,
      question: message,
      response: result.response,
      status: result.success ? result.status : 'error',
      duration,
      type: 'ai_conversation'
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI Agent API error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI agent request' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/ai-agent:
 *   get:
 *     tags: [AI Agent]
 *     summary: Get agent status
 *     description: Check if the AI agent is available and ready
 *     responses:
 *       200:
 *         description: Agent is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Agent status
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ready',
      message: 'AI Agent is ready to process requests'
    })
  } catch (error) {
    console.error('Failed to get agent status:', error)
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    )
  }
}