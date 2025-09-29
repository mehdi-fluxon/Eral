import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * @swagger
 * /api/team-members:
 *   get:
 *     tags: [Team Members]
 *     summary: Search and list team members
 *     description: Retrieve team members with optional search filtering
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by team member name or email (case-insensitive partial match)
 *         example: "alice"
 *     responses:
 *       200:
 *         description: List of team members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamMember'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags: [Team Members]
 *     summary: Create a new team member
 *     description: Add a new team member to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Team member name
 *                 example: "Alice Johnson"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Team member email
 *                 example: "alice@company.com"
 *     responses:
 *       201:
 *         description: Team member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Prisma.TeamMemberWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const members = await prisma.teamMember.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(members)
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
  } catch {
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}