import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clients = await db.contact.findMany({
      include: { 
        owner: { select: { id: true, name: true, email: true } }, 
        proposals: true 
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('GET clients error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner is required' }, { status: 400 })
    }
    
    const client = await db.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        position: data.position || null,
        status: data.status || 'LEAD',
        source: data.source || null,
        rfpNumber: data.rfpNumber || null,
        ownerId: data.ownerId
      },
      include: { owner: { select: { id: true, name: true } } }
    })
    return NextResponse.json(client)
  } catch (error) {
    console.error('POST client error:', error)
    return NextResponse.json({ error: 'Failed to create client', details: String(error) }, { status: 500 })
  }
}
