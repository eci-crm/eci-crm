'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isValid,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  Clock,
  Flag,
  Send,
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
}

interface Proposal {
  id: string
  name: string
  clientId: string
  value: number
  status: string
  deadline: string | null
  followUpDate: string | null
  submissionDate: string | null
  client: Client
}

interface DayEvent {
  proposal: Proposal
  type: 'deadline' | 'followUp' | 'submission'
}

interface DayEvents {
  date: Date
  events: DayEvent[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  'In Process': 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  'In Evaluation': 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  Pending: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
  Won: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  Rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
}

const TYPE_CONFIG = {
  deadline: {
    label: 'Deadline',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: Flag,
  },
  followUp: {
    label: 'Follow-up',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: Clock,
  },
  submission: {
    label: 'Submission',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: Send,
  },
} as const

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatPKR(value: number): string {
  return `₨ ${value.toLocaleString()}`
}

function getDateOnly(dateStr: string | null): Date | null {
  if (!dateStr) return null
  try {
    const parsed = parseISO(dateStr)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isSameDateDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CRMCalendar() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // ── Query ────────────────────────────────────────────────────────────────

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', 'calendar', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('startDate', format(monthStart, 'yyyy-MM-dd'))
      params.set('endDate', format(monthEnd, 'yyyy-MM-dd'))
      const res = await fetch(`/api/proposals?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch proposals')
      return res.json()
    },
  })

  // ── Calendar Grid ────────────────────────────────────────────────────────

  const calendarDays = React.useMemo(() => {
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [monthStart, monthEnd])

  // ── Events Map ───────────────────────────────────────────────────────────

  const eventsMap = React.useMemo(() => {
    const map = new Map<string, DayEvent[]>()

    for (const proposal of proposals) {
      // Deadline
      const deadlineDate = getDateOnly(proposal.deadline)
      if (deadlineDate) {
        const key = format(deadlineDate, 'yyyy-MM-dd')
        const existing = map.get(key) || []
        existing.push({ proposal, type: 'deadline' })
        map.set(key, existing)
      }

      // Follow-up
      const followUpDate = getDateOnly(proposal.followUpDate)
      if (followUpDate) {
        const key = format(followUpDate, 'yyyy-MM-dd')
        const existing = map.get(key) || []
        existing.push({ proposal, type: 'followUp' })
        map.set(key, existing)
      }

      // Submission
      const submissionDate = getDateOnly(proposal.submissionDate)
      if (submissionDate) {
        const key = format(submissionDate, 'yyyy-MM-dd')
        const existing = map.get(key) || []
        existing.push({ proposal, type: 'submission' })
        map.set(key, existing)
      }
    }

    return map
  }, [proposals])

  // ── Selected Day Events ──────────────────────────────────────────────────

  const selectedDayEvents = React.useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return eventsMap.get(key) || []
  }, [selectedDay, eventsMap])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const goToToday = () => setCurrentMonth(new Date())

  const handleDayClick = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    const events = eventsMap.get(key)
    if (events && events.length > 0) {
      setSelectedDay(day)
      setDialogOpen(true)
    }
  }

  const today = new Date()

  // ── Summary Counts ───────────────────────────────────────────────────────

  const currentMonthEventCount = React.useMemo(() => {
    let count = 0
    for (const [key, events] of eventsMap) {
      const date = parseISO(key)
      if (isSameMonth(date, currentMonth)) {
        count += events.length
      }
    }
    return count
  }, [eventsMap, currentMonth])

  const deadlineCount = React.useMemo(() => {
    let count = 0
    for (const [key, events] of eventsMap) {
      const date = parseISO(key)
      if (isSameMonth(date, currentMonth)) {
        count += events.filter((e) => e.type === 'deadline').length
      }
    }
    return count
  }, [eventsMap, currentMonth])

  const followUpCount = React.useMemo(() => {
    let count = 0
    for (const [key, events] of eventsMap) {
      const date = parseISO(key)
      if (isSameMonth(date, currentMonth)) {
        count += events.filter((e) => e.type === 'followUp').length
      }
    }
    return count
  }, [eventsMap, currentMonth])

  const submissionCount = React.useMemo(() => {
    let count = 0
    for (const [key, events] of eventsMap) {
      const date = parseISO(key)
      if (isSameMonth(date, currentMonth)) {
        count += events.filter((e) => e.type === 'submission').length
      }
    }
    return count
  }, [eventsMap, currentMonth])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-6" />
            Calendar
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track deadlines, follow-ups, and submissions
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-100">
              <CalendarDays className="size-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-lg font-bold">{currentMonthEventCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
              <Flag className="size-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Deadlines</p>
              <p className="text-lg font-bold text-red-700">{deadlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-100">
              <Clock className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Follow-ups</p>
              <p className="text-lg font-bold text-amber-700">{followUpCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100">
              <Send className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submissions</p>
              <p className="text-lg font-bold text-emerald-700">{submissionCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-9" onClick={goToPreviousMonth}>
                <ChevronLeft className="size-4" />
                <span className="sr-only">Previous month</span>
              </Button>
              <h3 className="text-lg font-semibold min-w-[180px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button variant="outline" size="icon" className="size-9" onClick={goToNextMonth}>
                <ChevronRight className="size-4" />
                <span className="sr-only">Next month</span>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              Deadline
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" />
              Follow-up
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              Submission
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-t border-l rounded-lg overflow-hidden">
                {calendarDays.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsMap.get(key) || []
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, today)
                  const hasEvents = dayEvents.length > 0

                  // Count event types
                  const hasDeadline = dayEvents.some((e) => e.type === 'deadline')
                  const hasFollowUp = dayEvents.some((e) => e.type === 'followUp')
                  const hasSubmission = dayEvents.some((e) => e.type === 'submission')

                  return (
                    <button
                      key={key}
                      onClick={() => handleDayClick(day)}
                      disabled={!hasEvents}
                      className={`relative border-r border-b p-1.5 sm:p-2 min-h-[72px] sm:min-h-[90px] text-left transition-colors ${
                        hasEvents
                          ? 'cursor-pointer hover:bg-muted/60'
                          : 'cursor-default'
                      } ${
                        !isCurrentMonth ? 'bg-muted/20' : ''
                      } ${
                        isToday ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-medium inline-flex size-7 items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : !isCurrentMonth
                                ? 'text-muted-foreground/40'
                                : 'text-foreground'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {hasEvents && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event dots */}
                      {hasEvents && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {hasDeadline && (
                            <span className="size-2 rounded-full bg-red-500" />
                          )}
                          {hasFollowUp && (
                            <span className="size-2 rounded-full bg-amber-500" />
                          )}
                          {hasSubmission && (
                            <span className="size-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      )}

                      {/* Event preview on larger screens */}
                      {hasEvents && (
                        <div className="mt-1 hidden sm:block space-y-0.5 max-h-[48px] overflow-hidden">
                          {dayEvents.slice(0, 2).map((event, idx) => {
                            const config = TYPE_CONFIG[event.type]
                            return (
                              <div
                                key={`${event.proposal.id}-${event.type}-${idx}`}
                                className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${config.bgColor} ${config.textColor}`}
                              >
                                {event.proposal.name}
                              </div>
                            )
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Day Events Dialog ───────────────────────────────────────────────── */}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              {selectedDay && format(selectedDay, 'EEEE, MMMM dd, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled for this day
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] -mx-6 px-6">
            <div className="space-y-3 pb-2">
              {selectedDayEvents.map((event, idx) => {
                const config = TYPE_CONFIG[event.type]
                const Icon = config.icon
                const proposal = event.proposal

                return (
                  <React.Fragment key={`${proposal.id}-${event.type}-${idx}`}>
                    {idx > 0 && <Separator />}
                    <div className={`rounded-lg border p-3 ${config.borderColor} ${config.bgColor}/50`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                          <Icon className={`size-4 ${config.textColor}`} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold truncate">
                              {proposal.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${config.bgColor} ${config.textColor} ${config.borderColor}`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Client: <span className="font-medium text-foreground">{proposal.client.name}</span></span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Value: <span className="font-medium text-foreground">{formatPKR(proposal.value)}</span></span>
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 h-5 ${STATUS_BADGE_STYLES[proposal.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                            >
                              {proposal.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
