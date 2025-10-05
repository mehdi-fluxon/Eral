import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateNextReminderDate, getReminderStatus } from '@/lib/cadence'
import { Prisma } from '@prisma/client'

/**
 * @swagger
 * /api/contacts/{id}:
 *   get:
 *     tags: [Contacts]
 *     summary: Get contact by ID
 *     description: Retrieve a specific contact with all associated data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *         example: "cmg39beol0001itk77arer899"
 *     responses:
 *       200:
 *         description: Contact found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     tags: [Contacts]
 *     summary: Update contact
 *     description: Update contact information and associations
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
 *             $ref: '#/components/schemas/CreateContactRequest'
 *     responses:
 *       200:
 *         description: Contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     tags: [Contacts]
 *     summary: Delete contact
 *     description: Permanently delete a contact and all associated data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Contact deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        companies: {
          include: { company: true }
        },
        teamMembers: {
          include: { teamMember: true }
        },
        labels: {
          include: { label: true }
        },
        interactions: {
          include: { teamMember: true },
          orderBy: { interactionDate: 'desc' }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const contactWithStatus = {
      ...contact,
      reminderStatus: getReminderStatus(contact.nextReminderDate)
    }

    return NextResponse.json(contactWithStatus)
  } catch (error) {
    console.error('Failed to fetch contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      firstName,
      lastName,
      email,
      jobTitle,
      linkedinUrl,
      referrer,
      crmId,
      cadence,
      lastTouchDate,
      nextReminderDate,
      generalNotes,
      customFields,
      companyIds,
      teamMemberIds,
      labelIds
    } = body

    const existingContact = await prisma.contact.findUnique({
      where: { id },
      select: { lastTouchDate: true, cadence: true }
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const touchDate = lastTouchDate ? new Date(lastTouchDate) : existingContact.lastTouchDate
    const newCadence = cadence || existingContact.cadence
    
    const shouldRecalculateReminder = 
      (lastTouchDate && new Date(lastTouchDate).getTime() !== existingContact.lastTouchDate.getTime()) ||
      (cadence && cadence !== existingContact.cadence)
    
    // Handle direct nextReminderDate updates (for AI agent custom timing)
    let nextReminder = undefined
    if (nextReminderDate) {
      nextReminder = new Date(nextReminderDate)
    } else if (shouldRecalculateReminder) {
      nextReminder = calculateNextReminderDate(touchDate, newCadence)
    }

    const updateData: Prisma.ContactUpdateInput = {}

    if (name) updateData.name = name
    if (firstName !== undefined) updateData.firstName = firstName || null
    if (lastName !== undefined) updateData.lastName = lastName || null
    if (email) updateData.email = email
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle || null
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null
    if (referrer !== undefined) updateData.referrer = referrer || null
    if (crmId !== undefined) updateData.crmId = crmId || null
    if (generalNotes !== undefined) updateData.generalNotes = generalNotes
    if (customFields !== undefined) updateData.customFields = customFields

    if (cadence) {
      updateData.cadence = cadence
    }

    if (lastTouchDate) {
      updateData.lastTouchDate = touchDate
    }

    if (nextReminder) {
      updateData.nextReminderDate = nextReminder
    }

    if (companyIds !== undefined) {
      await prisma.contactCompany.deleteMany({
        where: { contactId: id }
      })
      if (companyIds && companyIds.length > 0) {
        updateData.companies = {
          create: companyIds.map((companyId: string) => ({ companyId }))
        }
      }
    }

    if (teamMemberIds !== undefined) {
      await prisma.contactTeamMember.deleteMany({
        where: { contactId: id }
      })

      if (teamMemberIds && teamMemberIds.length > 0) {
        const validTeamMembers = await prisma.teamMember.findMany({
          where: { id: { in: teamMemberIds } }
        })

        if (validTeamMembers.length > 0) {
          updateData.teamMembers = {
            create: validTeamMembers.map(member => ({ teamMemberId: member.id }))
          }
        }
      }
    }

    if (labelIds !== undefined) {
      await prisma.contactLabel.deleteMany({
        where: { contactId: id }
      })

      if (labelIds && labelIds.length > 0) {
        const validLabels = await prisma.label.findMany({
          where: { id: { in: labelIds } }
        })

        if (validLabels.length > 0) {
          updateData.labels = {
            create: validLabels.map(label => ({ labelId: label.id }))
          }
        }
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        companies: {
          include: { company: true }
        },
        teamMembers: {
          include: { teamMember: true }
        },
        labels: {
          include: { label: true }
        }
      }
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to update contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.contact.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}