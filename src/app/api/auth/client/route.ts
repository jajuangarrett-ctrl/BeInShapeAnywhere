import { NextResponse } from 'next/server'
import { getProgramByPassword } from '@/lib/notion'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    const program = await getProgramByPassword(password)
    if (program) {
      return NextResponse.json({ success: true, program })
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
