import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
