import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const areas = await db.thematicArea.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(areas)
  } catch (error) {
    console.error('Error fetching thematic areas:', error)
    return NextResponse.json({ error: 'Failed to fetch thematic areas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const maxOrder = await db.thematicArea.aggregate({
      _max: { sortOrder: true },
    })

    const area = await db.thematicArea.create({
      data: {
        name,
        color: color || '#6366f1',
        sortOrder: sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(area, { status: 201 })
  } catch (error) {
    console.error('Error creating thematic area:', error)
    return NextResponse.json({ error: 'Failed to create thematic area' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle reorder: { reorder: [{ id, sortOrder }, ...] }
    if (body.reorder && Array.isArray(body.reorder)) {
      const results = []
      for (const item of body.reorder) {
        const result = await db.thematicArea.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
        results.push(result)
      }
      return NextResponse.json(results)
    }

    // Handle single update with id from URL or body
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || body.id

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { name, color, sortOrder } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (color !== undefined) data.color = color
    if (sortOrder !== undefined) data.sortOrder = sortOrder

    const area = await db.thematicArea.update({
      where: { id },
      data,
    })

    return NextResponse.json(area)
  } catch (error) {
    console.error('Error updating thematic area:', error)
    return NextResponse.json({ error: 'Failed to update thematic area' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.thematicArea.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting thematic area:', error)
    return NextResponse.json({ error: 'Failed to delete thematic area' }, { status: 500 })
  }
}
