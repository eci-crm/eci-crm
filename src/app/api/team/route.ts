import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      include: {
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      active: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      proposalCount: member._count.proposals,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, password } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const existing = await db.teamMember.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const member = await db.teamMember.create({
      data: {
        name,
        email,
        role: role || 'Member',
        password: password || '',
      },
    })

    return NextResponse.json({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      active: member.isActive,
      createdAt: member.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
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
    const { name, email, role, password, active } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (role !== undefined) data.role = role
    if (password !== undefined) data.password = password
    if (active !== undefined) data.isActive = active

    const member = await db.teamMember.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      active: member.isActive,
      createdAt: member.createdAt,
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.teamMember.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
