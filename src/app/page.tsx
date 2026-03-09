'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Eye, EyeOff, Loader2, Download, LayoutDashboard, Users, FileText, CheckSquare, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Bell, Menu, Search, Settings, BarChart3, Calendar, Plus, MoreHorizontal, Mail, Phone, Building, Clock, CheckCircle, Circle, TrendingUp, DollarSign, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// Demo credentials
const DEMO_USERS = [
  { email: 'admin@crm.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'manager@crm.com', name: 'Sarah Manager', role: 'MANAGER' },
  { email: 'sales@crm.com', name: 'John Sales', role: 'SALES_REP' },
  { email: 'viewer@crm.com', name: 'Jane Viewer', role: 'VIEWER' }
]

type TabType = 'dashboard' | 'contacts' | 'proposals' | 'tasks' | 'calendar' | 'reports' | 'settings'

export default function Home() {
  const { isAuthenticated, user, login, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      login(data.user)
    } catch (err) {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/eci-crm.zip'
    link.download = 'eci-crm.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ECI CRM</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Enterprise Customer Intelligence</p>
            </div>
          </div>

          <Button onClick={handleDownload} variant="outline" className="w-full h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold">
            <Download className="mr-2 h-5 w-5" />
            Download ECI CRM Project (for GitHub/Vercel)
          </Button>

          <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">Sign in to your account to continue</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-0">
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {DEMO_USERS.map((u) => (
                    <div key={u.email} className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                      <p className="font-medium text-amber-700 dark:text-amber-300">{u.role}</p>
                    <p className="text-slate-600 dark:text-slate-400">{u.email}</p>
                  </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
                  Password: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">password123</code>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                  Built by <span className="font-semibold text-amber-700 dark:text-amber-300">Irfan Munir</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Dashboard Screen
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Users },
    { id: 'proposals' as TabType, label: 'Proposals', icon: FileText },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'fixed md:relative z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 md:w-16 overflow-hidden md:overflow-visible'
        )}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 dark:text-white text-sm">ECI CRM</h1>
                  <p className="text-xs text-slate-500">by Irfan Munir</p>
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="flex-1 p-2 space-y-1 mt-4">
            {menuItems.map((item) => (
              <Button key={item.id} variant="ghost" className={cn(
                'w-full justify-start gap-3 h-10',
                activeTab === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )} onClick={() => setActiveTab(item.id)}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Button>
            ))}
          </nav>

          {sidebarOpen && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden sm:flex items-center relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search..." className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-0" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Moon className="h-5 w-5 dark:hidden" />
                  <Sun className="h-5 w-5 hidden dark:block" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span>
                </Button>
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.role || 'Role'}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold">Welcome to ECI CRM</h2>
                    <p className="text-emerald-100 mt-1">Here's what's happening with your business today.</p>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Total Contacts', value: '5', icon: Users, color: 'from-emerald-500 to-teal-600', change: '+12%' },
                    { title: 'Active Proposals', value: '3', icon: FileText, color: 'from-blue-500 to-indigo-600', change: '+5%' },
                    { title: 'Pending Tasks', value: '4', icon: CheckSquare, color: 'from-amber-500 to-orange-600', change: '-8%' },
                    { title: 'Total Revenue', value: '$75,000', icon: DollarSign, color: 'from-purple-500 to-pink-600', change: '+23%' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{stat.title}</p>
                            <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            <p className="text-xs text-emerald-600 mt-1">{stat.change} from last month</p>
                          </div>
                          <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
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
                          <span className="text-sm text-slate-600">Conversion Rate</span>
                          <span className="text-sm font-semibold">32%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: '32%' }} />
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm text-slate-600">Avg Response Time</span>
                          <span className="text-sm font-semibold">2.5 hours</span>
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
            )}
            
            {activeTab === 'contacts' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Contacts</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search contacts..." className="pl-9 w-64" />
                      </div>
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Acme Corporation', email: 'contact@acme.com', company: 'Acme Corp', status: 'CUSTOMER' },
                      { name: 'Tech Solutions Inc', email: 'info@techsolutions.com', company: 'Tech Solutions', status: 'PROSPECT' },
                      { name: 'Global Industries', email: 'sales@globalind.com', company: 'Global Industries', status: 'LEAD' },
                      { name: 'StartUp Ventures', email: 'hello@startupv.com', company: 'StartUp Ventures', status: 'PROSPECT' },
                    ].map((contact, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                          {contact.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-sm text-slate-500">{contact.email}</p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          contact.status === 'CUSTOMER' && 'bg-emerald-100 text-emerald-700',
                          contact.status === 'PROSPECT' && 'bg-blue-100 text-blue-700',
                          contact.status === 'LEAD' && 'bg-amber-100 text-amber-700'
                        )}>
                          {contact.status}
                        </span>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'proposals' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Proposals</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search proposals..." className="pl-9 w-64" />
                      </div>
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        New Proposal
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: 'Proposal for Acme Corp', company: 'Acme Corporation', amount: '$45,000', status: 'ACCEPTED' },
                      { title: 'Enterprise Solution Package', company: 'Tech Solutions', amount: '$32,000', status: 'SENT' },
                      { title: 'Consulting Services', company: 'Global Industries', amount: '$18,000', status: 'DRAFT' },
                    ].map((proposal, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{proposal.title}</p>
                          <p className="text-sm text-slate-500">{proposal.company}</p>
                        </div>
                        <span className="text-lg font-semibold">{proposal.amount}</span>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          proposal.status === 'ACCEPTED' && 'bg-emerald-100 text-emerald-700',
                          proposal.status === 'SENT' && 'bg-blue-100 text-blue-700',
                          proposal.status === 'DRAFT' && 'bg-slate-100 text-slate-700'
                        )}>
                          {proposal.status}
                        </span>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'tasks' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Tasks</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search tasks..." className="pl-9 w-64" />
                      </div>
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: 'Follow up with Acme Corp', priority: 'HIGH', status: 'IN_PROGRESS', assignee: 'John Sales' },
                      { title: 'Prepare proposal for Tech Solutions', priority: 'HIGH', status: 'TODO', assignee: 'Sarah Manager' },
                      { title: 'Schedule demo with Global Industries', priority: 'MEDIUM', status: 'TODO', assignee: 'John Sales' },
                      { title: 'Update CRM records', priority: 'LOW', status: 'COMPLETED', assignee: 'Admin User' },
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {task.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-400" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <p className="text-sm text-slate-500">Assigned to: {task.assignee}</p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          task.priority === 'HIGH' && 'bg-red-100 text-red-700',
                          task.priority === 'MEDIUM' && 'bg-amber-100 text-amber-700',
                          task.priority === 'LOW' && 'bg-slate-100 text-slate-700'
                        )}>
                          {task.priority}
                        </span>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'calendar' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Calendar</CardTitle>
                  <CardDescription>Upcoming events and meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: 'Client Meeting - Acme Corp', date: 'Tomorrow, 10:00 AM', type: 'Meeting' },
                      { title: 'Proposal Review', date: 'Mar 15, 2:00 PM', type: 'Task' },
                      { title: 'Team Standup', date: 'Daily, 9:00 AM', type: 'Meeting' },
                      { title: 'Quarterly Review', date: 'Mar 20, 3:00 PM', type: 'Meeting' },
                    ].map((event, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-slate-500">{event.date}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{event.type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Growth Rate</p>
                          <p className="text-2xl font-bold">+24%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">New Leads</p>
                          <p className="text-2xl font-bold">156</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Revenue</p>
                          <p className="text-2xl font-bold">$125K</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Sales Performance</CardTitle>
                    <CardDescription>Monthly sales metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, i) => (
                        <div key={month} className="flex items-center gap-4">
                          <span className="w-10 text-sm text-slate-500">{month}</span>
                          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: `${(i + 1) * 18}%` }} />
                          </div>
                          <span className="text-sm font-medium">${(i + 1) * 15}K</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Manage your account settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-medium">
                        {user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-lg font-medium">{user?.name}</p>
                        <p className="text-sm text-slate-500">{user?.email}</p>
                        <p className="text-xs text-emerald-600 mt-1">{user?.role}</p>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input defaultValue={user?.name} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input defaultValue={user?.email} type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input defaultValue={user?.department || 'Not set'} />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-slate-500">Receive email updates</p>
                      </div>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Auth</p>
                        <p className="text-sm text-slate-500">Add extra security</p>
                      </div>
                      <Button variant="outline" size="sm">Setup</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-slate-500">Toggle dark theme</p>
                      </div>
                      <Button variant="outline" size="sm">Toggle</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
