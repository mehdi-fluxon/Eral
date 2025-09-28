import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company by ID
 *     description: Retrieve a specific company with contact count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Company'
 *                 - type: object
 *                   properties:
 *                     _count:
 *                       type: object
 *                       properties:
 *                         contacts:
 *                           type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     tags: [Companies]
 *     summary: Update company
 *     description: Update company information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *               industry:
 *                 type: string
 *               size:
 *                 type: string
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     tags: [Companies]
 *     summary: Delete company
 *     description: Permanently delete a company
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { contacts: true } }
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Failed to fetch company:', error)
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { name, industry, size, website } = await request.json()

    const company = await prisma.company.update({
      where: { id },
      data: { name, industry, size, website },
      include: {
        _count: { select: { contacts: true } }
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Failed to update company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.company.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Failed to delete company:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}