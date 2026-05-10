import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/resources — list folders and files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId') // null = root, id = specific folder

    // Get all folders (for tree view)
    const allFolders = await db.resourceFolder.findMany({
      orderBy: { name: 'asc' },
    })

    // Get files in the requested folder (or root if no folderId)
    const where: Record<string, unknown> = {}
    if (folderId) {
      where.folderId = folderId
    } else {
      // Root level: folderId is null
      where.folderId = null
    }

    const files = await db.resource.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    // Get subfolders of the current folder
    const subfolders = allFolders.filter((f) =>
      folderId ? f.parentId === folderId : f.parentId === null
    )

    // Build folder path (breadcrumb)
    const breadcrumb: { id: string | null; name: string }[] = [{ id: null, name: 'Root' }]
    if (folderId) {
      let current = allFolders.find((f) => f.id === folderId)
      const pathStack: { id: string; name: string }[] = []
      while (current) {
        pathStack.unshift({ id: current.id, name: current.name })
        current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined
      }
      breadcrumb.push(...pathStack)
    }

    // Build folder tree for sidebar
    interface FolderNode {
      id: string
      name: string
      parentId: string | null
      children: FolderNode[]
      fileCount: number
    }

    const folderMap = new Map<string, FolderNode>()
    for (const f of allFolders) {
      folderMap.set(f.id, { id: f.id, name: f.name, parentId: f.parentId, children: [], fileCount: 0 })
    }

    // Count files in each folder
    const allFiles = await db.resource.findMany({ select: { folderId: true } })
    for (const f of allFiles) {
      if (f.folderId && folderMap.has(f.folderId)) {
        folderMap.get(f.folderId)!.fileCount++
      }
    }

    // Build tree
    const rootFolders: FolderNode[] = []
    for (const [, node] of folderMap) {
      if (node.parentId && folderMap.has(node.parentId)) {
        folderMap.get(node.parentId)!.children.push(node)
      } else if (!node.parentId) {
        rootFolders.push(node)
      }
    }

    return NextResponse.json({
      subfolders,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        fileType: f.fileType,
        fileSize: f.fileSize,
        folderId: f.folderId,
        createdAt: f.createdAt,
      })),
      breadcrumb,
      folderTree: rootFolders,
      totalFiles: allFiles.length,
      totalFolders: allFolders.length,
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}

// POST /api/resources — create folder or upload file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, parentId, fileType, fileSize, fileData, folderId } = body

    if (type === 'folder') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
      }

      // Check for duplicate folder name in same parent
      const existing = await db.resourceFolder.findFirst({
        where: { name: name.trim(), parentId: parentId || null },
      })
      if (existing) {
        return NextResponse.json({ error: 'A folder with this name already exists here' }, { status: 409 })
      }

      const folder = await db.resourceFolder.create({
        data: {
          name: name.trim(),
          parentId: parentId || null,
        },
      })

      return NextResponse.json(folder, { status: 201 })
    }

    if (type === 'file') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'File name is required' }, { status: 400 })
      }

      const file = await db.resource.create({
        data: {
          name: name.trim(),
          filePath: name.trim(),
          fileType: fileType || 'application/octet-stream',
          fileSize: fileSize || 0,
          fileData: fileData || '',
          folderId: folderId || null,
        },
      })

      return NextResponse.json(file, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type. Use "folder" or "file"' }, { status: 400 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}

// PUT /api/resources — rename folder or file
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, name, moveFolderId } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (type === 'folder') {
      if (name !== undefined) {
        if (!name.trim()) {
          return NextResponse.json({ error: 'Folder name cannot be empty' }, { status: 400 })
        }
        const folder = await db.resourceFolder.update({
          where: { id },
          data: { name: name.trim() },
        })
        return NextResponse.json(folder)
      }
      if (moveFolderId !== undefined) {
        if (moveFolderId === id) {
          return NextResponse.json({ error: 'Cannot move a folder into itself' }, { status: 400 })
        }
        const folder = await db.resourceFolder.update({
          where: { id },
          data: { parentId: moveFolderId || null },
        })
        return NextResponse.json(folder)
      }
    }

    if (type === 'file') {
      const data: Record<string, unknown> = {}
      if (name !== undefined) {
        if (!name.trim()) {
          return NextResponse.json({ error: 'File name cannot be empty' }, { status: 400 })
        }
        data.name = name.trim()
        data.filePath = name.trim()
      }
      if (moveFolderId !== undefined) {
        data.folderId = moveFolderId || null
      }
      const file = await db.resource.update({ where: { id }, data })
      return NextResponse.json(file)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}

// DELETE /api/resources — delete folder or file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 })
    }

    if (type === 'folder') {
      // Cascade delete will handle children and resources
      await db.resourceFolder.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'file') {
      await db.resource.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}
