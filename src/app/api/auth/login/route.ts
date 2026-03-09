import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })

    // Use bcrypt to compare the hashed password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Design Choice: In a real SaaS, we'd set an HTTP-only cookie here.
    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
