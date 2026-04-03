import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const material = await db.resourceMaterial.findUnique({
      where: { id },
      include: {
        category: true,
        attachments: true
      }
    })
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error fetching resource material:', error)
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const material = await db.resourceMaterial.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags,
        isTemplate: data.isTemplate
      },
      include: {
        category: true
      }
    })
    
    return NextResponse.json(material)
  } catch (error) {
    console.error('Error updating resource material:', error)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await db.resourceMaterial.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resource material:', error)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}
