import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority

    const tasks = await db.task.findMany({
      where,
      include: { assignee: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Fetch tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId
      },
      include: { assignee: { select: { id: true, name: true, email: true, avatar: true } } }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
