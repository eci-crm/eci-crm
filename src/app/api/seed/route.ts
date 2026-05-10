import { NextResponse } from 'next/server'

// Seed route has been disabled to prevent accidental data overwrite.
// User's actual data (20 proposals, 10 clients) must be preserved.
// If you need to re-seed, use: bun run seed  (from CLI only, with caution)

export async function POST() {
  return NextResponse.json(
    { error: 'Seed endpoint is disabled to protect existing data. Use CLI seed script with caution if needed.' },
    { status: 403 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'Seed endpoint is disabled to protect existing data.' },
    { status: 403 }
  )
}
