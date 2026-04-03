import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const proposals = await db.proposal.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        contact: {
          select: { id: true, name: true, email: true, company: true, sector: true }
        },
        teamMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        attachments: true,
        _count: {
          select: { tasks: true, remarks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Creating proposal with data:', JSON.stringify(data, null, 2))
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner ID is required. Please log in again.' }, { status: 400 })
    }
    
    // Check if owner exists
    const owner = await db.user.findUnique({
      where: { id: data.ownerId }
    })
    
    if (!owner) {
      return NextResponse.json({ error: 'Invalid owner. User not found.' }, { status: 400 })
    }
    
    const proposal = await db.proposal.create({
      data: {
        title: data.title,
        description: data.description || null,
        rfpNumber: data.rfpNumber || null,
        valuePKR: parseFloat(data.valuePKR) || 0,
        valueUSD: parseFloat(data.valueUSD) || 0,
        currency: data.currency || 'PKR',
        status: data.status || 'DRAFT',
        stage: data.stage || 'NEW',
        submissionDate: data.submissionDate ? new Date(data.submissionDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        submissionMethod: data.submissionMethod || null,
        ownerId: data.ownerId,
        assigneeId: data.assigneeId || null,
        contactId: data.contactId || null,
        internalRemarks: data.internalRemarks || null,
        externalRemarks: data.externalRemarks || null,
        sector: data.sector || null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        contact: {
          select: { id: true, name: true, email: true, company: true }
        },
        teamMembers: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })
    
    console.log('Proposal created successfully:', proposal.id)
    return NextResponse.json(proposal)
  } catch (error: any) {
    console.error('Error creating proposal:', error)
    return NextResponse.json({ 
      error: 'Failed to create proposal', 
      details: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 })
  }
}
