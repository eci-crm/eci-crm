// src/app/api/proposals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all proposals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    
    const where: any = {}
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    
    const proposals = await db.proposal.findMany({
      where,
      include: {
        contact: true,
        owner: true,
        assignee: true,
        tasks: true,
        remarks: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map contactId to clientId for frontend compatibility
    const mappedProposals = proposals.map(p => ({
      ...p,
      clientId: p.contactId,
      client: p.contact
    }))
    
    return NextResponse.json(mappedProposals)
  } catch (error) {
    console.error('GET proposals error:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals', details: String(error) }, { status: 500 })
  }
}

// POST - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('Received proposal data:', data)
    
    // Map clientId to contactId (frontend sends clientId, DB uses contactId)
    const contactId = data.clientId || data.contactId
    
    if (!contactId) {
      return NextResponse.json({ error: 'Client is required' }, { status: 400 })
    }
    
    const proposal = await db.proposal.create({
      data: {
        title: data.title,
        description: data.description || '',
        rfpNumber: data.rfpNumber || null,
        status: data.status || 'DRAFT',
        totalAmount: parseFloat(data.totalAmount) || 0,
        currency: data.currency || 'USD',
        deadline: data.deadline ? new Date(data.deadline) : null,
        assigneeId: data.assigneeId || null,
        contactId: contactId,  // This is the fix - use contactId for DB
        ownerId: data.ownerId,
      },
      include: {
        contact: true,
        owner: true,
        assignee: true
      }
    })
    
    // Return with clientId for frontend
    const response = {
      ...proposal,
      clientId: proposal.contactId,
      client: proposal.contact
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('POST proposal error:', error)
    return NextResponse.json({ error: 'Failed to create proposal', details: String(error) }, { status: 500 })
  }
}
