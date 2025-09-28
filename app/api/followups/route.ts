import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { status: 'PENDING' },
      include: {
        contact: {
          include: { 
            companies: { include: { company: true } },
            owners: { include: { owner: true } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })
    return NextResponse.json(followUps)
  } catch (error) {
    console.error('Failed to fetch follow-ups:', error)
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contactId, dueDate, cadence, notes } = await request.json()
    
    const followUp = await prisma.followUp.create({
      data: {
        contactId,
        dueDate: new Date(dueDate),
        cadence,
        notes
      },
      include: {
        contact: { 
          include: { 
            companies: { include: { company: true } },
            owners: { include: { owner: true } }
          }
        }
      }
    })

    return NextResponse.json(followUp, { status: 201 })
  } catch (error) {
    console.error('Failed to create follow-up:', error)
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 })
  }
}