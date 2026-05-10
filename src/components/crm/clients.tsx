'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  Loader2,
  X,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Building2,
  Upload,
  Download,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  address: string
  status: string
  createdAt: string
  updatedAt: string
  proposalCount: number
}

interface ClientFormData {
  name: string
  address: string
  status: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  Inactive: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
}

const EMPTY_FORM: ClientFormData = {
  name: '',
  address: '',
  status: 'Active',
}

type SortField = 'name' | 'status' | 'proposalCount' | 'createdAt'
type SortDirection = 'asc' | 'desc'

// ─── Sort Indicator Component ──────────────────────────────────────────────

function SortIndicator({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) {
    return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
  }
  return sortDirection === 'asc' ? (
    <ChevronUp className="ml-1 inline size-3" />
  ) : (
    <ChevronDown className="ml-1 inline size-3" />
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CRMClients() {
  const queryClient = useQueryClient()

  // ── State ────────────────────────────────────────────────────────────────

  const [search, setSearch] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [sortField, setSortField] = React.useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)
  const [formData, setFormData] = React.useState<ClientFormData>(EMPTY_FORM)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)

  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [importResult, setImportResult] = React.useState<{ message: string; created: number; skipped: number; errors?: string[] } | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
  })

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientFormData }) => {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete client')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to import clients')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setImportResult(data)
    },
    onError: (error: Error) => {
      setImportResult({ message: error.message, created: 0, skipped: 0 })
    },
  })

  // ── Filtering & Sorting ──────────────────────────────────────────────────

  const filteredClients = React.useMemo(() => {
    let result = [...clients]

    // Search filter
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(lower))
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'proposalCount':
          comparison = a.proposalCount - b.proposalCount
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [clients, search, filterStatus, sortField, sortDirection])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const openAddDialog = () => {
    setEditingClient(null)
    setFormData(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      address: client.address,
      status: client.status,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingClient(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const openDeleteDialog = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteMutation.mutate(clientToDelete.id)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('all')
  }

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/clients/import')
      if (!res.ok) throw new Error('Failed to download template')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'clients_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download template')
    }
  }

  const hasActiveFilters = search || filterStatus !== 'all'
  const isSaving = createMutation.isPending || updateMutation.isPending

  const activeCount = clients.filter((c) => c.status === 'Active').length
  const inactiveCount = clients.filter((c) => c.status === 'Inactive').length

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6" />
            Clients
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your client relationships
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => { setImportDialogOpen(true); setImportResult(null) }}>
            <Upload className="size-4 mr-1.5" />
            Import
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="size-4 mr-1.5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100">
              <Users className="size-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-xl font-bold">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50">
              <Users className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50">
              <Users className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-xl font-bold text-red-700">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="size-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Building2 className="size-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search term.'
                  : 'Get started by adding your first client.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <SortIndicator field="name" sortField={sortField} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <SortIndicator field="status" sortField={sortField} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => handleSort('proposalCount')}
                    >
                      Proposals
                      <SortIndicator field="proposalCount" sortField={sortField} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created Date
                      <SortIndicator field="createdAt" sortField={sortField} sortDirection={sortDirection} />
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[250px] truncate">
                        {client.address || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_BADGE_STYLES[client.status] || ''}
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${client.proposalCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {client.proposalCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(() => { try { return client.createdAt ? format(parseISO(client.createdAt), 'MMM dd, yyyy') : '—' } catch { return '—' } })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(client)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filteredClients.length > 0 && (
            <div className="border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredClients.length} of {clients.length} clients
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update the client details below.'
                : 'Fill in the details to create a new client.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                placeholder="Client name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-address">Address</Label>
              <Input
                id="client-address"
                placeholder="Client address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim() || isSaving}>
              {isSaving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {editingClient ? 'Save Changes' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────────── */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {clientToDelete?.name}
              </span>
              ? This action cannot be undone.
              {clientToDelete && clientToDelete.proposalCount > 0 && (
                <span className="mt-2 block text-amber-600 font-medium">
                  This client has {clientToDelete.proposalCount} associated
                  proposal{clientToDelete.proposalCount > 1 ? 's' : ''}. Deleting
                  will also remove those proposals.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Import Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResult(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Clients from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import clients.
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="size-4 mr-1.5" />
                  Download Template
                </Button>
                <span className="text-xs text-muted-foreground">
                  Get the CSV template with required columns
                </span>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      importMutation.mutate(file)
                    }
                  }}
                  disabled={importMutation.isPending}
                  className="max-w-sm mx-auto"
                />
                {importMutation.isPending && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">CSV Columns:</p>
                <p>name*, address, status</p>
                <p className="mt-1">* Required. Status: Active or Inactive (defaults to Active)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className={`rounded-lg p-4 ${importResult.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className="font-semibold text-sm">{importResult.message}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-green-700">Created: {importResult.created}</span>
                  <span className="text-amber-700">Skipped: {importResult.skipped}</span>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setImportDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
