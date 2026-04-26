import { NextRequest, NextResponse } from 'next/server'
import { logWorkout } from '@/lib/notion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { programId, programName, completedAt, durationMin, setsCompleted, totalSets, notes, prs } = body

    if (!programId || !programName) {
      return NextResponse.json({ error: 'programId and programName are required' }, { status: 400 })
    }

    await logWorkout({
      programId,
      programName,
      completedAt: completedAt || new Date().toISOString(),
      durationMin: durationMin || 0,
      setsCompleted: setsCompleted || 0,
      totalSets: totalSets || 0,
      notes: notes || '',
      prs: prs || [],
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error logging workout:', err)
    return NextResponse.json({ error: 'Failed to log workout' }, { status: 500 })
  }
}
