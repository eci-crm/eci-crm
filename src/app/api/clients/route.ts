import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const clients = await db.contact.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Creating client with data:', JSON.stringify(data, null, 2))
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner ID is required. Please log in again.' }, { status: 400 })
    }
    
    // Check if owner exists
    const owner = await db.user.findUnique({
      where: { id: data.ownerId }
    })
    
    if (!owner) {
      return NextResponse.json({ error: 'Invalid owner. User not found.' }, { status: 400 })
    }
    
    const client = await db.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        position: data.position || null,
        sector: data.sector || null,
        status: data.status || 'LEAD',
        source: data.source || null,
        notes: data.notes || null,
        rfpNumber: data.rfpNumber || null,
        website: data.website || null,
        address: data.address || null,
        ownerId: data.ownerId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    console.log('Client created successfully:', client.id)
    return NextResponse.json(client)
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json({ 
      error: 'Failed to create client', 
      details: error?.message || 'Unknown error',
      code: error?.code
    }, { status: 500 })
  }
}
