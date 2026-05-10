import { NextResponse } from 'next/server'

// Cleanup route has been disabled - seed data has already been removed.
// If you need to re-run cleanup, use the CLI script: bun run /tmp/cleanup-seed.ts

export async function POST() {
  return NextResponse.json(
    { error: 'Cleanup endpoint is disabled. Seed data has already been removed.' },
    { status: 403 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'Cleanup endpoint is disabled.' },
    { status: 403 }
  )
}
