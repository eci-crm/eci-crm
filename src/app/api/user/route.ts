import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role || 'VIEWER',
        department: data.department,
      }
    })
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
