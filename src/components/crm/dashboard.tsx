'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays, parseISO, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from 'date-fns'
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
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Users,
  Trophy,
  DollarSign,
  Percent,
  Timer,
  Activity,
  Medal,
  FileText,
  RefreshCw,
  ChevronDown,
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

// ─── Types ───────────────────────────────────────────────────────────────────

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
  availableYears: number[]
  periodInfo?: {
    isFullYear: boolean
    periodTarget: number
    annualTarget: number
    yearProportion: number
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PIPELINE_STATUSES = ['Submitted', 'In Process', 'In Evaluation', 'Pending', 'Won', 'Rejected']

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

type DatePeriod = 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom'

const PERIOD_LABELS: Record<DatePeriod, string> = {
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  thisQuarter: 'This Quarter',
  thisYear: 'This Year',
  custom: 'Custom',
}

const formatPKR = (value: number) => `₨ ${value.toLocaleString()}`

const formatCompactPKR = (value: number) => {
  if (value >= 1000000000) return `₨ ${(value / 1000000000).toFixed(1)}B`
  if (value >= 1000000) return `₨ ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₨ ${(value / 1000).toFixed(0)}K`
  return `₨ ${value.toLocaleString()}`
}

// ─── Date Range Helpers ─────────────────────────────────────────────────────

function getDateRangeForPeriod(period: DatePeriod, year: number): { start: Date; end: Date } {
  const now = new Date()

  switch (period) {
    case 'thisWeek': {
      const start = startOfWeek(now, { weekStartsOn: 1 })
      const end = endOfWeek(now, { weekStartsOn: 1 })
      return { start, end }
    }
    case 'thisMonth': {
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      return { start, end }
    }
    case 'thisQuarter': {
      const start = startOfQuarter(now)
      const end = endOfQuarter(now)
      return { start, end }
    }
    case 'thisYear': {
      const start = new Date(year, 0, 1)
      const end = new Date(year, 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
    case 'custom':
      // Handled separately with customStartDate/customEndDate
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) }
  }
}

// ─── useCountUp Hook ─────────────────────────────────────────────────────────

function useCountUp(end: number, duration: number = 1200): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const prevEnd = useRef(end)

  useEffect(() => {
    if (Math.abs(prevEnd.current - end) < 0.5) return
    prevEnd.current = end

    const startVal = 0
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
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
  accentColor = '#14b8a6',
}: {
  percentage: number
  size?: number
  strokeWidth?: number
  accentColor?: string
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
        stroke={percentage >= 100 ? '#10b981' : accentColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

function MiniDonut({
  won,
  total,
  accentColor = '#8b5cf6',
}: {
  won: number
  total: number
  accentColor?: string
}) {
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
        stroke={accentColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={wonOffset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}

function ProposalPipelineDonut({
  statusSummary,
}: {
  statusSummary: ProposalStatusSummary
}) {
  const size = 56
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  const total = PIPELINE_STATUSES.reduce((sum, s) => sum + (statusSummary[s] || 0), 0)

  // Compute accumulated percentages using reduce to avoid reassignment
  const segments = PIPELINE_STATUSES.reduce<Array<{ status: string; count: number; pct: number; accumulatedBefore: number; color: string }>>((acc, status) => {
    const count = statusSummary[status] || 0
    const pct = total > 0 ? (count / total) * 100 : 0
    const accumulatedBefore = acc.length > 0 ? acc[acc.length - 1].accumulatedBefore + acc[acc.length - 1].pct : 0
    acc.push({ status, count, pct, accumulatedBefore, color: STATUS_COLORS[status] || '#94a3b8' })
    return acc
  }, [])

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg) =>
        seg.pct > 0 ? (
          <circle
            key={seg.status}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
            strokeDashoffset={-((seg.accumulatedBefore / 100) * circumference)}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        ) : null
      )}
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
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [activePeriod, setActivePeriod] = useState<DatePeriod>('thisYear')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Compute date range based on active period
  const computedDateRange = useMemo(() => {
    if (activePeriod === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(new Date(customEndDate).setHours(23, 59, 59, 999)),
      }
    }
    return getDateRangeForPeriod(activePeriod, parseInt(selectedYear))
  }, [activePeriod, selectedYear, customStartDate, customEndDate])

  // Build query params — ALWAYS send startDate/endDate for consistent filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('year', selectedYear)
    params.set('startDate', format(computedDateRange.start, 'yyyy-MM-dd'))
    params.set('endDate', format(computedDateRange.end, 'yyyy-MM-dd'))
    return params.toString()
  }, [selectedYear, activePeriod, computedDateRange])

  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard', queryParams],
    queryFn: () => fetch(`/api/dashboard?${queryParams}`).then((r) => r.json()),
    enabled: true,
  })

  // Available years: always show current year ±10 plus DB years
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>()
    // Always include current year ±10
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
      yearSet.add(y)
    }
    // Add DB years
    if (dashboard?.availableYears) {
      for (const y of dashboard.availableYears) {
        yearSet.add(y)
      }
    }
    return Array.from(yearSet).sort((a, b) => a - b)
  }, [dashboard, currentYear])

  // Custom year input state
  const [customYearInput, setCustomYearInput] = useState('')
  const [showCustomYear, setShowCustomYear] = useState(false)

  // Handle period change
  const handlePeriodChange = useCallback((period: DatePeriod) => {
    setActivePeriod(period)
    if (period !== 'custom') {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }, [])

  // Handle year change - reset period to thisYear
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year)
    if (activePeriod === 'custom') {
      // Keep custom if user explicitly set it
    } else {
      setActivePeriod('thisYear')
    }
  }, [activePeriod])

  // Current month for monthly progress card
  const currentMonthIndex = new Date().getMonth()
  const currentMonthData = dashboard?.monthlyProgress?.[currentMonthIndex]
  // Use the first month in the filtered data if current month isn't in range
  const displayedMonthData = currentMonthData || (dashboard?.monthlyProgress?.length ? dashboard.monthlyProgress[dashboard.monthlyProgress.length - 1] : null)
  const currentMonthName = displayedMonthData?.month || format(new Date(), 'MMMM')

  // Period info from API
  const periodInfo = dashboard?.periodInfo
  const isFullYear = periodInfo?.isFullYear ?? true

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

  // Target vs Actual chart data — always monthly
  const targetActualChartData = useMemo(() => {
    if (!dashboard) return []
    return (dashboard.monthlyProgress || []).map((m) => ({
      name: m.month,
      Target: m.target,
      Actual: m.actual,
    }))
  }, [dashboard])

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

  // Win Rate Funnel data — includes ALL 6 statuses
  const funnelData = useMemo(() => {
    if (!dashboard || !dashboard.proposalStatusSummary) return []
    const data: { status: string; count: number; color: string; dropOff: number; conversion: number }[] = []
    let prevCount = 0
    for (let i = 0; i < PIPELINE_STATUSES.length; i++) {
      const count = dashboard.proposalStatusSummary[PIPELINE_STATUSES[i]] || 0
      const dropOff = i > 0 && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0
      const conversion = totalProposals > 0 ? Math.round((count / totalProposals) * 100) : 0
      data.push({
        status: PIPELINE_STATUSES[i],
        count,
        color: STATUS_COLORS[PIPELINE_STATUSES[i]] || '#94a3b8',
        dropOff,
        conversion,
      })
      prevCount = count
    }
    return data
  }, [dashboard, totalProposals])

  // Client analytics
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

  // Period label for subtitle
  const periodSubtitle = useMemo(() => {
    if (activePeriod === 'thisYear') return 'Full Year'
    if (activePeriod === 'custom' && customStartDate && customEndDate) {
      return `${format(new Date(customStartDate), 'MMM dd')} – ${format(new Date(customEndDate), 'MMM dd, yyyy')}`
    }
    const { start, end } = computedDateRange
    return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd, yyyy')}`
  }, [activePeriod, customStartDate, customEndDate, computedDateRange])

  // ─── Loading skeleton ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/80 p-4 md:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/80 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error fetching dashboard data. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────

  const monthlyProgressPct =
    displayedMonthData && displayedMonthData.target > 0
      ? Math.min(Math.round((displayedMonthData.actual / displayedMonthData.target) * 100), 100)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/80">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* ═══════════════ HERO HEADER ═══════════════ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-lg">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative p-6 md:p-8 space-y-5">
            {/* Top row: Title + Year selector + Last updated */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Dashboard
                </h1>
                <p className="text-emerald-100 mt-1 text-sm md:text-base">
                  Fiscal Year {selectedYear} — {periodSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Year selector */}
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <Calendar className="h-4 w-4 text-emerald-100" />
                  <Select
                    value={selectedYear}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-white text-sm font-medium p-0 focus:ring-0 [&>svg]:text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Custom year input */}
                  <button
                    onClick={() => setShowCustomYear(!showCustomYear)}
                    className="h-6 w-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    title="Enter custom year"
                  >
                    <span className="text-[11px] text-white/80 font-medium">+</span>
                  </button>
                </div>
                {/* Custom year input popup */}
                {showCustomYear && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={customYearInput}
                      onChange={(e) => setCustomYearInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const year = parseInt(customYearInput)
                          if (year >= 2000 && year <= 2100) {
                            setSelectedYear(String(year))
                            setShowCustomYear(false)
                            setCustomYearInput('')
                          }
                        }
                        if (e.key === 'Escape') {
                          setShowCustomYear(false)
                          setCustomYearInput('')
                        }
                      }}
                      placeholder="Year"
                      className="h-7 w-20 bg-white/15 border-white/25 text-white text-xs rounded-lg backdrop-blur-sm placeholder:text-emerald-200/60 focus:ring-1 focus:ring-white/30 [color-scheme:dark]"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 bg-white/15 text-white hover:bg-white/25 text-xs"
                      onClick={() => {
                        const year = parseInt(customYearInput)
                        if (year >= 2000 && year <= 2100) {
                          setSelectedYear(String(year))
                          setShowCustomYear(false)
                          setCustomYearInput('')
                        }
                      }}
                    >
                      Go
                    </Button>
                  </div>
                )}
                {/* Last updated pill */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-100 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
                  <Clock className="h-3 w-3" />
                  {format(new Date(), 'MMM dd, HH:mm')}
                </div>
              </div>
            </div>

            {/* Date range quick picks */}
            <div className="flex flex-wrap items-center gap-2">
              {(['thisWeek', 'thisMonth', 'thisQuarter', 'thisYear', 'custom'] as DatePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePeriodChange(period)}
                  className={`
                    h-8 px-3.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${activePeriod === period
                      ? 'bg-white/25 text-white border border-white/30 shadow-sm backdrop-blur-sm'
                      : 'bg-white/8 text-emerald-100 border border-transparent hover:bg-white/15 hover:text-white'
                    }
                  `}
                >
                  {PERIOD_LABELS[period]}
                </Button>
              ))}

              {/* Custom date inputs */}
              {activePeriod === 'custom' && (
                <div className="flex items-center gap-2 ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-8 w-36 bg-white/15 border-white/25 text-white text-xs rounded-lg backdrop-blur-sm placeholder:text-emerald-200/60 focus:ring-1 focus:ring-white/30 focus:border-white/40 [color-scheme:dark]"
                    placeholder="Start"
                  />
                  <span className="text-emerald-200 text-xs">→</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-8 w-36 bg-white/15 border-white/25 text-white text-xs rounded-lg backdrop-blur-sm placeholder:text-emerald-200/60 focus:ring-1 focus:ring-white/30 focus:border-white/40 [color-scheme:dark]"
                    placeholder="End"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ KPI CARDS ROW ═══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Business */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Total Business</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    <AnimatedValue value={dashboard.totalBusiness} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {wonCount} won proposal{wonCount !== 1 ? 's' : ''} {!isFullYear && <span className="text-amber-600">({periodSubtitle})</span>}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600">
                  {dashboard.targetVsActual.percentageAchieved}% of target
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Target Achievement */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-teal-600" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isFullYear ? 'Target Achievement' : 'Period Target Achievement'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {dashboard.targetVsActual.percentageAchieved}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Remaining: {formatCompactPKR(dashboard.targetVsActual.remaining)}
                    {!isFullYear && periodInfo && (
                      <span className="text-amber-600 ml-1">({periodInfo.yearProportion}% of annual)</span>
                    )}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <CircularProgress
                    percentage={dashboard.targetVsActual.percentageAchieved}
                    size={60}
                    strokeWidth={6}
                    accentColor="#14b8a6"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-700">
                    {dashboard.targetVsActual.percentageAchieved}%
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Target: <span className="font-medium text-gray-700">{formatCompactPKR(dashboard.targetVsActual.target)}</span>
                </span>
                <span>
                  Actual: <span className="font-medium text-teal-600">{formatCompactPKR(dashboard.targetVsActual.actual)}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isFullYear ? 'Monthly Progress' : 'Period Progress'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {displayedMonthData ? formatCompactPKR(displayedMonthData.actual) : '₨ 0'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {displayedMonthData ? formatCompactPKR(displayedMonthData.target) : '₨ 0'} target
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700">{currentMonthName}</span>
                  <span className="text-xs font-semibold text-gray-700">{monthlyProgressPct}% achieved</span>
                </div>
                <Progress value={monthlyProgressPct} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          {/* Proposal Pipeline */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-purple-600" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isFullYear ? 'Proposal Pipeline' : `Pipeline (${periodSubtitle})`}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {wonCount}
                    <span className="text-lg font-normal text-muted-foreground"> / {totalProposals}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Proposals won</p>
                </div>
                <div className="relative shrink-0 flex items-center justify-center">
                  <ProposalPipelineDonut statusSummary={dashboard.proposalStatusSummary || {}} />
                  <span className="absolute text-[9px] font-bold text-gray-700">
                    {totalProposals > 0 ? Math.round((wonCount / totalProposals) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
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

        {/* ═══════════════ QUICK STATS ROW ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Avg Proposal Value */}
          <Card className="rounded-xl border shadow-none bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Avg Proposal Value</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight truncate">
                    {formatCompactPKR(pipelineStats.averageProposalValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="rounded-xl border shadow-none bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <Percent className="h-4 w-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {pipelineStats.conversionRate || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Days to Win */}
          <Card className="rounded-xl border shadow-none bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Timer className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Avg Days to Win</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight">
                    {pipelineStats.avgDaysToWin || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Value */}
          <Card className="rounded-xl border shadow-none bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Pipeline Value</p>
                  <p className="text-lg font-bold text-gray-900 tracking-tight truncate">
                    {formatCompactPKR(pipelineStats.pipelineValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════ CHARTS SECTION (2x2) ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Target vs Actual — Monthly Bar Chart */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Target vs Actual — {isFullYear ? 'Monthly' : periodSubtitle}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 bg-gray-50 text-gray-600 border-gray-200 rounded-lg">
                  {selectedYear}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={targetActualChartData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactPKR(v)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatPKR(value)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="rounded"
                    />
                    <Bar dataKey="Target" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="Actual" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Proposal Pipeline Funnel */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Proposal Pipeline
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="space-y-3">
                {funnelData.map((stage, index) => {
                  const maxCount = funnelData.length > 0 ? funnelData[0].count : 1
                  const widthPct = maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 8) : 8

                  return (
                    <div key={stage.status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="text-sm font-medium text-gray-800">{stage.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                          {index > 0 && stage.dropOff > 0 && (
                            <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                              -{stage.dropOff}%
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {stage.conversion}%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div
                          className="h-9 rounded-xl transition-all duration-700 ease-out flex items-center justify-center"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: stage.color,
                            opacity: 0.85,
                            minWidth: '40px',
                          }}
                        >
                          <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                            {stage.count}
                          </span>
                        </div>
                      </div>
                      {index < funnelData.length - 1 && (
                        <div className="flex justify-center">
                          <svg width="14" height="10" className="text-gray-300">
                            <path d="M3 0 L7 7 L11 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}

                {funnelData.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Overall Win Rate</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {funnelData[0].count > 0
                          ? Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend — Area Chart */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Revenue Trend
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg">
                  {isFullYear ? '12 Month' : periodSubtitle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="h-72">
                {revenueTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueTrendData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCompactPKR(v)}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatPKR(value), 'Revenue']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)',
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

          {/* Service Distribution — Horizontal Bar */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <CardTitle className="text-base font-semibold text-gray-900">
                Service Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5 px-5">
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
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCompactPKR(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip
                        formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [
                          formatPKR(value),
                          props.payload?.fullName || 'Won Value',
                        ]}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
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
        </div>

        {/* ═══════════════ RECENT ACTIVITY — HORIZONTAL ═══════════════ */}
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Recent Activity — {isFullYear ? selectedYear : periodSubtitle}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            {(dashboard.recentProposals || []).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {(dashboard.recentProposals || []).map((p) => (
                  <div key={p.id} className="rounded-xl bg-gray-50/80 p-4 space-y-2 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 ${STATUS_BG[p.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {p.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(p.createdAt), 'MMM dd')}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.client.name}</p>
                    <p className="text-sm font-bold text-gray-900">{formatCompactPKR(p.value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No recent proposals
              </p>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════ BOTTOM SECTION ═══════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Top Clients */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">Top Clients</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {(topClients || []).length > 0 ? (
                  (topClients || []).map((client, idx) => (
                    <div key={client.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {client.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900 shrink-0 ml-2">
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
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No client data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Leaderboard */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">Team Leaderboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {teamPerformance.length > 0 ? (
                  teamPerformance.map((member, idx) => {
                    const barPct = maxTeamValue > 0 ? (member.wonValue / maxTeamValue) * 100 : 0
                    const medalColors = ['text-amber-500', 'text-gray-400', 'text-orange-400']

                    return (
                      <div key={member.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {idx < 3 ? (
                              <Medal className={`h-4 w-4 shrink-0 ${medalColors[idx]}`} />
                            ) : (
                              <span className="w-4 text-center text-[10px] font-bold text-gray-400 shrink-0">
                                {idx + 1}
                              </span>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-gray-800 truncate block">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {member.wonProposals} won
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-900 shrink-0 ml-2">
                            {formatCompactPKR(member.wonValue)}
                          </span>
                        </div>
                        <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No team data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines — Timeline */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="pb-2 pt-5 px-5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-red-500" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-5 px-5">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {(dashboard.upcomingDeadlines || []).length > 0 ? (
                  (dashboard.upcomingDeadlines || []).map((p) => {
                    const deadlineDate = p.deadline ? parseISO(p.deadline) : null
                    const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null
                    const isOverdue = daysLeft !== null && daysLeft < 0
                    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2

                    return (
                      <div key={p.id} className="flex items-start gap-3">
                        {/* Date badge */}
                        <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center ${
                          isOverdue
                            ? 'bg-red-50'
                            : isUrgent
                              ? 'bg-amber-50'
                              : 'bg-gray-50'
                        }`}>
                          <span className={`text-[10px] font-semibold uppercase ${
                            isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            {deadlineDate ? format(deadlineDate, 'MMM') : '—'}
                          </span>
                          <span className={`text-sm font-bold leading-none ${
                            isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-gray-700'
                          }`}>
                            {deadlineDate ? format(deadlineDate, 'dd') : '—'}
                          </span>
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{p.client.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 h-4 ${STATUS_BG[p.status] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {p.status}
                            </Badge>
                            {daysLeft !== null && (
                              <span className={`text-[10px] font-semibold ${
                                isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-500'
                              }`}>
                                {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No upcoming deadlines within 7 days
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════ QUARTERLY PROGRESS ═══════════════ */}
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-teal-600" />
                </div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Quarterly Progress — {isFullYear ? selectedYear : periodSubtitle}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(dashboard.quarterlyProgress || []).map((q) => {
                const pct = q.target > 0 ? Math.round((q.actual / q.target) * 100) : 0
                const isOverAchieved = pct >= 100

                return (
                  <div key={q.quarter} className="rounded-xl bg-gray-50/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{q.quarter}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 rounded-lg ${
                          isOverAchieved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {pct}%
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                          isOverAchieved ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Achieved: <span className="font-medium text-gray-700">{formatCompactPKR(q.actual)}</span></span>
                      <span>Target: <span className="font-medium text-gray-500">{formatCompactPKR(q.target)}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Annual summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-semibold text-gray-800">Annual Total</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-5 rounded-lg ${
                      dashboard.targetVsActual.percentageAchieved >= 100
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-teal-50 text-teal-700 border-teal-200'
                    }`}
                  >
                    {dashboard.targetVsActual.percentageAchieved}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-x-3">
                  <span>
                    Achieved: <span className="font-medium text-gray-700">{formatCompactPKR(dashboard.annualProgress.actual)}</span>
                  </span>
                  <span>
                    Target: <span className="font-medium text-gray-500">{formatCompactPKR(dashboard.annualProgress.target)}</span>
                  </span>
                </div>
              </div>
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${
                    dashboard.targetVsActual.percentageAchieved >= 100 ? 'bg-emerald-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(dashboard.targetVsActual.percentageAchieved, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white mix-blend-difference">
                  {formatCompactPKR(dashboard.annualProgress.actual)} / {formatCompactPKR(dashboard.annualProgress.target)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════ PROPOSAL STATUS PIE ═══════════════ */}
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-semibold text-gray-900">
              Proposal Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5 px-5">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-56 w-full sm:w-1/2">
                {proposalStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={proposalStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
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
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)',
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
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({totalProposals > 0 ? Math.round((item.value / totalProposals) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-sm font-bold text-gray-900">{totalProposals}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
