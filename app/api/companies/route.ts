import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * @swagger
 * /api/companies:
 *   get:
 *     tags: [Companies]
 *     summary: Search and list companies
 *     description: Retrieve companies with optional search filtering
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or industry (case-insensitive partial match)
 *         example: "tech"
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Company'
 *                   - type: object
 *                     properties:
 *                       _count:
 *                         type: object
 *                         properties:
 *                           contacts:
 *                             type: integer
 *                             description: Number of contacts associated with this company
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     description: Add a new company to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *                 example: "Acme Corporation"
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Company website
 *                 example: "https://acme.com"
 *               industry:
 *                 type: string
 *                 description: Industry sector
 *                 example: "Technology"
 *               size:
 *                 type: string
 *                 description: Company size
 *                 example: "100-500 employees"
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: Prisma.CompanyWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } }
      ]
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: { select: { contacts: true } }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(companies)
  } catch {
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
  } catch {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}