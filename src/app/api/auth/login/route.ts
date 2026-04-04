import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function ensureAdminUser() {
  // Check if admin user exists
  const adminUser = await db.user.findUnique({
    where: { email: 'admin@ecicrm.com' }
  })

  if (!adminUser) {
    console.log('Creating admin user...')
    const hashedPassword = await bcrypt.hash('password123', 10)

    await db.user.create({
      data: {
        email: 'admin@ecicrm.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Management',
        isActive: true
      }
    })
    console.log('Admin user created successfully')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Ensure admin user exists before login attempt
    if (email.toLowerCase() === 'admin@ecicrm.com') {
      await ensureAdminUser()
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
