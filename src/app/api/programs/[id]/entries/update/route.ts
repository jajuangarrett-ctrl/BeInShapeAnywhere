import { NextResponse } from 'next/server'
import { updateEntry } from '@/lib/notion'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { entryId, day } = body

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    await updateEntry(entryId, {
      ...(day !== undefined && { day }),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
