import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('GET users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase() }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        password: hashedPassword,
        role: data.role || 'VIEWER',
        department: data.department || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true
      }
    })
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('POST user error:', error)
    return NextResponse.json({ error: 'Failed to create user', details: String(error) }, { status: 500 })
  }
}
