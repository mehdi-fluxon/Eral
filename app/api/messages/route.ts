import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { contactId, type, subject, content, sentAt, authorId } = await request.json()
    
    const message = await prisma.message.create({
      data: {
        contactId,
        type,
        subject,
        content,
        sentAt: new Date(sentAt),
        authorId
      },
      include: {
        author: true,
        contact: true
      }
    })

    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContactAt: new Date(sentAt) }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}