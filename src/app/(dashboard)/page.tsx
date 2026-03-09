'use client'

import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ChevronRight,
  Activity
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Good morning, {user?.name || 'Partner'}!
          </h1>
          <p className="text-slate-500 mt-1">Here is a look at your sales performance today.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-100">
          <Activity className="h-4 w-4" />
          System Live: 99.9% Uptime
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Pipeline" value="$124,500" change="+14%" icon={Target} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard title="New Leads" value="48" change="+5.2%" icon={Users} color="text-purple-600" bg="bg-purple-50" />
        <MetricCard title="Conversion Rate" value="24.3%" change="+2.1%" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard title="Active Tasks" value="12" change="Due Today" icon={Zap} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart Placeholder */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden group">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Revenue Forecast
              <span className="text-xs font-normal text-slate-500">Monthly breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="h-[300px] flex items-end justify-around p-8 gap-2">
                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                  <div key={i} className="w-full bg-primary/10 rounded-t-lg relative group/bar hover:bg-primary transition-all duration-300" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      ${h}k
                    </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ActivityItem title="New Proposal Created" time="2 mins ago" desc="Project Alpha for Irfan Munir" />
            <ActivityItem title="Lead Status Updated" time="1 hour ago" desc="Acme Corp moved to 'Negotiation'" />
            <ActivityItem title="Meeting Scheduled" time="3 hours ago" desc="Discovery call with TechFlow" />
            <button className="w-full text-center text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1 pt-2">
              View all activity <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Sub-components for a cleaner file
function MetricCard({ title, value, change, icon: Icon, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm hover:translate-y-[-2px] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{change}</span>
        </div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ title, time, desc }: any) {
  return (
    <div className="flex gap-4 relative">
      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  )
}
