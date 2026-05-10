import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources/download?id=xxx — download a file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const file = await db.resource.findUnique({ where: { id } })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Extract base64 data (remove data:mime/type;base64, prefix)
    let base64Data = file.fileData
    let mimeType = file.fileType

    if (base64Data.includes(',')) {
      const parts = base64Data.split(',')
      // Extract mime type from data URL if present
      const mimeMatch = parts[0].match(/data:([^;]+)/)
      if (mimeMatch) {
        mimeType = mimeMatch[1]
      }
      base64Data = parts[1]
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }
}
