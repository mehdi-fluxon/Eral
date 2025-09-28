import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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