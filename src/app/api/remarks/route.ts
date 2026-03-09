import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const remark = await db.remark.create({
      data: { content: data.content, proposalId: data.proposalId, userId: data.userId },
      include: { user: { select: { id: true, name: true } } }
    })
    return NextResponse.json(remark)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create remark' }, { status: 500 })
  }
}
