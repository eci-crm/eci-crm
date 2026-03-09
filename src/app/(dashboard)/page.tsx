'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  FileText, 
  CheckSquare, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stats {
  totalContacts: number
  activeProposals: number
  pendingTasks: number
  totalRevenue: number
  conversionRate: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Clients',
      value: stats?.totalContacts || 0,
      icon: Users,
      description: 'Total leads & customers',
      color: 'text-blue-600',
      bg: 'bg-blue-100/50'
    },
    {
      title: 'Active Proposals',
      value: stats?.activeProposals || 0,
      icon: FileText,
      description: 'Negotiations in progress',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100/50'
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: CheckSquare,
      description: 'Action items for today',
      color: 'text-orange-600',
      bg: 'bg-orange-100/50'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'Accepted deals total',
      color: 'text-purple-600',
      bg: 'bg-purple-100/50'
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name} 👋</h1>
        <p className="text-muted-foreground italic">
          Here is what is happening with your sales pipeline today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section: Performance & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Sales Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-xl m-6">
            <div className="text-center">
              <p className="text-4xl font-black text-primary">{stats?.conversionRate}%</p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Lead-to-Customer Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
              <span className="text-sm font-medium">Create New Proposal</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
              <span className="text-sm font-medium">Add New Client</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
              <span className="text-sm font-medium">Schedule Meeting</span>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
