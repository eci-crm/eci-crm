import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('proposalId')
    
    const where: any = {}
    if (proposalId) where.proposalId = proposalId
    
    const remarks = await db.remark.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(remarks)
  } catch (error) {
    console.error('GET remarks error:', error)
    return NextResponse.json({ error: 'Failed to fetch remarks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.content || !data.proposalId || !data.userId) {
      return NextResponse.json({ error: 'Content, proposalId and userId are required' }, { status: 400 })
    }
    
    const remark = await db.remark.create({
      data: {
        content: data.content,
        proposalId: data.proposalId,
        userId: data.userId
      },
      include: { user: true }
    })
    
    return NextResponse.json(remark)
  } catch (error) {
    console.error('POST remark error:', error)
    return NextResponse.json({ error: 'Failed to create remark', details: String(error) }, { status: 500 })
  }
}
