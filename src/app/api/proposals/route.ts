import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const proposals = await db.proposal.findMany({
      where,
      include: {
        contact: true,
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        budgets: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Fetch proposals error:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const proposal = await db.proposal.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'DRAFT',
        totalAmount: data.totalAmount || 0,
        currency: data.currency || 'USD',
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        contactId: data.contactId,
        ownerId: data.ownerId
      },
      include: {
        contact: true,
        owner: { select: { id: true, name: true, email: true, avatar: true } }
      }
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Create proposal error:', error)
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 })
  }
}
