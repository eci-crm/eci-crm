import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const clients = await db.client.findMany({
      include: { owner: { select: { id: true, name: true, email: true } }, proposals: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const client = await db.client.create({
      data: {
        name: data.name, email: data.email, phone: data.phone,
        company: data.company, position: data.position,
        status: data.status || 'LEAD', source: data.source,
        rfpNumber: data.rfpNumber, ownerId: data.ownerId
      },
      include: { owner: { select: { id: true, name: true } } }
    })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
