import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposal = await db.proposal.findUnique({
      where: { id },
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
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true }
            }
          }
        },
        remarks: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: true,
        budgets: true
      }
    })
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const proposal = await db.proposal.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        rfpNumber: data.rfpNumber,
        valuePKR: data.valuePKR,
        valueUSD: data.valueUSD,
        currency: data.currency,
        status: data.status,
        stage: data.stage,
        submissionDate: data.submissionDate ? new Date(data.submissionDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        submissionMethod: data.submissionMethod,
        assigneeId: data.assigneeId,
        contactId: data.contactId,
        internalRemarks: data.internalRemarks,
        externalRemarks: data.externalRemarks,
        sector: data.sector
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
    
    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.proposal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
