import { NextResponse } from 'next/server'
import { getPopulatedEntries, createWorkoutEntries, deleteEntriesForProgram } from '@/lib/notion'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const entries = await getPopulatedEntries(id)
    return NextResponse.json(entries)
  } catch (error: any) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const ids = await createWorkoutEntries(
      body.entries.map((e: any) => ({ ...e, programId: id }))
    )
    return NextResponse.json({ ids })
  } catch (error: any) {
    console.error('Error creating entries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteEntriesForProgram(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting entries:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
