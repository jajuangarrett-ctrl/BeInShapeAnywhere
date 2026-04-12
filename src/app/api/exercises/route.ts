import { NextResponse } from 'next/server'
import { getExercises, createExercise } from '@/lib/notion'

export async function GET() {
  try {
    const exercises = await getExercises()
    return NextResponse.json(exercises)
  } catch (error: any) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await createExercise(body)
    return NextResponse.json({ id })
  } catch (error: any) {
    console.error('Error creating exercise:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
