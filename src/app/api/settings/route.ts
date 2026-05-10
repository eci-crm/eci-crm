import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    // Return as array of {key, value} objects
    const result = settings.map((s) => ({ key: s.key, value: s.value }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support both formats: direct array or { settings: [...] }
    let settings: Array<{ key: string; value: string }>
    if (Array.isArray(body)) {
      settings = body
    } else if (body.settings && Array.isArray(body.settings)) {
      settings = body.settings
    } else {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 })
    }

    // Validate each setting has a valid key and value
    for (const setting of settings) {
      if (!setting.key || typeof setting.key !== 'string' || setting.key.trim() === '') {
        return NextResponse.json({ error: 'Each setting must have a valid non-empty string key' }, { status: 400 })
      }
      if (setting.value === undefined || setting.value === null) {
        return NextResponse.json({ error: `Setting '${setting.key}' must have a value` }, { status: 400 })
      }
    }

    const results = []
    for (const setting of settings) {
      const result = await db.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
      results.push(result)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    let settings: Array<{ key: string; value: string }>
    if (Array.isArray(body)) {
      settings = body
    } else if (body.settings && Array.isArray(body.settings)) {
      settings = body.settings
    } else {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 })
    }

    // Validate each setting has a valid key and value
    for (const setting of settings) {
      if (!setting.key || typeof setting.key !== 'string' || setting.key.trim() === '') {
        return NextResponse.json({ error: 'Each setting must have a valid non-empty string key' }, { status: 400 })
      }
      if (setting.value === undefined || setting.value === null) {
        return NextResponse.json({ error: `Setting '${setting.key}' must have a value` }, { status: 400 })
      }
    }

    const results = []
    for (const setting of settings) {
      const result = await db.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
      results.push(result)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
