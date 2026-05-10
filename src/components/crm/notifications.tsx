'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Clock,
  RefreshCw,
  Trophy,
  Info,
  X,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCRMStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string | null
  createdAt: string
}

// ─── Notification Type Icons ─────────────────────────────────────────────────

const NOTIFICATION_ICONS: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  deadline: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  follow_up: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  status_change: { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  target: { icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  info: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
}

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info
}

// ─── Time Ago Formatting ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Notification Panel Component ────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type)
  const { setCurrentPage } = useCRMStore()

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id)
    }
    if (notification.link) {
      setCurrentPage(notification.link)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
        !notification.isRead ? 'bg-emerald-50/60 dark:bg-emerald-950/10' : ''
      }`}
    >
      {/* Type Icon */}
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight text-foreground">
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  )
}

// ─── Main Notification Bell + Dropdown ───────────────────────────────────────

export function CRMNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const previousCountRef = useRef(0)
  const queryClient = useQueryClient()

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await fetch('/api/notifications')
      if (!r.ok) throw new Error('Failed to fetch notifications')
      return r.json()
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Show toast when new notifications arrive
  useEffect(() => {
    if (previousCountRef.current > 0 && notifications.length > previousCountRef.current) {
      const newNotifs = notifications.slice(0, notifications.length - previousCountRef.current)
      newNotifs.forEach((n) => {
        toast.info(n.title, {
          description: n.message,
          duration: 4000,
        })
      })
    }
    previousCountRef.current = notifications.length
  }, [notifications.length])

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'PUT' })
      if (!res.ok) throw new Error('Failed to mark as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications?markAll=true', { method: 'PUT' })
      if (!res.ok) throw new Error('Failed to mark all as read')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id)
    },
    [markReadMutation]
  )

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate()
  }, [markAllReadMutation])

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] font-bold text-white shadow-sm border-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl"
              style={{ width: 350, maxHeight: 400 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-[10px] px-1.5"
                    >
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      onClick={handleMarkAllRead}
                      disabled={markAllReadMutation.isPending}
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <ScrollArea className="max-h-[340px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Bell className="mb-3 h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      You&apos;re all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
