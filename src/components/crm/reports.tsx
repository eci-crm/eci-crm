'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  Filter,
  X,
  Users,
  FileText,
  TrendingUp,
  Target,
  Layers,
  Wrench,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Percent,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Filters {
  clientId: string
  serviceId: string
  thematicAreaId: string
  startDate: string
  endDate: string
  month: string
  quarter: string
  year: string
}

interface Service {
  id: string
  name: string
  color: string
  sortOrder: number
}

interface ClientOption {
  id: string
  name: string
  status: string
}

interface ThematicAreaOption {
  id: string
  name: string
  color: string
}

// Clients Report
interface ClientReportItem {
  id: string
  name: string
  status: string
  totalProposals: number
  totalValue: number
  wonValue: number
}

// Proposals Report
interface ProposalReportItem {
  id: string
  name: string
  rfpNumber: string
  value: number
  status: string
  client: { id: string; name: string }
  assignedMember: { id: string; name: string } | null
  thematicAreas: { thematicArea: { id: string; name: string; color: string } }[]
  services: { service: { id: string; name: string; color: string } }[]
  createdAt: string
}

interface ProposalsSummary {
  totalProposals: number
  totalValue: number
  wonValue: number
  statusBreakdown: Record<string, { count: number; value: number }>
}

// Summary Report
interface SummaryData {
  totalClients: number
  activeClients: number
  totalProposals: number
  totalWonValue: number
  totalTarget: number
  achievementPercentage: number
  monthlyBreakdown: { month: string; target: number; actual: number }[]
}

// Thematic Report
interface ThematicReportItem {
  id: string
  name: string
  color: string
  proposalCount: number
  totalValue: number
  wonValue: number
  proposals: { id: string; name: string; status: string; value: number; client: { id: string; name: string } }[]
}

// Service Report
interface ServiceReportItem {
  id: string
  name: string
  color: string
  proposalCount: number
  totalValue: number
  wonValue: number
  winRate: number
  targetAmount: number
  achievementPct: number
  proposals: { id: string; name: string; status: string; value: number; client: { id: string; name: string } }[]
}

interface ServiceReportSummary {
  totalServices: number
  proposalsWithServices: number
  serviceCoverage: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#3b82f6',
  'In Process': '#f59e0b',
  'In Evaluation': '#8b5cf6',
  Pending: '#f97316',
  Won: '#10b981',
  Rejected: '#ef4444',
}

const STATUS_BG: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Process': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Evaluation': 'bg-purple-100 text-purple-700 border-purple-200',
  Pending: 'bg-orange-100 text-orange-700 border-orange-200',
  Won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
}

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
]

const QUARTERS = [
  { value: '', label: 'All Quarters' },
  { value: '1', label: 'Q1 (Jan-Mar)' },
  { value: '2', label: 'Q2 (Apr-Jun)' },
  { value: '3', label: 'Q3 (Jul-Sep)' },
  { value: '4', label: 'Q4 (Oct-Dec)' },
]

const YEARS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
]

const formatPKR = (value: number) => `₨ ${value.toLocaleString()}`

const formatCompactPKR = (value: number) => {
  if (value >= 1000000000) return `₨ ${(value / 1000000000).toFixed(1)}B`
  if (value >= 1000000) return `₨ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₨ ${(value / 1000).toFixed(0)}K`
  return `₨ ${value.toLocaleString()}`
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  fontSize: '12px',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CRMReports() {
  const currentYear = String(new Date().getFullYear())

  const [filters, setFilters] = useState<Filters>({
    clientId: '',
    serviceId: '',
    thematicAreaId: '',
    startDate: '',
    endDate: '',
    month: '',
    quarter: '',
    year: currentYear,
  })

  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    clientId: '',
    serviceId: '',
    thematicAreaId: '',
    startDate: '',
    endDate: '',
    month: '',
    quarter: '',
    year: currentYear,
  })

  const [activeTab, setActiveTab] = useState('clients')
  const [expandedThematic, setExpandedThematic] = useState<Record<string, boolean>>({})
  const [expandedService, setExpandedService] = useState<Record<string, boolean>>({})

  // Fetch services for filter dropdown
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services').then((r) => r.json()),
  })

  // Fetch clients for filter dropdown
  const { data: clientsList = [] } = useQuery<ClientOption[]>({
    queryKey: ['clients-list'],
    queryFn: () => fetch('/api/clients').then((r) => r.json()),
  })

  // Fetch thematic areas for filter dropdown
  const { data: thematicAreas = [] } = useQuery<ThematicAreaOption[]>({
    queryKey: ['thematic-areas-list'],
    queryFn: () => fetch('/api/thematic-areas').then((r) => r.json()),
  })

  // Build query params from applied filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (appliedFilters.clientId) params.set('clientId', appliedFilters.clientId)
    if (appliedFilters.serviceId) params.set('serviceId', appliedFilters.serviceId)
    if (appliedFilters.thematicAreaId) params.set('thematicAreaId', appliedFilters.thematicAreaId)
    if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate)
    if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate)
    if (appliedFilters.month !== '') params.set('month', appliedFilters.month)
    if (appliedFilters.quarter !== '') params.set('quarter', appliedFilters.quarter)
    if (appliedFilters.year) params.set('year', appliedFilters.year)
    return params.toString()
  }, [appliedFilters])

  // ── Report Queries ──────────────────────────────────────────────────────

  const { data: clientsData, isLoading: clientsLoading } = useQuery<{ type: string; data: ClientReportItem[] }>({
    queryKey: ['report', 'clients', queryParams],
    queryFn: () => fetch(`/api/reports?type=clients&${queryParams}`).then((r) => r.json()),
    enabled: activeTab === 'clients',
  })

  const { data: proposalsData, isLoading: proposalsLoading } = useQuery<{
    type: string
    data: ProposalReportItem[]
    summary: ProposalsSummary
  }>({
    queryKey: ['report', 'proposals', queryParams],
    queryFn: () => fetch(`/api/reports?type=proposals&${queryParams}`).then((r) => r.json()),
    enabled: activeTab === 'proposals',
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ type: string; data: SummaryData }>({
    queryKey: ['report', 'summary', queryParams],
    queryFn: () => fetch(`/api/reports?type=summary&${queryParams}`).then((r) => r.json()),
    enabled: activeTab === 'summary',
  })

  const { data: thematicData, isLoading: thematicLoading } = useQuery<{ type: string; data: ThematicReportItem[] }>({
    queryKey: ['report', 'thematic', queryParams],
    queryFn: () => fetch(`/api/reports?type=thematic&${queryParams}`).then((r) => r.json()),
    enabled: activeTab === 'thematic',
  })

  const { data: serviceData, isLoading: serviceLoading } = useQuery<{
    type: string
    data: ServiceReportItem[]
    summary: ServiceReportSummary
  }>({
    queryKey: ['report', 'service', queryParams],
    queryFn: () => fetch(`/api/reports?type=service&${queryParams}`).then((r) => r.json()),
    enabled: activeTab === 'service',
  })

  // ── Derived Data ────────────────────────────────────────────────────────

  // Clients chart data
  const clientsChartData = useMemo(() => {
    if (!clientsData?.data) return []
    const statusMap: Record<string, number> = {}
    for (const c of clientsData.data) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1
    }
    return Object.entries(statusMap).map(([status, count]) => ({
      name: status,
      count,
      fill: STATUS_COLORS[status] || '#94a3b8',
    }))
  }, [clientsData])

  const clientsSummary = useMemo(() => {
    if (!clientsData?.data) return { total: 0, active: 0, inactive: 0 }
    const total = clientsData.data.length
    const active = clientsData.data.filter((c) => c.status === 'Active').length
    const inactive = total - active
    return { total, active, inactive }
  }, [clientsData])

  // Proposals chart data
  const proposalsPieData = useMemo(() => {
    if (!proposalsData?.summary?.statusBreakdown) return []
    return Object.entries(proposalsData.summary.statusBreakdown)
      .filter(([, data]) => data.count > 0)
      .map(([status, data]) => ({
        name: status,
        value: data.count,
        fill: STATUS_COLORS[status] || '#94a3b8',
      }))
  }, [proposalsData])

  // Summary chart data
  const summaryMonthlyChartData = useMemo(() => {
    if (!summaryData?.data?.monthlyBreakdown) return []
    return summaryData.data.monthlyBreakdown.map((m) => ({
      name: m.month,
      Won: m.actual,
      Target: m.target,
    }))
  }, [summaryData])

  // Thematic chart data
  const thematicChartData = useMemo(() => {
    if (!thematicData?.data) return []
    return thematicData.data
      .filter((t) => t.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((t) => ({
        name: t.name.length > 18 ? t.name.substring(0, 18) + '...' : t.name,
        Total: t.totalValue,
        Won: t.wonValue,
        fill: t.color,
      }))
  }, [thematicData])

  // Service chart data
  const serviceBarChartData = useMemo(() => {
    if (!serviceData?.data) return []
    return serviceData.data
      .filter((s) => s.wonValue > 0)
      .sort((a, b) => b.wonValue - a.wonValue)
      .map((s) => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
        Won: s.wonValue,
        fill: s.color,
      }))
  }, [serviceData])

  const servicePieData = useMemo(() => {
    if (!serviceData?.data) return []
    return serviceData.data
      .filter((s) => s.proposalCount > 0)
      .map((s) => ({
        name: s.name,
        value: s.proposalCount,
        fill: s.color,
      }))
  }, [serviceData])

  // ── Handlers ────────────────────────────────────────────────────────────

  const applyFilters = () => {
    setAppliedFilters({ ...filters })
  }

  const clearFilters = () => {
    const reset = {
      clientId: '',
      serviceId: '',
      thematicAreaId: '',
      startDate: '',
      endDate: '',
      month: '',
      quarter: '',
      year: currentYear,
    }
    setFilters(reset)
    setAppliedFilters(reset)
  }

  const hasActiveFilters =
    filters.clientId ||
    filters.serviceId ||
    filters.thematicAreaId ||
    filters.startDate ||
    filters.endDate ||
    filters.month !== '' ||
    filters.quarter !== ''

  const toggleThematic = (id: string) => {
    setExpandedThematic((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleServiceExpand = (id: string) => {
    setExpandedService((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const renderStatusBadge = (status: string) => (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0.5 h-5 ${STATUS_BG[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
    >
      {status}
    </Badge>
  )

  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-lg font-medium">{message}</p>
      <p className="text-sm mt-1">Try adjusting your filters or check back later.</p>
    </div>
  )

  // ─── Tab: Clients Report ─────────────────────────────────────────────────

  const renderClientsTab = () => {
    if (clientsLoading) return renderLoading()
    if (!clientsData?.data || clientsData.data.length === 0) return renderEmpty('No client data available')

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{clientsSummary.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold text-emerald-600">{clientsSummary.active}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Inactive Clients</p>
                  <p className="text-2xl font-bold text-gray-500">{clientsSummary.inactive}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart: Clients by Status */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Clients by Status</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientsChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {clientsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Proposal Count</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Won Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsData.data.map((client, idx) => (
                    <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{renderStatusBadge(client.status)}</TableCell>
                      <TableCell className="text-center">{client.totalProposals}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatPKR(client.totalValue)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">{formatPKR(client.wonValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Tab: Proposals Report ───────────────────────────────────────────────

  const renderProposalsTab = () => {
    if (proposalsLoading) return renderLoading()
    if (!proposalsData?.data || proposalsData.data.length === 0) return renderEmpty('No proposals data available')

    const summary = proposalsData.summary
    const winRate = summary.totalProposals > 0
      ? Math.round(((summary.statusBreakdown?.['Won']?.count || 0) / summary.totalProposals) * 100)
      : 0

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalProposals}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactPKR(summary.totalValue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Won Value</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCompactPKR(summary.wonValue)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{winRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart: Proposals by Status */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Proposals by Status</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-64 w-full sm:w-1/2">
                  {proposalsPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={proposalsPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {proposalsPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, 'Proposals']}
                          contentStyle={CHART_TOOLTIP_STYLE}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No proposal data
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-2.5">
                  {proposalsPieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({summary.totalProposals > 0 ? Math.round((item.value / summary.totalProposals) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Value Breakdown */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Value by Status</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              {Object.entries(summary.statusBreakdown || {}).map(([status, data]) => {
                const pct = summary.totalValue > 0 ? Math.round((data.value / summary.totalValue) * 100) : 0
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(status)}
                        <span className="text-xs text-muted-foreground">{data.count} proposals</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{formatCompactPKR(data.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[status] || '#94a3b8',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Proposals Table */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              All Proposals ({proposalsData.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service(s)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalsData.data.map((proposal, idx) => (
                    <TableRow key={proposal.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{proposal.name}</TableCell>
                      <TableCell>{proposal.client.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatPKR(proposal.value)}</TableCell>
                      <TableCell>{renderStatusBadge(proposal.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {proposal.services.length === 0 ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            proposal.services.map((ps) => (
                              <Badge
                                key={ps.service.id}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-5"
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
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Tab: Summary Report ─────────────────────────────────────────────────

  const renderSummaryTab = () => {
    if (summaryLoading) return renderLoading()
    if (!summaryData?.data) return renderEmpty('No summary data available')

    const d = summaryData.data
    const avgProposalValue = d.totalProposals > 0 ? Math.round(d.totalWonValue / d.totalProposals) : 0
    const wonCount = d.monthlyBreakdown.reduce((sum, m) => sum + (m.actual > 0 ? 1 : 0), 0)

    return (
      <div className="space-y-6">
        {/* Overall Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{d.totalClients}</p>
                  <p className="text-xs text-muted-foreground">{d.activeClients} active</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{d.totalProposals}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Business Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactPKR(d.totalWonValue)}</p>
                  <p className="text-xs text-muted-foreground">from won proposals</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Target Achievement</p>
                  <p className="text-2xl font-bold text-gray-900">{d.achievementPercentage}%</p>
                  <p className="text-xs text-muted-foreground">of {formatCompactPKR(d.totalTarget)} target</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Business Bar Chart */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Monthly Business (Won Proposals) — {appliedFilters.year}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-72">
              {summaryMonthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryMonthlyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => formatCompactPKR(v)}
                    />
                    <Tooltip formatter={(value: number) => formatPKR(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} iconType="rounded" />
                    <Bar dataKey="Won" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Proposal Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    {d.totalProposals > 0 ? formatPKR(Math.round(d.totalWonValue / d.totalProposals)) : '₨ 0'}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Winning Value</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {wonCount > 0 ? formatPKR(Math.round(d.totalWonValue / wonCount)) : '₨ 0'}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold text-gray-900">
                    {d.totalProposals > 0 ? Math.round((d.totalWonValue > 0 ? wonCount : 0) / d.totalProposals * 100) : 0}%
                  </p>
                </div>
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {d.monthlyBreakdown.map((m) => (
                    <div key={m.month} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700 w-12">{m.month}</span>
                      <div className="flex-1 mx-3">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${m.target > 0 ? Math.min((m.actual / m.target) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className="text-xs font-medium text-emerald-600">{formatCompactPKR(m.actual)}</span>
                        <span className="text-xs text-muted-foreground"> / {formatCompactPKR(m.target)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Tab: Thematic Report ────────────────────────────────────────────────

  const renderThematicTab = () => {
    if (thematicLoading) return renderLoading()
    if (!thematicData?.data || thematicData.data.length === 0) return renderEmpty('No thematic data available')

    const totalThematicValue = thematicData.data.reduce((sum, t) => sum + t.totalValue, 0)

    return (
      <div className="space-y-6">
        {/* Bar Chart: Value by Thematic Area */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Value by Thematic Area</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-72">
              {thematicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={thematicChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => formatCompactPKR(v)}
                    />
                    <Tooltip formatter={(value: number) => formatPKR(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} iconType="rounded" />
                    <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Won" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No thematic data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Table */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Thematic Area Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Thematic Area</TableHead>
                  <TableHead className="text-center">Proposals</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Won Value</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thematicData.data.map((area) => {
                  const wonCount = area.proposals.filter((p) => p.status === 'Won').length
                  const winRate = area.proposalCount > 0 ? Math.round((wonCount / area.proposalCount) * 100) : 0
                  return (
                    <TableRow key={area.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: area.color }} />
                          <span className="font-medium">{area.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{area.proposalCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatPKR(area.totalValue)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">{formatPKR(area.wonValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${winRate >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                        >
                          {winRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Collapsible Sections per Thematic Area */}
        <div className="space-y-3">
          {thematicData.data
            .filter((area) => area.proposalCount > 0)
            .map((area) => {
              const wonCount = area.proposals.filter((p) => p.status === 'Won').length
              const winRate = area.proposalCount > 0 ? Math.round((wonCount / area.proposalCount) * 100) : 0
              return (
                <Card key={area.id} className="rounded-xl shadow-sm border bg-white">
                  <Collapsible
                    open={expandedThematic[area.id]}
                    onOpenChange={() => toggleThematic(area.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: area.color }} />
                          <span className="font-semibold text-gray-900">{area.name}</span>
                          <Badge variant="outline" className="text-xs bg-gray-50">
                            {area.proposalCount} proposals
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {formatCompactPKR(area.wonValue)} won
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            {winRate}% win rate
                          </Badge>
                        </div>
                        {expandedThematic[area.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Proposal</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {area.proposals.map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell>{p.client.name}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatPKR(p.value)}</TableCell>
                                <TableCell>{renderStatusBadge(p.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
        </div>
      </div>
    )
  }

  // ─── Tab: Service Report ─────────────────────────────────────────────────

  const renderServiceTab = () => {
    if (serviceLoading) return renderLoading()
    if (!serviceData?.data || serviceData.data.length === 0) return renderEmpty('No service data available')

    const serviceSummary = serviceData.summary

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{serviceSummary.totalServices}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Wrench className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Proposals with Services</p>
                  <p className="text-2xl font-bold text-gray-900">{serviceSummary.proposalsWithServices}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Service Coverage</p>
                  <p className="text-2xl font-bold text-emerald-600">{serviceSummary.serviceCoverage}%</p>
                  <p className="text-xs text-muted-foreground">of proposals linked to services</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Percent className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart: Business Value by Service */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Business Value by Service (Won)</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-72">
                {serviceBarChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBarChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => formatCompactPKR(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        width={120}
                      />
                      <Tooltip formatter={(value: number) => formatPKR(value)} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="Won" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {serviceBarChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No won business data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart: Proposal Distribution by Service */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Proposal Distribution by Service</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-64 w-full sm:w-1/2">
                  {servicePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {servicePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, 'Proposals']}
                          contentStyle={CHART_TOOLTIP_STYLE}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No service data
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-2.5">
                  {servicePieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="text-sm text-gray-700 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Table */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Service Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Service</TableHead>
                    <TableHead className="text-center">Proposals</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Won Value</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="text-center">Achievement</TableHead>
                    <TableHead className="w-[180px]">Target vs Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceData.data.map((service) => (
                    <TableRow key={service.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: service.color }} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{service.proposalCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatPKR(service.totalValue)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">{formatPKR(service.wonValue)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${service.winRate >= 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : service.winRate > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        >
                          {service.winRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {service.targetAmount > 0 ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${service.achievementPct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : service.achievementPct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                          >
                            {service.achievementPct}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No target</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.targetAmount > 0 ? (
                          <div className="space-y-1">
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  service.achievementPct >= 100 ? 'bg-emerald-500' : service.achievementPct >= 50 ? 'bg-amber-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${Math.min(service.achievementPct, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{formatCompactPKR(service.wonValue)}</span>
                              <span>{formatCompactPKR(service.targetAmount)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-2.5 bg-gray-100 rounded-full" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Collapsible Sections per Service */}
        <div className="space-y-3">
          {serviceData.data
            .filter((s) => s.proposalCount > 0)
            .map((service) => (
              <Card key={service.id} className="rounded-xl shadow-sm border bg-white">
                <Collapsible
                  open={expandedService[service.id]}
                  onOpenChange={() => toggleServiceExpand(service.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: service.color }} />
                        <span className="font-semibold text-gray-900">{service.name}</span>
                        <Badge variant="outline" className="text-xs bg-gray-50">
                          {service.proposalCount} proposals
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          {formatCompactPKR(service.wonValue)} won
                        </Badge>
                        {service.targetAmount > 0 && (
                          <Badge variant="outline" className={`text-xs ${service.achievementPct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {service.achievementPct}% of target
                          </Badge>
                        )}
                      </div>
                      {expandedService[service.id] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proposal</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {service.proposals.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell>{p.client.name}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{formatPKR(p.value)}</TableCell>
                              <TableCell>{renderStatusBadge(p.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-emerald-600" />
              Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comprehensive analytics &amp; business intelligence
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(), 'MMM dd, yyyy')}
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <Card className="rounded-xl shadow-sm border bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            {/* Row 1: Client, Service, Thematic Area */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Client</label>
                <Select
                  value={filters.clientId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, clientId: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Clients</SelectItem>
                    {clientsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Service</label>
                <Select
                  value={filters.serviceId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, serviceId: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Thematic Area</label>
                <Select
                  value={filters.thematicAreaId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, thematicAreaId: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All Thematic Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Thematic Areas</SelectItem>
                    {thematicAreas.map((ta) => (
                      <SelectItem key={ta.id} value={ta.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: ta.color }} />
                          <span className="truncate">{ta.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Row 2: From Date, To Date, Month, Quarter, Year, Apply/Clear */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Month</label>
                <Select
                  value={filters.month}
                  onValueChange={(v) => setFilters((f) => ({ ...f, month: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value || '__all__'} value={m.value || '__all__'}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Quarter</label>
                <Select
                  value={filters.quarter}
                  onValueChange={(v) => setFilters((f) => ({ ...f, quarter: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q.value || '__all__'} value={q.value || '__all__'}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Year</label>
                <Select
                  value={filters.year}
                  onValueChange={(v) => setFilters((f) => ({ ...f, year: v }))}
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y.value} value={y.value}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-transparent">Action</label>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={applyFilters}
                    className="h-9 flex-1 text-sm gap-1.5"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 text-sm gap-1"
                    disabled={!hasActiveFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm rounded-xl h-auto p-1.5 gap-1">
            <TabsTrigger value="clients" className="rounded-lg text-xs sm:text-sm gap-1.5 px-3 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="rounded-lg text-xs sm:text-sm gap-1.5 px-3 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-lg text-xs sm:text-sm gap-1.5 px-3 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="thematic" className="rounded-lg text-xs sm:text-sm gap-1.5 px-3 py-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Thematic</span>
            </TabsTrigger>
            <TabsTrigger value="service" className="rounded-lg text-xs sm:text-sm gap-1.5 px-3 py-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Service</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4">
            {renderClientsTab()}
          </TabsContent>
          <TabsContent value="proposals" className="mt-4">
            {renderProposalsTab()}
          </TabsContent>
          <TabsContent value="summary" className="mt-4">
            {renderSummaryTab()}
          </TabsContent>
          <TabsContent value="thematic" className="mt-4">
            {renderThematicTab()}
          </TabsContent>
          <TabsContent value="service" className="mt-4">
            {renderServiceTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
