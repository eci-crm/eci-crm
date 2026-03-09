'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CheckSquare, DollarSign, TrendingUp, Clock } from 'lucide-react'

interface DashboardStats {
  totalContacts: number
  activeProposals: number
  pendingTasks: number
  totalRevenue: number
  conversionRate: number
  avgResponseTime: string
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { title: 'Total Contacts', value: stats?.totalContacts || 0, icon: Users, change: '+12%', color: 'from-emerald-500 to-teal-600' },
    { title: 'Active Proposals', value: stats?.activeProposals || 0, icon: FileText, change: '+5%', color: 'from-blue-500 to-indigo-600' },
    { title: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: CheckSquare, change: '-8%', color: 'from-amber-500 to-orange-600' },
    { title: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, change: '+23%', color: 'from-purple-500 to-pink-600' },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome to ECI CRM</h2>
              <p className="text-emerald-100 mt-1">Here's what's happening with your business today.</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <TrendingUp className="h-12 w-12 text-emerald-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { text: 'New contact added: John Smith', time: '2 minutes ago' },
                { text: 'Proposal sent to Acme Corp', time: '1 hour ago' },
                { text: 'Task completed: Follow up call', time: '3 hours ago' },
                { text: 'Meeting scheduled with client', time: 'Yesterday' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="flex-1">{item.text}</span>
                  <span className="text-slate-400 text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Your key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</span>
                <span className="text-sm font-semibold">{stats?.conversionRate || 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${stats?.conversionRate || 0}%` }} />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</span>
                <span className="text-sm font-semibold">{stats?.avgResponseTime || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                <Clock className="h-4 w-4" />
                <span>Last updated: Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
