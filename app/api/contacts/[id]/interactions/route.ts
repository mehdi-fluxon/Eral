import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateNextReminderDate } from '@/lib/cadence'

/**
 * @swagger
 * /api/contacts/{id}/interactions:
 *   post:
 *     tags: [Interactions]
 *     summary: Log interaction with contact
 *     description: Create a new interaction (call, email, meeting, etc.) for a specific contact. Automatically updates last touch date and recalculates reminders if updateLastTouch is true.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *         example: "cmg39beol0001itk77arer899"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInteractionRequest'
 *     responses:
 *       201:
 *         description: Interaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contactId } = await params
    const {
      type,
      subject,
      content,
      outcome,
      interactionDate,
      teamMemberId,
      updateLastTouch
    } = await request.json()

    if (!type || !content || !teamMemberId) {
      return NextResponse.json(
        { error: 'Type, content, and team member are required' },
        { status: 400 }
      )
    }

    const date = interactionDate ? new Date(interactionDate) : new Date()

    const interaction = await prisma.interaction.create({
      data: {
        contactId,
        teamMemberId,
        type,
        subject: subject || null,
        content,
        outcome: outcome || null,
        interactionDate: date
      },
      include: {
        teamMember: true
      }
    })

    if (updateLastTouch) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { cadence: true }
      })

      if (contact) {
        const nextReminder = calculateNextReminderDate(date, contact.cadence)
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            lastTouchDate: date,
            nextReminderDate: nextReminder
          }
        })
      }
    }

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('Failed to create interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}