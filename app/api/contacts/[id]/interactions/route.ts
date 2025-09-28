import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateNextReminderDate } from '@/lib/cadence'

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