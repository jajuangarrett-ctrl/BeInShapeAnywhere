import { NextResponse } from 'next/server'
import { moveEntriesDay } from '@/lib/notion'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { week, fromDay, toDay } = body

    if (!week || !fromDay || !toDay) {
      return NextResponse.json({ error: 'week, fromDay, and toDay are required' }, { status: 400 })
    }

    const moved = await moveEntriesDay(id, week, fromDay, toDay)
    return NextResponse.json({ success: true, moved })
  } catch (error: any) {
    console.error('Error moving entries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
