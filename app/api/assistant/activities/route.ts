import { NextResponse } from 'next/server'
import { activityLog } from '@/ai-assistant/functions'

export async function GET() {
  // Return the current activity log
  return NextResponse.json({
    activities: activityLog,
    currentActivity: activityLog.find(a => a.status === 'started') || null
  })
}