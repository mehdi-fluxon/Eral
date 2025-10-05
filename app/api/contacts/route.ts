import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateNextReminderDate, getReminderStatus } from '@/lib/cadence'
import { Prisma } from '@prisma/client'

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     tags: [Contacts]
 *     summary: Get paginated list of contacts
 *     description: Retrieve contacts with optional filtering, searching, and pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, job title, labels, company, or team member
 *         example: "john smith"
 *       - in: query
 *         name: teamMember
 *         schema:
 *           type: string
 *         description: Filter by team member ID
 *       - in: query
 *         name: cadence
 *         schema:
 *           type: string
 *           enum: [1_DAY, 2_DAYS, 3_DAYS, 5_DAYS, 7_DAYS, 2_WEEKS, 3_WEEKS, 1_MONTH, 2_MONTHS, 3_MONTHS, 6_MONTHS, 9_MONTHS, 12_MONTHS, 18_MONTHS, 24_MONTHS]
 *         description: Filter by cadence frequency
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company ID
 *       - in: query
 *         name: label
 *         schema:
 *           type: string
 *         description: Filter by label ID
 *       - in: query
 *         name: reminderStatus
 *         schema:
 *           type: string
 *           enum: [OVERDUE, DUE_TODAY, DUE_THIS_WEEK, UPCOMING, NO_REMINDER]
 *         description: Filter by reminder status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of contacts per page
 *     responses:
 *       200:
 *         description: Successful response with paginated contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedContacts'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags: [Contacts]
 *     summary: Create a new contact
 *     description: Create a new contact with associated companies and team members
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContactRequest'
 *     responses:
 *       201:
 *         description: Contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const teamMemberFilter = searchParams.get('teamMember') || ''
    const cadenceFilter = searchParams.get('cadence') || ''
    const companyFilter = searchParams.get('company') || ''
    const labelFilter = searchParams.get('label') || ''
    const reminderStatusFilter = searchParams.get('reminderStatus') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Prisma.ContactWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { jobTitle: { contains: search } },
        { labels: { some: { label: { name: { contains: search } } } } },
        { companies: { some: { company: { name: { contains: search } } } } },
        { teamMembers: { some: { teamMember: { name: { contains: search } } } } },
      ]
    }

    if (teamMemberFilter) {
      where.teamMembers = { some: { teamMemberId: teamMemberFilter } }
    }

    if (cadenceFilter) {
      where.cadence = cadenceFilter
    }

    if (companyFilter) {
      where.companies = { some: { companyId: companyFilter } }
    }

    if (labelFilter) {
      where.labels = { some: { labelId: labelFilter } }
    }

    // Custom date range filter (takes precedence over reminderStatusFilter)
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for startDate or endDate' }, { status: 400 })
      }

      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      where.nextReminderDate = { gte: start, lte: end }
    } else if (startDate) {
      const start = new Date(startDate)

      // Validate date
      if (isNaN(start.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for startDate' }, { status: 400 })
      }

      start.setHours(0, 0, 0, 0)
      where.nextReminderDate = { gte: start }
    } else if (endDate) {
      const end = new Date(endDate)

      // Validate date
      if (isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for endDate' }, { status: 400 })
      }

      end.setHours(23, 59, 59, 999)
      where.nextReminderDate = { lte: end }
    } else if (reminderStatusFilter) {
      // Fallback to preset filters if no custom date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      switch (reminderStatusFilter) {
        case 'OVERDUE':
          where.nextReminderDate = { lt: today }
          break
        case 'DUE_TODAY':
          where.nextReminderDate = { gte: today, lt: tomorrow }
          break
        case 'DUE_THIS_WEEK':
          where.nextReminderDate = { gte: tomorrow, lt: nextWeek }
          break
        case 'DUE_THIS_MONTH':
          const nextMonth = new Date(today)
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          where.nextReminderDate = { gte: today, lt: nextMonth }
          break
        case 'UPCOMING':
          where.nextReminderDate = { gte: tomorrow }
          break
        case 'NO_REMINDER':
          where.nextReminderDate = null
          break
      }
    }

    const offset = (page - 1) * limit

    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          companies: {
            include: { company: true }
          },
          teamMembers: {
            include: { teamMember: true }
          }
        },
        orderBy: [
          { nextReminderDate: { sort: 'asc', nulls: 'last' } },
          { updatedAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.contact.count({ where })
    ])

    const contactsWithStatus = contacts.map(contact => ({
      ...contact,
      reminderStatus: getReminderStatus(contact.nextReminderDate)
    }))

    return NextResponse.json({
      contacts: contactsWithStatus,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      firstName,
      lastName,
      email,
      jobTitle,
      linkedinUrl,
      referrer,
      labels,
      crmId,
      cadence = '3_MONTHS',
      lastTouchDate,
      generalNotes,
      customFields = {},
      companyIds = [],
      teamMemberIds = []
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const touchDate = lastTouchDate ? new Date(lastTouchDate) : new Date()
    const nextReminder = calculateNextReminderDate(touchDate, cadence)

    const contactData: Prisma.ContactCreateInput = {
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      email,
      jobTitle: jobTitle || null,
      linkedinUrl: linkedinUrl || null,
      referrer: referrer || null,
      labels: labels || null,
      crmId: crmId || null,
      cadence: cadence || '3_MONTHS', // Ensure cadence is never null
      lastTouchDate: touchDate,
      nextReminderDate: nextReminder,
      generalNotes: generalNotes || null,
      customFields: customFields,
    }

    if (companyIds && companyIds.length > 0) {
      contactData.companies = {
        create: companyIds.map((companyId: string) => ({
          companyId
        }))
      }
    }

    if (teamMemberIds && teamMemberIds.length > 0) {
      const validTeamMembers = await prisma.teamMember.findMany({
        where: { id: { in: teamMemberIds } }
      })
      
      if (validTeamMembers.length > 0) {
        contactData.teamMembers = {
          create: validTeamMembers.map(member => ({
            teamMemberId: member.id
          }))
        }
      }
    }

    const contact = await prisma.contact.create({
      data: contactData,
      include: {
        companies: {
          include: { company: true }
        },
        teamMembers: {
          include: { teamMember: true }
        }
      }
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Failed to create contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}