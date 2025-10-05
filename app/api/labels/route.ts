import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/labels:
 *   get:
 *     tags: [Labels]
 *     summary: Get all labels
 *     description: Retrieve all available labels
 *     responses:
 *       200:
 *         description: List of all labels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Label'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags: [Labels]
 *     summary: Create a new label
 *     description: Create a new label with a name and optional color
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Label name
 *               color:
 *                 type: string
 *                 description: Label color (hex code)
 *     responses:
 *       201:
 *         description: Label created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Label'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Failed to fetch labels:', error)
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    // Check if label with same name already exists
    const existing = await prisma.label.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'Label with this name already exists' }, { status: 400 })
    }

    // Generate a random color if not provided
    const labelColor = color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: labelColor
      }
    })

    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Failed to create label:', error)
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
  }
}
