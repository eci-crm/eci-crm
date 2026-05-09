'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays, parseISO } from 'date-fns'
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
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  Target,
  Calendar,
  Filter,
  X,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Users,
  Trophy,
  DollarSign,
  Percent,
  Timer,
  Funnel,
  Activity,
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Filters {
  serviceId: string
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

interface MonthlyProgress {
  month: string
  target: number
  actual: number
}

interface QuarterlyProgress {
  quarter: string
  target: number
  actual: number
}

interface ServiceWiseSummary {
  service: { id: string; name: string; color: string }
  proposals: number
  totalValue: number
  wonValue: number
}

interface ProposalStatusSummary {
  [status: string]: number
}

interface RecentProposal {
  id: string
  name: string
  value: number
  status: string
  createdAt: string
  client: { id: string; name: string }
}

interface UpcomingDeadline {
  id: string
  name: string
  status: string
  deadline: string | null
  client: { id: string; name: string }
}

interface TopClient {
  id: string
  name: string
  status: string
  wonValue: number
}

interface ClientAnalytics {
  topClients: TopClient[]
  activeClients: number
  inactiveClients: number
  newClientsThisMonth: number
}

interface TeamMemberPerformance {
  id: string
  name: string
  role: string
  wonProposals: number
  wonValue: number
}

interface PipelineStats {
  averageProposalValue: number
  conversionRate: number
  avgDaysToWin: number
  pipelineValue: number
}

interface MonthlyRevenueTrend {
  month: string
  revenue: number
}

interface DashboardData {
  clientCounts: { total: number; active: number; inactive: number }
  proposalCounts: { total: number; byStatus: Record<string, number> }
  totalBusiness: number
  targetVsActual: {
    target: number
    actual: number
    percentageAchieved: number
    remaining: number
  }
  monthlyProgress: MonthlyProgress[]
  quarterlyProgress: QuarterlyProgress[]
  annualProgress: { target: number; actual: number }
  serviceWiseSummary: ServiceWiseSummary[]
  proposalStatusSummary: ProposalStatusSummary
  upcomingDeadlines: UpcomingDeadline[]
  recentProposals: RecentProposal[]
  clientAnalytics: ClientAnalytics
  teamPerformance: TeamMemberPerformance[]
  pipelineStats: PipelineStats
  monthlyRevenueTrend: MonthlyRevenueTrend[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#3b82f6',
  'In Process': '#f59e0b',
  'In Evaluation': '#8b5cf6',
  Pending: '#f97316',
  Won: '#10b981',
}

const STATUS_BG: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  'In Process': 'bg-amber-100 text-amber-700 border-amber-200',
  'In Evaluation': 'bg-purple-100 text-purple-700 border-purple-200',
  Pending: 'bg-orange-100 text-orange-700 border-orange-200',
  Won: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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

// ─── useCountUp Hook ─────────────────────────────────────────────────────────

function useCountUp(end: number, duration: number = 1200): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const prevEnd = useRef(end)

  useEffect(() => {
    // Only re-animate when the end value changes
    if (Math.abs(prevEnd.current - end) < 0.5) return
    prevEnd.current = end

    const startVal = 0
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (end - startVal) * eased
      setCount(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [end, duration])

  return count
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={percentage >= 100 ? '#10b981' : '#3b82f6'}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

function MiniDonut({ won, total }: { won: number; total: number }) {
  const size = 48
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const wonPct = total > 0 ? (won / total) * 100 : 0
  const wonOffset = circumference - (wonPct / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={wonOffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function ActiveInactiveDonut({ active, inactive }: { active: number; inactive: number }) {
  const total = active + inactive
  const size = 64
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const activePct = total > 0 ? (active / total) * 100 : 0
  const activeOffset = circumference - (activePct / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#fecaca"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={activeOffset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

// ─── AnimatedValue Component ─────────────────────────────────────────────────

function AnimatedValue({ value }: { value: number }) {
  const animated = useCountUp(value, 1400)
  return <>{formatCompactPKR(Math.round(animated))}</>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CRMDashboard() {
  const currentYear = String(new Date().getFullYear())

  const [filters, setFilters] = useState<Filters>({
    serviceId: '',
    startDate: '',
    endDate: '',
    month: '',
    quarter: '',
    year: currentYear,
  })

  // Fetch services for filter dropdown
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services').then((r) => r.json()),
  })

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.serviceId) params.set('serviceId', filters.serviceId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.month !== '') params.set('month', filters.month)
    if (filters.quarter !== '') params.set('quarter', filters.quarter)
    if (filters.year) params.set('year', filters.year)
    return params.toString()
  }, [filters])

  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading,
    isError,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard', queryParams],
    queryFn: () => fetch(`/api/dashboard?${queryParams}`).then((r) => r.json()),
    enabled: true,
  })

  // Determine current month for monthly progress card
  const currentMonthIndex = new Date().getMonth()
  const currentMonthData = dashboard?.monthlyProgress?.[currentMonthIndex]

  // Proposal status for pie chart
  const proposalStatusData = useMemo(() => {
    if (!dashboard) return []
    if (!dashboard.proposalStatusSummary) return []
    return Object.entries(dashboard.proposalStatusSummary)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || '#94a3b8',
      }))
  }, [dashboard])

  // Won proposals count
  const wonCount = dashboard?.proposalStatusSummary?.['Won'] || 0
  const totalProposals = dashboard?.proposalCounts?.total || 0

  // Target vs Actual chart data (monthly or quarterly based on filter)
  const targetActualChartData = useMemo(() => {
    if (!dashboard) return []
    if (filters.quarter !== '') {
      return (dashboard.quarterlyProgress || []).map((q) => ({
        name: q.quarter,
        Target: q.target,
        Actual: q.actual,
      }))
    }
    return (dashboard.monthlyProgress || []).map((m) => ({
      name: m.month,
      Target: m.target,
      Actual: m.actual,
    }))
  }, [dashboard, filters.quarter])

  // Service-wise chart data
  const serviceChartData = useMemo(() => {
    if (!dashboard) return []
    if (!dashboard.serviceWiseSummary) return []
    return dashboard.serviceWiseSummary
      .filter((s) => s.wonValue > 0)
      .sort((a, b) => b.wonValue - a.wonValue)
      .map((s) => ({
        name: s.service.name.length > 15 ? s.service.name.substring(0, 15) + '...' : s.service.name,
        value: s.wonValue,
        color: s.service.color,
        fullName: s.service.name,
      }))
  }, [dashboard])

  // Win Rate Funnel data
  const funnelData = useMemo(() => {
    if (!dashboard || !dashboard.proposalStatusSummary) return []
    const statuses = ['Submitted', 'In Process', 'In Evaluation', 'Won']
    const data: { status: string; count: number; color: string; dropOff: number; conversion: number }[] = []
    let prevCount = 0
    for (let i = 0; i < statuses.length; i++) {
      const count = dashboard.proposalStatusSummary[statuses[i]] || 0
      const dropOff = i > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0
      const conversion = totalProposals > 0 ? Math.round((count / totalProposals) * 100) : 0
      data.push({
        status: statuses[i],
        count,
        color: STATUS_COLORS[statuses[i]] || '#94a3b8',
        dropOff,
        conversion,
      })
      prevCount = count
    }
    return data
  }, [dashboard, totalProposals])

  // Client analytics data
  const clientAnalytics = dashboard?.clientAnalytics
  const topClients = clientAnalytics?.topClients || []
  const maxClientValue = topClients.length > 0 ? topClients[0].wonValue : 1

  // Team performance
  const teamPerformance = dashboard?.teamPerformance || []
  const maxTeamValue = teamPerformance.length > 0 ? teamPerformance[0].wonValue : 1

  // Pipeline stats
  const pipelineStats = dashboard?.pipelineStats || {
    averageProposalValue: 0,
    conversionRate: 0,
    avgDaysToWin: 0,
    pipelineValue: 0,
  }

  // Revenue trend
  const revenueTrendData = useMemo(() => {
    if (!dashboard || !dashboard.monthlyRevenueTrend) return []
    return dashboard.monthlyRevenueTrend.map((m) => ({
      month: m.month,
      revenue: m.revenue,
    }))
  }, [dashboard])

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      serviceId: '',
      startDate: '',
      endDate: '',
      month: '',
      quarter: '',
      year: currentYear,
    })
  }

  const hasActiveFilters =
    filters.serviceId ||
    filters.startDate ||
    filters.endDate ||
    filters.month !== '' ||
    filters.quarter !== ''

  // ─── Loading skeleton ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-xl shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error fetching dashboard data. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              CRM Pro Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Business intelligence &amp; proposal analytics overview
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Clock className="h-3.5 w-3.5" />
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Service</label>
                <Select
                  value={filters.serviceId}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, serviceId: v === '__all__' ? '' : v }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Month</label>
                <Select
                  value={filters.month}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, month: v === '__all__' ? '' : v }))
                  }
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
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, quarter: v === '__all__' ? '' : v }))
                  }
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 w-full text-sm gap-1.5"
                  disabled={!hasActiveFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Row 1: KPI Cards (with animated counters) ────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Business */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Business</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={dashboard.totalBusiness} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {wonCount} won proposals
                  </p>
                </div>
                <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">
                  {dashboard.targetVsActual.percentageAchieved}% of target
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Target vs Actual */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Target vs Actual</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {dashboard.targetVsActual.percentageAchieved}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remaining: {formatCompactPKR(dashboard.targetVsActual.remaining)}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <CircularProgress
                    percentage={dashboard.targetVsActual.percentageAchieved}
                    size={64}
                    strokeWidth={7}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                    {dashboard.targetVsActual.percentageAchieved}%
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Target:{' '}
                  <span className="font-medium text-gray-700">
                    {formatCompactPKR(dashboard.targetVsActual.target)}
                  </span>
                </span>
                <span>
                  Actual:{' '}
                  <span className="font-medium text-emerald-600">
                    {formatCompactPKR(dashboard.targetVsActual.actual)}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Progress</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {currentMonthData
                      ? formatCompactPKR(currentMonthData.actual)
                      : '₨ 0'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of{' '}
                    {currentMonthData
                      ? formatCompactPKR(currentMonthData.target)
                      : '₨ 0'}{' '}
                    target
                  </p>
                </div>
                <div className="h-11 w-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Progress
                  value={
                    currentMonthData && currentMonthData.target > 0
                      ? Math.min(
                          (currentMonthData.actual / currentMonthData.target) * 100,
                          100
                        )
                      : 0
                  }
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {currentMonthData && currentMonthData.target > 0
                      ? Math.round(
                          (currentMonthData.actual / currentMonthData.target) * 100
                        )
                      : 0}
                    % achieved
                  </span>
                  <span>{format(new Date(), 'MMMM yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Status */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Proposal Status</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {wonCount}
                    <span className="text-base font-normal text-muted-foreground">
                      {' '}
                      / {totalProposals}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">Proposals won</p>
                </div>
                <div className="relative shrink-0 flex items-center justify-center">
                  <MiniDonut won={wonCount} total={totalProposals} />
                  <span className="absolute text-[9px] font-bold text-gray-700">
                    {totalProposals > 0
                      ? Math.round((wonCount / totalProposals) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(dashboard.proposalStatusSummary || {}).map(
                  ([status, count]) =>
                    count > 0 && (
                      <Badge
                        key={status}
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 ${STATUS_BG[status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {status}: {count}
                      </Badge>
                    )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: Quick Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Proposal Value */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Proposal Value</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {formatCompactPKR(pipelineStats.averageProposalValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <Percent className="h-4.5 w-4.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {pipelineStats.conversionRate || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Days to Win */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Timer className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Days to Win</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {pipelineStats.avgDaysToWin || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Value */}
          <Card className="rounded-xl shadow-sm border bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Activity className="h-4.5 w-4.5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {formatCompactPKR(pipelineStats.pipelineValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Target vs Actual + Win Rate Funnel ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Target vs Actual Bar Chart */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Target vs Actual — {filters.quarter !== '' ? 'Quarterly' : 'Monthly'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={targetActualChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => formatCompactPKR(v)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatPKR(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="rounded"
                    />
                    <Bar
                      dataKey="Target"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="Actual"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win Rate Funnel */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Funnel className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  Win Rate Funnel
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {funnelData.map((stage, index) => {
                  const maxCount = funnelData.length > 0 ? funnelData[0].count : 1
                  const widthPct = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 8) : 8

                  return (
                    <div key={stage.status} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm font-medium text-gray-800">{stage.status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                          {index > 0 && stage.dropOff > 0 && (
                            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                              -{stage.dropOff}% drop
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {stage.conversion}% of total
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div
                          className="h-8 rounded-lg transition-all duration-700 ease-out flex items-center justify-center"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: stage.color,
                            opacity: 0.85,
                            minWidth: '40px',
                          }}
                        >
                          <span className="text-[10px] font-semibold text-white">
                            {stage.count}
                          </span>
                        </div>
                      </div>
                      {index < funnelData.length - 1 && (
                        <div className="flex justify-center">
                          <svg width="16" height="12" className="text-gray-300">
                            <path d="M4 0 L8 8 L12 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}

                {funnelData.length > 1 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Overall Win Rate</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {funnelData[0].count > 0
                          ? Math.round(
                              ((funnelData[funnelData.length - 1].count) / funnelData[0].count) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Service-wise + Client Analytics ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Service-wise Business Summary */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Service-wise Business Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-72">
                {serviceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={serviceChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        horizontal={false}
                      />
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
                      <Tooltip
                        formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [
                          formatPKR(value),
                          props.payload?.fullName || 'Won Value',
                        ]}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {serviceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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

          {/* Client Analytics */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  Client Analytics
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Active/Inactive Donut */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="relative">
                    <ActiveInactiveDonut
                      active={clientAnalytics?.activeClients || 0}
                      inactive={clientAnalytics?.inactiveClients || 0}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">
                      {clientAnalytics?.activeClients || 0}
                    </span>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Active / Inactive</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {clientAnalytics?.activeClients || 0} / {clientAnalytics?.inactiveClients || 0}
                    </p>
                  </div>
                </div>

                {/* New clients metric */}
                <div className="col-span-2 flex flex-col justify-center gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-emerald-600">New Clients This Month</p>
                    <p className="text-2xl font-bold text-emerald-700">{clientAnalytics?.newClientsThisMonth || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.clientCounts?.total || 0}</p>
                  </div>
                </div>
              </div>

              {/* Top 5 Clients */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Top 5 Clients by Won Value</p>
                <div className="space-y-2.5">
                  {(topClients || []).length > 0 ? (
                    (topClients || []).map((client, idx) => (
                      <div key={client.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 w-4">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-800 truncate max-w-[140px]">
                              {client.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCompactPKR(client.wonValue)}
                          </span>
                        </div>
                        <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-700 ease-out"
                            style={{
                              width: `${maxClientValue > 0 ? (client.wonValue / maxClientValue) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No client data available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Proposal Status Pie + Quarterly Progress ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Proposal Status Summary - Pie Chart */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Proposal Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-64 w-full sm:w-1/2">
                  {proposalStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={proposalStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {proposalStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, 'Proposals']}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No proposal data
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-3">
                  {proposalStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.value}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({totalProposals > 0 ? Math.round((item.value / totalProposals) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="text-sm font-bold text-gray-900">
                        {totalProposals}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quarterly/Annual Progress */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Quarterly Progress — {filters.year}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-5">
              {(dashboard.quarterlyProgress || []).map((q) => {
                const pct =
                  q.target > 0 ? Math.round((q.actual / q.target) * 100) : 0
                const isOverAchieved = pct >= 100

                return (
                  <div key={q.quarter} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {q.quarter}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 ${
                            isOverAchieved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {pct}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-x-2">
                        <span>
                          Achieved:{' '}
                          <span className="font-medium text-gray-700">
                            {formatCompactPKR(q.actual)}
                          </span>
                        </span>
                        <span>
                          Target:{' '}
                          <span className="font-medium text-gray-500">
                            {formatCompactPKR(q.target)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                          isOverAchieved ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                        }}
                      />
                      {q.target > 0 && pct > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white mix-blend-difference">
                          {formatCompactPKR(q.actual)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Annual total */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-800">
                      Annual Total
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${
                        dashboard.targetVsActual.percentageAchieved >= 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {dashboard.targetVsActual.percentageAchieved}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span>
                      Achieved:{' '}
                      <span className="font-medium text-gray-700">
                        {formatCompactPKR(dashboard.annualProgress.actual)}
                      </span>
                    </span>
                    <span>
                      Target:{' '}
                      <span className="font-medium text-gray-500">
                        {formatCompactPKR(dashboard.annualProgress.target)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                      dashboard.targetVsActual.percentageAchieved >= 100
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(dashboard.targetVsActual.percentageAchieved, 100)}%`,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                    {formatCompactPKR(dashboard.annualProgress.actual)} /{' '}
                    {formatCompactPKR(dashboard.annualProgress.target)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 6: Team Performance + Revenue Trend ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Team Performance Leaderboard */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  Team Performance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {teamPerformance.length > 0 ? (
                  teamPerformance.map((member, idx) => {
                    const rankBadges = ['🥇', '🥈', '🥉']
                    const rankBadge = idx < 3 ? rankBadges[idx] : null
                    const barPct = maxTeamValue > 0 ? (member.wonValue / maxTeamValue) * 100 : 0

                    return (
                      <div key={member.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 text-center text-sm">
                              {rankBadge || (
                                <span className="text-xs font-bold text-gray-400">
                                  {idx + 1}
                                </span>
                              )}
                            </span>
                            <div>
                              <span className="text-sm font-medium text-gray-800">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1.5">
                                {member.wonProposals} won
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCompactPKR(member.wonValue)}
                          </span>
                        </div>
                        <div className="ml-8 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              idx === 0
                                ? 'bg-amber-400'
                                : idx === 1
                                  ? 'bg-gray-400'
                                  : idx === 2
                                    ? 'bg-orange-400'
                                    : 'bg-emerald-400'
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    No team performance data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend Sparkline */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Revenue Trend — {filters.year}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200">
                  12 Month
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-72">
                {revenueTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(v) => formatCompactPKR(v)}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatPKR(value), 'Revenue']}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No revenue data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 7: Recent Proposals + Upcoming Deadlines ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Proposals */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Proposals
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs text-right">Value</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dashboard.recentProposals || []).length > 0 ? (
                    (dashboard.recentProposals || []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium max-w-[160px] truncate">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                          {p.client.name}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {formatCompactPKR(p.value)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-5 ${
                              STATUS_BG[p.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right">
                          {format(parseISO(p.createdAt), 'MMM dd')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No recent proposals
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="rounded-xl shadow-sm border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Upcoming Deadlines
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 bg-red-50 text-red-600 border-red-200">
                  Within 7 days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Deadline</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dashboard.upcomingDeadlines || []).length > 0 ? (
                    (dashboard.upcomingDeadlines || []).map((p) => {
                      const deadlineDate = p.deadline
                        ? parseISO(p.deadline)
                        : null
                      const daysLeft = deadlineDate
                        ? differenceInDays(deadlineDate, new Date())
                        : null
                      const isOverdue = daysLeft !== null && daysLeft < 0
                      const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm font-medium max-w-[180px] truncate">
                            {p.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {deadlineDate
                              ? format(deadlineDate, 'MMM dd, yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                STATUS_BG[p.status] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {daysLeft !== null ? (
                              <span
                                className={`text-sm font-semibold ${
                                  isOverdue
                                    ? 'text-red-600'
                                    : isUrgent
                                      ? 'text-amber-600'
                                      : 'text-gray-700'
                                }`}
                              >
                                {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        No upcoming deadlines within 7 days
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
