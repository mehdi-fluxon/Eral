import { NextRequest, NextResponse } from 'next/server'
import { luxonAIAssistant } from '@/ai-assistant/assistant'

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
 *               threadId:
 *                 type: string
 *                 description: Conversation thread ID (optional, will create new if not provided)
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
 *                 threadId:
 *                   type: string
 *                   description: Conversation thread ID for follow-up messages
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
    const { message, threadId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Create new thread if none provided
    let currentThreadId = threadId
    if (!currentThreadId) {
      const thread = await luxonAIAssistant.createThread()
      currentThreadId = thread.id
    }

    // Process the message
    const result = await luxonAIAssistant.processMessage(currentThreadId, message)

    return NextResponse.json({
      ...result,
      threadId: currentThreadId
    })
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
 *     summary: Create new conversation thread
 *     description: Create a new conversation thread for the AI agent
 *     responses:
 *       200:
 *         description: New thread created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: string
 *                   description: New conversation thread ID
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET() {
  try {
    const thread = await luxonAIAssistant.createThread()
    
    return NextResponse.json({
      threadId: thread.id
    })
  } catch (error) {
    console.error('Failed to create thread:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation thread' },
      { status: 500 }
    )
  }
}