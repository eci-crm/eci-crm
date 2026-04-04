import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const resourceId = formData.get('resourceId') as string | null
    const uploadedBy = formData.get('uploadedBy') as string | null

    console.log('Upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      resourceId,
      uploadedBy
    })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024 // 4MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large',
        details: 'Maximum file size is 4MB'
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Store as base64 (for files < 500KB to avoid database bloat)
    // For larger files, store metadata only
    let fileUrl = ''
    if (buffer.length < 500 * 1024) {
      const base64 = buffer.toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
    } else {
      // For larger files, store as base64 anyway (in production, use S3/Cloudinary)
      const base64 = buffer.toString('base64')
      fileUrl = `data:${file.type};base64,${base64}`
    }

    // Create attachment record
    const attachment = await db.attachment.create({
      data: {
        name: fileName,
        originalName: originalName,
        mimeType: file.type || 'application/octet-stream',
        size: buffer.length,
        url: fileUrl,
        resourceId: resourceId || null,
        uploadedBy: uploadedBy || 'system'
      }
    })

    console.log('Attachment created:', attachment.id)

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        name: attachment.name,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: attachment.url
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
