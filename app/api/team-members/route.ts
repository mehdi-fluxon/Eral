import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { name: 'asc' }
    })
    const membersWithCount = members.map(member => ({
      ...member,
      _count: { contacts: 0 }
    }))
    return NextResponse.json(membersWithCount)
  } catch (error) {
    console.error('Failed to fetch team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()
    const member = await prisma.teamMember.create({
      data: { name, email }
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}