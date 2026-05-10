import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

interface ClientCSVRow {
  name: string
  address: string
  status: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const result = Papa.parse<ClientCSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing error',
        details: result.errors.map(e => `Row ${e.row}: ${e.message}`)
      }, { status: 400 })
    }

    if (result.data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < result.data.length; i++) {
      const row = result.data[i]

      if (!row.name || !row.name.trim()) {
        errors.push(`Row ${i + 2}: Name is required`)
        skipped++
        continue
      }

      const status = row.status?.trim() || 'Active'
      if (!['Active', 'Inactive'].includes(status)) {
        errors.push(`Row ${i + 2}: Invalid status "${status}". Must be Active or Inactive`)
        skipped++
        continue
      }

      // Check for duplicate name (case-insensitive via contains for SQLite compatibility)
      const existing = await db.client.findFirst({
        where: { name: { equals: row.name.trim() } }
      })

      if (existing) {
        errors.push(`Row ${i + 2}: Client "${row.name}" already exists`)
        skipped++
        continue
      }

      await db.client.create({
        data: {
          name: row.name.trim(),
          address: row.address?.trim() || '',
          status,
        },
      })
      created++
    }

    return NextResponse.json({
      message: `Import complete: ${created} clients created, ${skipped} skipped`,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error importing clients:', error)
    return NextResponse.json({ error: 'Failed to import clients' }, { status: 500 })
  }
}

// Return CSV template
export async function GET() {
  const csvContent = `name,address,status
Client Name,Client Address,Active
Another Client,Another Address,Inactive`

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=clients_template.csv',
    },
  })
}
