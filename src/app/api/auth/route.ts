import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const member = await db.teamMember.findUnique({
      where: { email },
    })

    if (!member) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!member.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    if (member.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Return member without password
    const { password: _, ...memberWithoutPassword } = member
    return NextResponse.json({
      user: memberWithoutPassword,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    const member = await db.teamMember.findUnique({
      where: { email },
    })

    if (!member) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { password: _, ...memberWithoutPassword } = member
    return NextResponse.json(memberWithoutPassword)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
