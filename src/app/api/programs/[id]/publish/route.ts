import { NextResponse } from 'next/server'
import { updateProgramPublished } from '@/lib/notion'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { published } = await req.json()
    await updateProgramPublished(id, published)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating program:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
