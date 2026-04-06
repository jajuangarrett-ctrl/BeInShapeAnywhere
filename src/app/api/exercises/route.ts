import { NextResponse } from 'next/server'
import { getExercises } from '@/lib/notion'

export async function GET() {
  try {
    const exercises = await getExercises()
    return NextResponse.json(exercises)
  } catch (error: any) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
