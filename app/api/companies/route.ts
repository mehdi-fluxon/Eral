import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { contacts: true } }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(companies)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, industry, size, website } = await request.json()
    const company = await prisma.company.create({
      data: { name, industry, size, website }
    })
    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}