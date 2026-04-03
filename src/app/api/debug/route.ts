import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    const userCount = await db.user.count()
    const clientCount = await db.contact.count()
    const proposalCount = await db.proposal.count()
    
    // Get first user for testing
    const firstUser = await db.user.findFirst()
    
    return NextResponse.json({
      status: 'connected',
      counts: {
        users: userCount,
        clients: clientCount,
        proposals: proposalCount
      },
      testUser: firstUser ? {
        id: firstUser.id,
        email: firstUser.email,
        name: firstUser.name
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { action, ownerId } = data
    
    if (action === 'create-client') {
      const client = await db.contact.create({
        data: {
          name: 'Test Client ' + Date.now(),
          email: `test${Date.now()}@example.com`,
          status: 'LEAD',
          ownerId: ownerId
        }
      })
      return NextResponse.json({ success: true, client })
    }
    
    if (action === 'create-proposal') {
      const proposal = await db.proposal.create({
        data: {
          title: 'Test Proposal ' + Date.now(),
          valuePKR: 100000,
          ownerId: ownerId
        }
      })
      return NextResponse.json({ success: true, proposal })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error?.message || 'Unknown error',
      code: error?.code,
      meta: error?.meta
    }, { status: 500 })
  }
}
