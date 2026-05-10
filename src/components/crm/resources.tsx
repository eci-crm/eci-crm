'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  FolderOpen,
  FolderPlus,
  FileUp,
  Trash2,
  Pencil,
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  MoreHorizontal,
  Loader2,
  Home,
  Search,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FolderNode {
  id: string
  name: string
  parentId: string | null
  children: FolderNode[]
  fileCount: number
}

interface ResourceFile {
  id: string
  name: string
  fileType: string
  fileSize: number
  folderId: string | null
  createdAt: string
}

interface BreadcrumbItem {
  id: string | null
  name: string
}

interface ResourcesData {
  subfolders: { id: string; name: string; parentId: string | null }[]
  files: ResourceFile[]
  breadcrumb: BreadcrumbItem[]
  folderTree: FolderNode[]
  totalFiles: number
  totalFolders: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return FileSpreadsheet
  if (fileType.includes('pdf') || fileType.includes('text') || fileType.includes('document') || fileType.includes('word')) return FileText
  return File
}

function getFileColor(fileType: string): string {
  if (fileType.startsWith('image/')) return 'bg-pink-50 text-pink-600 border-pink-200'
  if (fileType.includes('pdf')) return 'bg-red-50 text-red-600 border-red-200'
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-50 text-blue-600 border-blue-200'
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'bg-orange-50 text-orange-600 border-orange-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileExtension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE'
}

// ─── Folder Tree Item ────────────────────────────────────────────────────────

function FolderTreeItem({
  folder,
  depth,
  currentFolderId,
  onSelect,
}: {
  folder: FolderNode
  depth: number
  currentFolderId: string | null
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = React.useState(depth === 0)
  const isActive = currentFolderId === folder.id
  const hasChildren = folder.children.length > 0

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder.id)
          if (hasChildren) setExpanded(!expanded)
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <FolderOpen className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-amber-500'}`} />
        <span className="truncate">{folder.name}</span>
        {folder.fileCount > 0 && (
          <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4 border-gray-200 text-gray-400">
            {folder.fileCount}
          </Badge>
        )}
      </button>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {folder.children.map((child) => (
              <FolderTreeItem
                key={child.id}
                folder={child}
                depth={depth + 1}
                currentFolderId={currentFolderId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CRMResources() {
  const queryClient = useQueryClient()
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showNewFolderDialog, setShowNewFolderDialog] = React.useState(false)
  const [showUploadDialog, setShowUploadDialog] = React.useState(false)
  const [showRenameDialog, setShowRenameDialog] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [renameName, setRenameName] = React.useState('')
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'folder' | 'file'; id: string; name: string } | null>(null)
  const [uploadFiles, setUploadFiles] = React.useState<File[]>([])

  // Fetch resources
  const { data, isLoading, error } = useQuery<ResourcesData>({
    queryKey: ['resources', currentFolderId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (currentFolderId) params.set('folderId', currentFolderId)
      const res = await fetch(`/api/resources?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch resources')
      return res.json()
    },
  })

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'folder', name, parentId: currentFolderId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create folder')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setShowNewFolderDialog(false)
      setNewFolderName('')
      toast.success('Folder created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = []
      for (const file of files) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'file',
            name: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            fileData: base64,
            folderId: currentFolderId,
          }),
        })
        if (!res.ok) throw new Error('Failed to upload file')
        results.push(await res.json())
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setShowUploadDialog(false)
      setUploadFiles([])
      toast.success('File(s) uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file')
    },
  })

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ type, id, name }: { type: 'folder' | 'file'; id: string; name: string }) => {
      const res = await fetch('/api/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, name }),
      })
      if (!res.ok) throw new Error('Failed to rename')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setShowRenameDialog(false)
      setSelectedItem(null)
      setRenameName('')
      toast.success('Renamed successfully')
    },
    onError: () => {
      toast.error('Failed to rename')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'folder' | 'file'; id: string }) => {
      const res = await fetch(`/api/resources?type=${type}&id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setShowDeleteDialog(false)
      setSelectedItem(null)
      toast.success('Deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete')
    },
  })

  // Download file
  const handleDownload = async (file: ResourceFile) => {
    try {
      const res = await fetch(`/api/resources/download?id=${file.id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download file')
    }
  }

  // Navigate to folder
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  // Filter items by search
  const filteredSubfolders = (data?.subfolders || []).filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredFiles = (data?.files || []).filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Failed to load resources</p>
        <p className="text-sm mt-1">{error.message || 'An unexpected error occurred'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['resources'] })}>
          Try Again
        </Button>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="size-6" />
            Resources
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your files and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="size-4 mr-1.5" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <FileUp className="size-4 mr-1.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl border-0 shadow-sm bg-white ring-1 ring-gray-900/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <FolderOpen className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{data?.totalFolders || 0}</p>
                <p className="text-xs text-muted-foreground">Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm bg-white ring-1 ring-gray-900/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <File className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{data?.totalFiles || 0}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        {/* Sidebar - Folder Tree */}
        <Card className="hidden lg:block w-64 shrink-0 rounded-xl border-0 shadow-sm bg-white ring-1 ring-gray-900/[0.03]">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Folders</h3>
            <ScrollArea className="max-h-[500px]">
              <button
                onClick={() => navigateToFolder(null)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  currentFolderId === null
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="h-4 w-4 shrink-0" />
                <span className="truncate">Root</span>
              </button>
              {(data?.folderTree || []).map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  depth={0}
                  currentFolderId={currentFolderId}
                  onSelect={navigateToFolder}
                />
              ))}
              {(data?.folderTree || []).length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  No folders yet
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Breadcrumb + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
              {(data?.breadcrumb || []).map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                  <button
                    onClick={() => navigateToFolder(item.id)}
                    className={`text-sm whitespace-nowrap rounded-md px-1.5 py-0.5 transition-colors ${
                      idx === (data?.breadcrumb || []).length - 1
                        ? 'font-semibold text-gray-900 bg-gray-100'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files & folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-gray-700" />
                </button>
              )}
            </div>
          </div>

          {/* Folder grid */}
          {filteredSubfolders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Folders</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredSubfolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card
                      className="group cursor-pointer rounded-xl border-0 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-gray-900/[0.03]"
                      onClick={() => navigateToFolder(folder.id)}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <FolderOpen className="h-6 w-6 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-800 text-center truncate w-full">
                          {folder.name}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem({ type: 'folder', id: folder.id, name: folder.name })
                              setRenameName(folder.name)
                              setShowRenameDialog(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem({ type: 'folder', id: folder.id, name: folder.name })
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Files grid */}
          {filteredFiles.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Files</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.fileType)
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card className="group cursor-pointer rounded-xl border-0 shadow-sm bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-gray-900/[0.03]">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${getFileColor(file.fileType)}`}>
                            <FileIcon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 text-center truncate w-full">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {getFileExtension(file.name)}
                            </Badge>
                            <span>{formatFileSize(file.fileSize)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {file.createdAt ? (() => { try { return format(new Date(file.createdAt), 'MMM dd, yyyy') } catch { return '—' } })() : '—'}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Download"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(file)
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItem({ type: 'file', id: file.id, name: file.name })
                                setRenameName(file.name)
                                setShowRenameDialog(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItem({ type: 'file', id: file.id, name: file.name })
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredSubfolders.length === 0 && filteredFiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {searchTerm ? 'No results found' : 'This folder is empty'}
              </p>
              <p className="text-sm mt-1">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Create a folder or upload files to get started'}
              </p>
              {!searchTerm && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
                    <FolderPlus className="size-4 mr-1.5" />
                    New Folder
                  </Button>
                  <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                    <FileUp className="size-4 mr-1.5" />
                    Upload
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── New Folder Dialog ─────────────────────────────────────────── */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolderMutation.mutate(newFolderName.trim())
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Files Dialog ─────────────────────────────────────────── */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Select files to upload to {currentFolderId ? 'this folder' : 'root'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement
                  if (target.files) {
                    setUploadFiles(Array.from(target.files))
                  }
                }
                input.click()
              }}
            >
              <FileUp className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                Click to select files
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or drag and drop files here
              </p>
            </div>
            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <File className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => setUploadFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUploadDialog(false); setUploadFiles([]) }}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate(uploadFiles)}
              disabled={uploadFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rename Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {selectedItem?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Enter a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rename-name">Name</Label>
              <Input
                id="rename-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedItem && renameName.trim()) {
                    renameMutation.mutate({ type: selectedItem.type, id: selectedItem.id, name: renameName.trim() })
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedItem && renameName.trim()) {
                  renameMutation.mutate({ type: selectedItem.type, id: selectedItem.id, name: renameName.trim() })
                }
              }}
              disabled={!renameName.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItem?.type === 'folder' ? 'Folder' : 'File'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem?.type === 'folder'
                ? `Are you sure you want to delete "${selectedItem?.name}" and all its contents? This action cannot be undone.`
                : `Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedItem) {
                  deleteMutation.mutate({ type: selectedItem.type, id: selectedItem.id })
                }
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
