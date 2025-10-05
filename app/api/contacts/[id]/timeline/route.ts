import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/contacts/{id}/timeline:
 *   get:
 *     tags: [Timeline]
 *     summary: Get contact activity timeline
 *     description: Retrieve chronological timeline of notes and interactions for a contact
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *         example: "cmg39beol0001itk77arer899"
 *     responses:
 *       200:
 *         description: Timeline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimelineItem'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const interactions = await prisma.interaction.findMany({
      where: { contactId: id },
      include: { teamMember: true },
      orderBy: { interactionDate: 'desc' }
    })

    const timeline = interactions.map(interaction => ({
      id: interaction.id,
      type: interaction.type === 'NOTE' ? 'note' : 'interaction',
      interactionType: interaction.type,
      subject: interaction.subject,
      content: interaction.content,
      outcome: interaction.outcome,
      teamMember: interaction.teamMember,
      date: interaction.interactionDate,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt
    }))

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}