import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await db.proposal.findUnique({
      where: { id: params.id },
      include: { contact: true, owner: true, assignee: true, tasks: true, remarks: { include: { user: true } } }
    })
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    return NextResponse.json({ ...proposal, clientId: proposal.contactId, client: proposal.contact })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const proposal = await db.proposal.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        totalAmount: data.totalAmount,
        rfpNumber: data.rfpNumber,
        deadline: data.deadline ? new Date(data.deadline) : null,
        assigneeId: data.assigneeId || null
      },
      include: { contact: true, owner: true, assignee: true }
    })
    return NextResponse.json({ ...proposal, clientId: proposal.contactId, client: proposal.contact })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.proposal.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
