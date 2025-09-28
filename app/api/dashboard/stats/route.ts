import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Retrieve key metrics for the dashboard including contact counts by reminder status
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const [
      totalContacts,
      overdueContacts,
      dueTodayContacts,
      dueThisWeekContacts
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({
        where: {
          nextReminderDate: {
            lt: today
          }
        }
      }),
      prisma.contact.count({
        where: {
          nextReminderDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.contact.count({
        where: {
          nextReminderDate: {
            gte: today,
            lt: nextWeek
          }
        }
      })
    ])

    return NextResponse.json({
      totalContacts,
      overdueContacts,
      dueTodayContacts,
      dueThisWeekContacts
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}