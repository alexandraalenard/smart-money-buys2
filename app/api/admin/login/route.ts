import { NextResponse } from 'next/server'

// Verifies the admin password server-side against the (non-public) ADMIN_PW
// env var. The secret never ships to the browser bundle. Note: this only gates
// the /admin dashboard UI — the data/pipeline API routes remain unauthenticated.
export async function POST(req: Request) {
  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }

  const expected = process.env.ADMIN_PW
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'Admin password is not configured on the server' },
      { status: 500 }
    )
  }

  const ok = password === expected
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
}
