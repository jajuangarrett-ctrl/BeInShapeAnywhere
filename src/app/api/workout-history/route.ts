import { NextRequest, NextResponse } from 'next/server'
import { getLogsForProgram } from '@/lib/notion'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 })
    }

    const logs = await getLogsForProgram(programId)
    return NextResponse.json(logs)
  } catch (err) {
    console.error('Error fetching workout history:', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
