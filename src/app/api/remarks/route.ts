import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('proposalId')
    
    const where = proposalId ? { proposalId } : {}
    
    const remarks = await db.remark.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(remarks)
  } catch (error) {
    console.error('Error fetching remarks:', error)
    return NextResponse.json({ error: 'Failed to fetch remarks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const remark = await db.remark.create({
      data: {
        content: data.content,
        proposalId: data.proposalId,
        userId: data.userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    return NextResponse.json(remark)
  } catch (error) {
    console.error('Error creating remark:', error)
    return NextResponse.json({ error: 'Failed to create remark' }, { status: 500 })
  }
}
