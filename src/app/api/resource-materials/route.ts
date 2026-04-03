import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    
    const where = categoryId ? { categoryId } : {}
    
    const materials = await db.resourceMaterial.findMany({
      where,
      include: {
        category: true,
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching resource materials:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const material = await db.resourceMaterial.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags,
        createdBy: data.createdBy,
        isTemplate: data.isTemplate || false
      },
      include: {
        category: true
      }
    })
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error creating resource material:', error)
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}
