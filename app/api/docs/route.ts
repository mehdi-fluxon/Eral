import { NextResponse } from 'next/server'
import { specs } from '@/lib/swagger'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(specs)
}