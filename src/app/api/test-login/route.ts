import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('Test login attempt:', { email, password: password ? '***' : 'missing' })

    if (!email || !password) {
      return NextResponse.json({
        step: 'validation',
        error: 'Email and password are required',
        received: { email: email || 'missing', password: password ? 'provided' : 'missing' }
      }, { status: 400 })
    }

    // Find user
    console.log('Looking for user:', email.toLowerCase())
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({
        step: 'find_user',
        error: 'User not found',
        searchedEmail: email.toLowerCase()
      }, { status: 401 })
    }

    console.log('User found:', { id: user.id, email: user.email, isActive: user.isActive })

    if (!user.isActive) {
      return NextResponse.json({
        step: 'active_check',
        error: 'User is not active',
        user: { id: user.id, email: user.email, isActive: user.isActive }
      }, { status: 401 })
    }

    // Test password
    console.log('Comparing passwords...')
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json({
        step: 'password_check',
        error: 'Invalid password',
        user: { id: user.id, email: user.email },
        passwordHashPrefix: user.password.substring(0, 30) + '...',
        providedPassword: password
      }, { status: 401 })
    }

    return NextResponse.json({
      step: 'success',
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Test login error:', error)
    return NextResponse.json({
      step: 'exception',
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to test with query params
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || 'admin@ecicrm.com'
  const password = request.nextUrl.searchParams.get('password') || 'password123'

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({
        step: 'find_user',
        error: 'User not found',
        searchedEmail: email.toLowerCase()
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      passwordValid: isValid,
      testedPassword: password
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
