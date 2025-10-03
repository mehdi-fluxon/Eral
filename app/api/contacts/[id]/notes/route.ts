import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/contacts/{id}/notes:
 *   post:
 *     tags: [Notes]
 *     summary: Add note to contact
 *     description: Create a new note for a specific contact
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
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *     responses:
 *       201:
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
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
    const { content, teamMemberId, noteDate } = await request.json()

    if (!content || !teamMemberId) {
      return NextResponse.json(
        { error: 'Content and team member are required' },
        { status: 400 }
      )
    }

    // Use provided noteDate or default to now
    const timestamp = noteDate ? new Date(noteDate) : new Date()

    // Create note and update contact's lastTouchDate in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the note with custom timestamp
      const note = await tx.note.create({
        data: {
          contactId,
          teamMemberId,
          content,
          createdAt: timestamp
        },
        include: {
          teamMember: true
        }
      })

      // Update contact's lastTouchDate and recalculate nextReminderDate
      const contact = await tx.contact.findUnique({
        where: { id: contactId }
      })

      if (contact) {
        const now = timestamp
        const nextReminderDate = new Date(now)
        
        // Calculate next reminder based on cadence
        switch (contact.cadence) {
          case '1_DAY':
            nextReminderDate.setDate(nextReminderDate.getDate() + 1)
            break
          case '2_DAYS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 2)
            break
          case '3_DAYS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 3)
            break
          case '5_DAYS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 5)
            break
          case '7_DAYS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 7)
            break
          case '2_WEEKS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 14)
            break
          case '3_WEEKS':
            nextReminderDate.setDate(nextReminderDate.getDate() + 21)
            break
          case '1_MONTH':
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 1)
            break
          case '2_MONTHS':
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 2)
            break
          case '3_MONTHS':
          default:
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 3)
            break
          case '6_MONTHS':
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 6)
            break
          case '9_MONTHS':
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 9)
            break
          case '12_MONTHS':
            nextReminderDate.setFullYear(nextReminderDate.getFullYear() + 1)
            break
          case '18_MONTHS':
            nextReminderDate.setMonth(nextReminderDate.getMonth() + 18)
            break
          case '24_MONTHS':
            nextReminderDate.setFullYear(nextReminderDate.getFullYear() + 2)
            break
        }

        await tx.contact.update({
          where: { id: contactId },
          data: {
            lastTouchDate: now,
            nextReminderDate: nextReminderDate
          }
        })
      }

      return note
    })

    const note = result

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}