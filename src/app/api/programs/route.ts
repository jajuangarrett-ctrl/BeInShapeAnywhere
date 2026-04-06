import { NextResponse } from 'next/server'
import { getPrograms, createProgram } from '@/lib/notion'

export async function GET() {
  try {
    const programs = await getPrograms()
    return NextResponse.json(programs)
  } catch (error: any) {
    console.error('Error fetching programs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await createProgram(body)
    return NextResponse.json({ id })
  } catch (error: any) {
    console.error('Error creating program:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
