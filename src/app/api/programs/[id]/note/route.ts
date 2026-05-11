import { NextResponse } from 'next/server'
import { updateClientNote } from '@/lib/notion'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { clientNote } = await req.json()
    await updateClientNote(id, clientNote ?? '')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating client note:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
