import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    
    const where: any = {}
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    
    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: true,
        proposal: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    if (!data.assigneeId) {
      return NextResponse.json({ error: 'Assignee is required' }, { status: 400 })
    }
    
    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description || '',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId,
        proposalId: data.proposalId || null
      },
      include: { assignee: true, proposal: true }
    })
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('POST task error:', error)
    return NextResponse.json({ error: 'Failed to create task', details: String(error) }, { status: 500 })
  }
}
