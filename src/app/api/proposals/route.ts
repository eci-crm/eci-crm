import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const proposal = await db.proposal.update({
      where: { id: params.id },
      data: { title: data.title, description: data.description, status: data.status, totalAmount: data.totalAmount },
    })
    return NextResponse.json(proposal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.proposal.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
