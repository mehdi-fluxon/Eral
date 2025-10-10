import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/contacts/{id}/companies:
 *   post:
 *     tags: [Contacts]
 *     summary: Add a company to a contact
 *     description: Associate an additional company with a contact without removing existing companies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: ID of the company to add
 *     responses:
 *       200:
 *         description: Company added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Contact or company not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags: [Contacts]
 *     summary: Replace all companies for a contact
 *     description: Replace all existing company associations with the provided list
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyIds
 *             properties:
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of company IDs to associate with contact
 *     responses:
 *       200:
 *         description: Companies updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Internal server error
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        companies: true
      }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check if association already exists
    const existingAssociation = contact.companies.find(cc => cc.companyId === companyId)
    if (existingAssociation) {
      return NextResponse.json({
        message: 'Company already associated with contact',
        contact: await prisma.contact.findUnique({
          where: { id: params.id },
          include: {
            companies: {
              include: { company: true }
            },
            teamMembers: {
              include: { teamMember: true }
            }
          }
        })
      })
    }

    // Add new company association
    await prisma.contactCompany.create({
      data: {
        contactId: params.id,
        companyId: companyId
      }
    })

    // Return updated contact
    const updatedContact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        companies: {
          include: { company: true }
        },
        teamMembers: {
          include: { teamMember: true }
        }
      }
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error adding company to contact:', error)
    return NextResponse.json(
      { error: 'Failed to add company to contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { companyIds } = await request.json()

    if (!Array.isArray(companyIds)) {
      return NextResponse.json({ error: 'companyIds must be an array' }, { status: 400 })
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: params.id }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Verify all companies exist
    if (companyIds.length > 0) {
      const companies = await prisma.company.findMany({
        where: { id: { in: companyIds } }
      })

      if (companies.length !== companyIds.length) {
        return NextResponse.json({ error: 'One or more companies not found' }, { status: 404 })
      }
    }

    // Delete existing associations
    await prisma.contactCompany.deleteMany({
      where: { contactId: params.id }
    })

    // Create new associations
    if (companyIds.length > 0) {
      await prisma.contactCompany.createMany({
        data: companyIds.map((companyId: string) => ({
          contactId: params.id,
          companyId: companyId
        }))
      })
    }

    // Return updated contact
    const updatedContact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        companies: {
          include: { company: true }
        },
        teamMembers: {
          include: { teamMember: true }
        }
      }
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact companies:', error)
    return NextResponse.json(
      { error: 'Failed to update contact companies' },
      { status: 500 }
    )
  }
}
