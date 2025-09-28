import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/interactions/{id}:
 *   patch:
 *     tags: [Interactions]
 *     summary: Update interaction
 *     description: Update an existing interaction's details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [EMAIL, CALL, MEETING, LINKEDIN, FOLLOWUP, PROPOSAL, OTHER]
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               outcome:
 *                 type: string
 *               interactionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Interaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Interaction'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     tags: [Interactions]
 *     summary: Delete interaction
 *     description: Permanently delete a specific interaction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Interaction ID
 *     responses:
 *       200:
 *         description: Interaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Interaction deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const {
      type,
      subject,
      content,
      outcome,
      interactionDate
    } = await request.json()

    const updateData: any = {}
    
    if (type) updateData.type = type
    if (subject !== undefined) updateData.subject = subject || null
    if (content) updateData.content = content
    if (outcome !== undefined) updateData.outcome = outcome || null
    if (interactionDate) updateData.interactionDate = new Date(interactionDate)

    const interaction = await prisma.interaction.update({
      where: { id },
      data: updateData,
      include: {
        teamMember: true
      }
    })

    return NextResponse.json(interaction)
  } catch (error) {
    console.error('Failed to update interaction:', error)
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.interaction.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Interaction deleted successfully' })
  } catch (error) {
    console.error('Failed to delete interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    )
  }
}