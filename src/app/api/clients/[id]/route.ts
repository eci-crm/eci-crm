import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    // CHANGED: db.client.update -> db.contact.update
    const client = await db.contact.update({
      where: { id: params.id },
      data: { name: data.name, email: data.email, phone: data.phone, company: data.company, position: data.position, status: data.status, source: data.source, rfpNumber: data.rfpNumber },
    })
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // CHANGED: db.client.delete -> db.contact.delete
    await db.contact.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
