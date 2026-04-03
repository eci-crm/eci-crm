import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.resourceCategory.findMany({
      include: {
        materials: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { materials: true }
        }
      },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching resource categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const category = await db.resourceCategory.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        icon: data.icon,
        order: data.order || 0
      }
    })
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating resource category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
