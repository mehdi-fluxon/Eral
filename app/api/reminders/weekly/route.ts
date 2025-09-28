import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

    const followUps = await prisma.followUp.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lte: oneWeekFromNow }
      },
      include: {
        contact: {
          include: {
            company: true,
            assignedTo: true,
            messages: {
              take: 1,
              orderBy: { sentAt: 'desc' }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    const groupedByAssignee = followUps.reduce((acc, followUp) => {
      const assignee = followUp.contact.assignedTo?.name || 'Unassigned'
      if (!acc[assignee]) acc[assignee] = []
      acc[assignee].push(followUp)
      return acc
    }, {} as Record<string, typeof followUps>)

    let slackMessage = `Async Sales Reminders: ${new Date().toLocaleDateString()}\n\n`
    
    Object.entries(groupedByAssignee).forEach(([assignee, reminders]) => {
      slackMessage += `@${assignee}\n`
      reminders.forEach(reminder => {
        const contact = reminder.contact
        const lastMessage = contact.messages[0]
        const lastContact = lastMessage ? 
          `Last contact: ${lastMessage.sentAt.toLocaleDateString()}` : 
          'No previous contact'
        
        slackMessage += `- ${contact.company?.name || contact.name} - any updates? ${lastContact}\n`
      })
      slackMessage += '\n'
    })

    return NextResponse.json({ 
      message: slackMessage,
      followUps: groupedByAssignee 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate weekly reminders' }, { status: 500 })
  }
}