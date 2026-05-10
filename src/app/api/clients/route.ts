import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const clients = await db.client.findMany({
      where,
      include: {
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = clients.map((client) => ({
      id: client.id,
      name: client.name,
      address: client.address,
      status: client.status,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      proposalCount: client._count.proposals,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, status } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await db.client.create({
      data: {
        name,
        address: address || '',
        status: status || 'Active',
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, address, status } = body

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Cascade delete: junction records → proposals → client
    await db.$transaction(async (tx) => {
      // Get all proposal IDs for this client
      const proposals = await tx.proposal.findMany({
        where: { clientId: id },
        select: { id: true },
      })
      const proposalIds = proposals.map((p) => p.id)

      // Delete junction table records first
      if (proposalIds.length > 0) {
        await tx.proposalService.deleteMany({
          where: { proposalId: { in: proposalIds } },
        })
        await tx.proposalThematicArea.deleteMany({
          where: { proposalId: { in: proposalIds } },
        })
      }

      // Delete proposals
      await tx.proposal.deleteMany({
        where: { clientId: id },
      })

      // Delete client
      await tx.client.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
