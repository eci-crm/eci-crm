'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  FileText,
  Loader2,
  X,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  address: string
  status: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface ThematicArea {
  id: string
  name: string
  color: string
  sortOrder: number
}

interface Service {
  id: string
  name: string
  color: string
  sortOrder: number
}

interface Proposal {
  id: string
  name: string
  rfpNumber: string
  clientId: string
  assignedMemberId: string | null
  value: number
  status: string
  winningChances: string
  focalPerson: string
  followUpDate: string | null
  remarks: string
  deadline: string | null
  submissionDate: string | null
  createdAt: string
  updatedAt: string
  client: Client
  assignedMember: TeamMember | null
  thematicAreas: { id: string; thematicAreaId: string; thematicArea: ThematicArea }[]
  services: { id: string; serviceId: string; service: Service }[]
}

interface ProposalFormData {
  name: string
  rfpNumber: string
  clientId: string
  assignedMemberId: string
  value: number
  status: string
  winningChances: string
  focalPerson: string
  followUpDate: string
  remarks: string
  deadline: string
  submissionDate: string
  thematicAreaIds: string[]
  serviceIds: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected'] as const

const WINNING_CHANCES_OPTIONS = ['Low', 'Medium', 'High'] as const

const STATUS_BADGE_STYLES: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  'In Process': 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  'In Evaluation': 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  Pending: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
  Won: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  Rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
}

const WINNING_CHANCES_STYLES: Record<string, string> = {
  Low: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  High: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
}

const ITEMS_PER_PAGE = 15

const EMPTY_FORM: ProposalFormData = {
  name: '',
  rfpNumber: '',
  clientId: '',
  assignedMemberId: '',
  value: 0,
  status: 'In Process',
  winningChances: '',
  focalPerson: '',
  followUpDate: '',
  remarks: '',
  deadline: '',
  submissionDate: '',
  thematicAreaIds: [],
  serviceIds: [],
}

type SortField =
  | 'name'
  | 'rfpNumber'
  | 'client'
  | 'value'
  | 'status'
  | 'winningChances'
  | 'assignedMember'
  | 'deadline'
  | 'createdAt'
type SortDirection = 'asc' | 'desc'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPKR(value: number): string {
  return `₨ ${value.toLocaleString()}`
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy')
  } catch {
    return '—'
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Proposals() {
  const queryClient = useQueryClient()

  // ── State ────────────────────────────────────────────────────────────────

  const [search, setSearch] = React.useState('')
  const [filterClient, setFilterClient] = React.useState('all')
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [filterMember, setFilterMember] = React.useState('all')
  const [filterService, setFilterService] = React.useState('all')
  const [filterStartDate, setFilterStartDate] = React.useState('')
  const [filterEndDate, setFilterEndDate] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)

  const [sortField, setSortField] = React.useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')

  const [page, setPage] = React.useState(1)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingProposal, setEditingProposal] = React.useState<Proposal | null>(null)
  const [formData, setFormData] = React.useState<ProposalFormData>(EMPTY_FORM)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [proposalToDelete, setProposalToDelete] = React.useState<Proposal | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: [
      'proposals',
      search,
      filterClient,
      filterStatus,
      filterMember,
      filterService,
      filterStartDate,
      filterEndDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterClient !== 'all') params.set('clientId', filterClient)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterMember !== 'all') params.set('assignedMemberId', filterMember)
      if (filterService !== 'all') params.set('serviceId', filterService)
      if (filterStartDate) params.set('startDate', filterStartDate)
      if (filterEndDate) params.set('endDate', filterEndDate)
      const res = await fetch(`/api/proposals?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch proposals')
      return res.json()
    },
  })

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
  })

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/team')
      if (!res.ok) throw new Error('Failed to fetch team')
      return res.json()
    },
  })

  const { data: thematicAreas = [] } = useQuery<ThematicArea[]>({
    queryKey: ['thematic-areas'],
    queryFn: async () => {
      const res = await fetch('/api/thematic-areas')
      if (!res.ok) throw new Error('Failed to fetch thematic areas')
      return res.json()
    },
  })

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await fetch('/api/services')
      if (!res.ok) throw new Error('Failed to fetch services')
      return res.json()
    },
  })

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: ProposalFormData) => {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create proposal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProposalFormData }) => {
      const res = await fetch(`/api/proposals?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update proposal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/proposals?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete proposal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      setDeleteDialogOpen(false)
      setProposalToDelete(null)
    },
  })

  // ── Sorting ──────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProposals = React.useMemo(() => {
    const sorted = [...proposals].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rfpNumber':
          comparison = a.rfpNumber.localeCompare(b.rfpNumber)
          break
        case 'client':
          comparison = a.client.name.localeCompare(b.client.name)
          break
        case 'value':
          comparison = a.value - b.value
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'winningChances':
          comparison = a.winningChances.localeCompare(b.winningChances)
          break
        case 'assignedMember':
          comparison = (a.assignedMember?.name || '').localeCompare(b.assignedMember?.name || '')
          break
        case 'deadline':
          comparison =
            (a.deadline ? new Date(a.deadline).getTime() : 0) -
            (b.deadline ? new Date(b.deadline).getTime() : 0)
          break
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        default:
          comparison = 0
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [proposals, sortField, sortDirection])

  // ── Pagination ───────────────────────────────────────────────────────────

  const paginatedProposals = React.useMemo(() => {
    return sortedProposals.slice(0, page * ITEMS_PER_PAGE)
  }, [sortedProposals, page])

  const hasMore = paginatedProposals.length < sortedProposals.length

  // ── Dialog Handlers ──────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingProposal(null)
    setFormData(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (proposal: Proposal) => {
    setEditingProposal(proposal)
    setFormData({
      name: proposal.name,
      rfpNumber: proposal.rfpNumber,
      clientId: proposal.clientId,
      assignedMemberId: proposal.assignedMemberId || '',
      value: proposal.value,
      status: proposal.status,
      winningChances: proposal.winningChances,
      focalPerson: proposal.focalPerson,
      followUpDate: proposal.followUpDate ? proposal.followUpDate.split('T')[0] : '',
      remarks: proposal.remarks,
      deadline: proposal.deadline ? proposal.deadline.split('T')[0] : '',
      submissionDate: proposal.submissionDate ? proposal.submissionDate.split('T')[0] : '',
      thematicAreaIds: proposal.thematicAreas.map((ta) => ta.thematicAreaId),
      serviceIds: proposal.services.map((s) => s.serviceId),
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingProposal(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.clientId) return

    if (editingProposal) {
      updateMutation.mutate({ id: editingProposal.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const openDeleteDialog = (proposal: Proposal) => {
    setProposalToDelete(proposal)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (proposalToDelete) {
      deleteMutation.mutate(proposalToDelete.id)
    }
  }

  // ── Form Helpers ─────────────────────────────────────────────────────────

  const toggleThematicArea = (areaId: string) => {
    setFormData((prev) => ({
      ...prev,
      thematicAreaIds: prev.thematicAreaIds.includes(areaId)
        ? prev.thematicAreaIds.filter((id) => id !== areaId)
        : [...prev.thematicAreaIds, areaId],
    }))
  }

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilterClient('all')
    setFilterStatus('all')
    setFilterMember('all')
    setFilterService('all')
    setFilterStartDate('')
    setFilterEndDate('')
  }

  const hasActiveFilters =
    search ||
    filterClient !== 'all' ||
    filterStatus !== 'all' ||
    filterMember !== 'all' ||
    filterService !== 'all' ||
    filterStartDate ||
    filterEndDate

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="size-6" />
            Proposals
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your business proposals
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="size-4 mr-1.5" />
          Add Proposal
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search proposals, RFP #, client..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="size-4 mr-1.5" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
                  !
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                <X className="size-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Client Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Client</Label>
                <Select
                  value={filterClient}
                  onValueChange={(val) => {
                    setFilterClient(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(val) => {
                    setFilterStatus(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Member Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
                <Select
                  value={filterMember}
                  onValueChange={(val) => {
                    setFilterMember(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {teamMembers
                      .filter((m) => m.isActive)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Service</Label>
                <Select
                  value={filterService}
                  onValueChange={(val) => {
                    setFilterService(val)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {proposalsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : sortedProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileText className="size-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No proposals found</p>
              <p className="text-sm">Try adjusting your filters or add a new proposal.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        {sortField !== 'name' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('rfpNumber')}
                      >
                        RFP #
                        {sortField !== 'rfpNumber' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('client')}
                      >
                        Client
                        {sortField !== 'client' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right"
                        onClick={() => handleSort('value')}
                      >
                        Value
                        {sortField !== 'value' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {sortField !== 'status' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('winningChances')}
                      >
                        Winning Chances
                        {sortField !== 'winningChances' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('assignedMember')}
                      >
                        Assigned To
                        {sortField !== 'assignedMember' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('deadline')}
                      >
                        Deadline
                        {sortField !== 'deadline' ? (
                          <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
                        ) : sortDirection === 'asc' ? (
                          <ChevronUp className="ml-1 inline size-3" />
                        ) : (
                          <ChevronDown className="ml-1 inline size-3" />
                        )}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className="group transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {proposal.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {proposal.rfpNumber || '—'}
                        </TableCell>
                        <TableCell>{proposal.client.name}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatPKR(proposal.value)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_STYLES[proposal.status] || ''}
                          >
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {proposal.winningChances ? (
                            <Badge
                              variant="outline"
                              className={WINNING_CHANCES_STYLES[proposal.winningChances] || ''}
                            >
                              {proposal.winningChances}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {proposal.assignedMember?.name || (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {proposal.services.length === 0 ? (
                              <span className="text-muted-foreground text-xs">—</span>
                            ) : (
                              proposal.services.map((ps) => (
                                <Badge
                                  key={ps.id}
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 font-medium"
                                  style={{
                                    borderColor: ps.service.color,
                                    color: ps.service.color,
                                    backgroundColor: `${ps.service.color}10`,
                                  }}
                                >
                                  {ps.service.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(proposal.deadline)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0"
                              onClick={() => openEditDialog(proposal)}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(proposal)}
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

              {/* Pagination / Load More */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedProposals.length} of {sortedProposals.length} proposals
                </p>
                {hasMore && (
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                    Load More
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Add/Edit Dialog ──────────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
            <DialogTitle>{editingProposal ? 'Edit Proposal' : 'Add Proposal'}</DialogTitle>
            <DialogDescription>
              {editingProposal
                ? 'Update the proposal details below.'
                : 'Fill in the details to create a new proposal.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 min-h-0">
            <div className="space-y-6 pb-4">
              {/* ── Basic Info ────────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="proposal-name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="proposal-name"
                      placeholder="Proposal name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-rfp">RFP Number</Label>
                    <Input
                      id="proposal-rfp"
                      placeholder="RFP-2024-001"
                      value={formData.rfpNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rfpNumber: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Client <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, clientId: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-value">Value (₨)</Label>
                    <Input
                      id="proposal-value"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.value || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          value: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Winning Chances</Label>
                    <Select
                      value={formData.winningChances}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, winningChances: val }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select chances" />
                      </SelectTrigger>
                      <SelectContent>
                        {WINNING_CHANCES_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Assignment ────────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Assignment
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Assigned Member</Label>
                    <Select
                      value={formData.assignedMemberId}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, assignedMemberId: val }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {teamMembers
                          .filter((m) => m.isActive)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-focal">Focal Person</Label>
                    <Input
                      id="proposal-focal"
                      placeholder="Focal person name"
                      value={formData.focalPerson}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, focalPerson: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Dates ─────────────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Dates
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-deadline">Deadline</Label>
                    <Input
                      id="proposal-deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-submission">Submission Date</Label>
                    <Input
                      id="proposal-submission"
                      type="date"
                      value={formData.submissionDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, submissionDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="proposal-followup">Follow-up Date</Label>
                    <Input
                      id="proposal-followup"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, followUpDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Categorization ────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Categorization
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Thematic Areas */}
                  <div className="space-y-2">
                    <Label>Thematic Areas</Label>
                    {thematicAreas.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No thematic areas available
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 rounded-md border p-3 max-h-48 overflow-y-auto">
                        {thematicAreas.map((area) => (
                          <label
                            key={area.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
                          >
                            <Checkbox
                              checked={formData.thematicAreaIds.includes(area.id)}
                              onCheckedChange={() => toggleThematicArea(area.id)}
                            />
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: area.color }}
                            />
                            <span className="text-sm">{area.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    <Label>Services</Label>
                    {services.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No services available
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 rounded-md border p-3 max-h-48 overflow-y-auto">
                        {services.map((service) => (
                          <label
                            key={service.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
                          >
                            <Checkbox
                              checked={formData.serviceIds.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <span
                              className="inline-block size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="text-sm">{service.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── Other ─────────────────────────────────────────────── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Other
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="proposal-remarks">Remarks</Label>
                  <Textarea
                    id="proposal-remarks"
                    placeholder="Any additional notes or remarks..."
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.clientId || isSaving}
            >
              {isSaving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {editingProposal ? 'Save Changes' : 'Create Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {proposalToDelete?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
