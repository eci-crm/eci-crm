import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const maxOrder = await db.service.aggregate({
      _max: { sortOrder: true },
    })

    const service = await db.service.create({
      data: {
        name,
        color: color || '#10b981',
        sortOrder: sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle reorder: { reorder: [{ id, sortOrder }, ...] }
    if (body.reorder && Array.isArray(body.reorder)) {
      const results = []
      for (const item of body.reorder) {
        const result = await db.service.update({
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

    const service = await db.service.update({
      where: { id },
      data,
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.service.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
