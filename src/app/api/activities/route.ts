import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const activities = await db.activity.findMany({
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Fetch activities error:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const activity = await db.activity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        userId: data.userId
      },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Create activity error:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
