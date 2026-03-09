'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Eye, EyeOff, Loader2, Download, LayoutDashboard, Users, FileText, CheckSquare, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Bell, Menu, Search, BarChart3, Calendar, Plus, Trash2, Edit, Building, Clock, CheckCircle, Circle, TrendingUp, DollarSign, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_USERS = [
  { email: 'admin@crm.com', name: 'Admin User', role: 'ADMIN' },
  { email: 'manager@crm.com', name: 'Sarah Manager', role: 'MANAGER' },
  { email: 'sales@crm.com', name: 'John Sales', role: 'SALES_REP' },
  { email: 'viewer@crm.com', name: 'Jane Viewer', role: 'VIEWER' }
]

type TabType = 'dashboard' | 'contacts' | 'proposals' | 'tasks' | 'calendar' | 'reports' | 'settings'

interface Contact { id: string; name: string; email: string; phone?: string; company?: string; position?: string; status: string; source?: string; createdAt: string; }
interface Proposal { id: string; title: string; description?: string; status: string; totalAmount: number; currency: string; contact?: { name: string }; createdAt: string; }
interface Task { id: string; title: string; description?: string; status: string; priority: string; dueDate?: string; assignee?: { name: string }; createdAt: string; }

export default function Home() {
  const { isAuthenticated, user, login, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Data states
  const [contacts, setContacts] = useState<Contact[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false)
  const [editProposalDialogOpen, setEditProposalDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)

  // Edit states
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form states
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', company: '', position: '', status: 'LEAD', source: '' })
  const [newProposal, setNewProposal] = useState({ title: '', description: '', totalAmount: '', status: 'DRAFT' })
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch all data
  const fetchData = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const [cRes, pRes, tRes] = await Promise.all([
        fetch('/api/contacts'),
        fetch('/api/proposals'),
        fetch('/api/tasks')
      ])
      const [cData, pData, tData] = await Promise.all([cRes.json(), pRes.json(), tRes.json()])
      setContacts(Array.isArray(cData) ? cData : [])
      setProposals(Array.isArray(pData) ? pData : [])
      setTasks(Array.isArray(tData) ? tData : [])
    } catch (e) {
      console.error('Failed to fetch data', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isAuthenticated) fetchData()
  }, [isAuthenticated])

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

  // ========== CONTACTS ==========
  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) {
      showToast('Name and Email are required', 'error')
      return
    }
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContact, ownerId: user?.id }),
      })
      const data = await response.json()
      if (response.ok) {
        setContacts([...contacts, data])
        setNewContact({ name: '', email: '', phone: '', company: '', position: '', status: 'LEAD', source: '' })
        setContactDialogOpen(false)
        showToast('Contact created successfully!')
      } else {
        showToast(data.error || 'Failed to create contact', 'error')
      }
    } catch (e) {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return
    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContact),
      })
      const data = await response.json()
      if (response.ok) {
        setContacts(contacts.map(c => c.id === data.id ? data : c))
        setEditContactDialogOpen(false)
        setEditingContact(null)
        showToast('Contact updated successfully!')
      }
    } catch (e) {
      showToast('Failed to update contact', 'error')
    }
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      const response = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== id))
        showToast('Contact deleted successfully!')
      }
    } catch (e) {
      showToast('Failed to delete contact', 'error')
    }
  }

  // ========== PROPOSALS ==========
  const handleCreateProposal = async () => {
    if (!newProposal.title) {
      showToast('Title is required', 'error')
      return
    }
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProposal,
          totalAmount: parseFloat(newProposal.totalAmount) || 0,
          contactId: contacts[0]?.id,
          ownerId: user?.id
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setProposals([...proposals, data])
        setNewProposal({ title: '', description: '', totalAmount: '', status: 'DRAFT' })
        setProposalDialogOpen(false)
        showToast('Proposal created successfully!')
      } else {
        showToast(data.error || 'Failed to create proposal', 'error')
      }
    } catch (e) {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateProposal = async () => {
    if (!editingProposal) return
    try {
      const response = await fetch(`/api/proposals/${editingProposal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProposal),
      })
      const data = await response.json()
      if (response.ok) {
        setProposals(proposals.map(p => p.id === data.id ? data : p))
        setEditProposalDialogOpen(false)
        setEditingProposal(null)
        showToast('Proposal updated successfully!')
      }
    } catch (e) {
      showToast('Failed to update proposal', 'error')
    }
  }

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return
    try {
      const response = await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setProposals(proposals.filter(p => p.id !== id))
        showToast('Proposal deleted successfully!')
      }
    } catch (e) {
      showToast('Failed to delete proposal', 'error')
    }
  }

  // ========== TASKS ==========
  const handleCreateTask = async () => {
    if (!newTask.title) {
      showToast('Title is required', 'error')
      return
    }
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, assigneeId: user?.id }),
      })
      const data = await response.json()
      if (response.ok) {
        setTasks([...tasks, data])
        setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })
        setTaskDialogOpen(false)
        showToast('Task created successfully!')
      } else {
        showToast(data.error || 'Failed to create task', 'error')
      }
    } catch (e) {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask),
      })
      const data = await response.json()
      if (response.ok) {
        setTasks(tasks.map(t => t.id === data.id ? data : t))
        setEditTaskDialogOpen(false)
        setEditingTask(null)
        showToast('Task updated successfully!')
      }
    } catch (e) {
      showToast('Failed to update task', 'error')
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== id))
        showToast('Task deleted successfully!')
      }
    } catch (e) {
      showToast('Failed to delete task', 'error')
    }
  }

  // Toggle task status
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus }),
      })
      const data = await response.json()
      if (response.ok) {
        setTasks(tasks.map(t => t.id === data.id ? data : t))
        showToast(newStatus === 'COMPLETED' ? 'Task completed!' : 'Task reopened!')
      }
    } catch (e) {
      showToast('Failed to update task', 'error')
    }
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
          <Button onClick={handleDownload} variant="outline" className="w-full h-12 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold">
            <Download className="mr-2 h-5 w-5" />Download ECI CRM Project
          </Button>
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">Sign in to your account</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" /></div>
                <div className="space-y-2"><Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter><Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}</Button></CardFooter>
            </form>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50">
            <CardContent className="pt-4">
              <p className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-2">Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">{DEMO_USERS.map((u) => (<div key={u.email} className="bg-white/50 dark:bg-black/20 rounded-lg p-2"><p className="font-medium text-amber-700">{u.role}</p><p className="text-slate-600">{u.email}</p></div>))}</div>
              <p className="text-xs text-slate-600 text-center mt-2">Password: <code className="bg-white/50 px-1 rounded">password123</code></p>
              <p className="text-xs text-slate-500 text-center mt-2">Built by <span className="font-semibold">Irfan Munir</span></p>
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
    { id: 'settings' as TabType, label: 'Settings', icon: Building2 },
  ]

  const statusColors: Record<string, string> = {
    LEAD: 'bg-amber-100 text-amber-700', PROSPECT: 'bg-blue-100 text-blue-700', CUSTOMER: 'bg-emerald-100 text-emerald-700', CHURNED: 'bg-red-100 text-red-700',
    DRAFT: 'bg-slate-100 text-slate-700', SENT: 'bg-blue-100 text-blue-700', ACCEPTED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700',
    TODO: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  }
  const priorityColors: Record<string, string> = { LOW: 'bg-slate-100 text-slate-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Toast */}
      {toast && <div className={cn('fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg', toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>{toast.message}</div>}
      
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={cn('fixed md:relative z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300', sidebarOpen ? 'w-64' : 'w-0 md:w-16 overflow-hidden md:overflow-visible')}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            {sidebarOpen && <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Building2 className="w-4 h-4 text-white" /></div><div><h1 className="font-bold text-slate-900 dark:text-white text-sm">ECI CRM</h1><p className="text-xs text-slate-500">by Irfan Munir</p></div></div>}
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
          </div>
          <nav className="flex-1 p-2 space-y-1 mt-4">{menuItems.map((item) => (<Button key={item.id} variant="ghost" className={cn('w-full justify-start gap-3 h-10', activeTab === item.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-slate-600 hover:bg-slate-100')} onClick={() => setActiveTab(item.id)}><item.icon className="h-5 w-5" />{sidebarOpen && <span>{item.label}</span>}</Button>))}</nav>
          {sidebarOpen && <div className="p-4 border-t border-slate-200 dark:border-slate-800"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0] || 'U'}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-slate-500 truncate">{user?.email}</p></div></div><Button variant="outline" size="sm" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button></div>}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="h-5 w-5" /></Button>
                <div className="hidden sm:flex items-center relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-9 h-9 bg-slate-100 dark:bg-slate-800 border-0" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm"><Moon className="h-5 w-5 dark:hidden" /><Sun className="h-5 w-5 hidden dark:block" /></Button>
                <Button variant="ghost" size="sm" className="relative"><Bell className="h-5 w-5" /><span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{tasks.filter(t => t.status !== 'COMPLETED').length}</span></Button>
                <div className="flex items-center gap-2 ml-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0] || 'U'}</div><div className="hidden md:block"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-slate-500">{user?.role}</p></div></div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><CardContent className="p-6"><h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h2><p className="text-emerald-100 mt-1">Here's what's happening with your business today.</p></CardContent></Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ title: 'Total Contacts', value: contacts.length, icon: Users, color: 'from-emerald-500 to-teal-600' }, { title: 'Active Proposals', value: proposals.filter(p => p.status !== 'REJECTED' && p.status !== 'CLOSED').length, icon: FileText, color: 'from-blue-500 to-indigo-600' }, { title: 'Pending Tasks', value: tasks.filter(t => t.status !== 'COMPLETED').length, icon: CheckSquare, color: 'from-amber-500 to-orange-600' }, { title: 'Revenue', value: `$${proposals.filter(p => p.status === 'ACCEPTED').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-pink-600' }].map((stat, i) => (<Card key={i} className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{stat.title}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div><div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}><stat.icon className="h-6 w-6 text-white" /></div></div></CardContent></Card>))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Recent Contacts</CardTitle></CardHeader><CardContent><div className="space-y-3">{contacts.slice(0, 5).map(c => <div key={c.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">{c.name[0]}</div><div className="flex-1"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-slate-500">{c.company || c.email}</p></div><span className={cn('px-2 py-0.5 rounded text-xs', statusColors[c.status])}>{c.status}</span></div>)}</div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Pending Tasks</CardTitle></CardHeader><CardContent><div className="space-y-3">{tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map(t => <div key={t.id} className="flex items-center gap-3"><Circle className="h-4 w-4 text-slate-400" /><div className="flex-1"><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-slate-500">{t.priority} priority</p></div><span className={cn('px-2 py-0.5 rounded text-xs', priorityColors[t.priority])}>{t.priority}</span></div>)}</div></CardContent></Card>
                </div>
              </div>
            )}

            {/* Contacts */}
            {activeTab === 'contacts' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle>Contacts ({contacts.length})</CardTitle>
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Contact</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Name *</Label><Input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Full name" /></div>
                        <div><Label>Email *</Label><Input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
                        <div><Label>Phone</Label><Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+1 234 567 8900" /></div>
                        <div><Label>Company</Label><Input value={newContact.company} onChange={(e) => setNewContact({ ...newContact, company: e.target.value })} placeholder="Company name" /></div>
                        <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newContact.status} onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}><option value="LEAD">Lead</option><option value="PROSPECT">Prospect</option><option value="CUSTOMER">Customer</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateContact} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Contact</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : contacts.length === 0 ? <div className="p-8 text-center text-slate-500">No contacts yet. Click "Add Contact" to create one.</div> :
                  <div className="divide-y">{contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">{contact.name[0]}</div>
                      <div className="flex-1"><p className="font-medium">{contact.name}</p><p className="text-sm text-slate-500">{contact.email} {contact.company && `• ${contact.company}`}</p></div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[contact.status])}>{contact.status}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingContact(contact); setEditContactDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteContact(contact.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}</div>}
                </CardContent>
              </Card>
            )}

            {/* Proposals */}
            {activeTab === 'proposals' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle>Proposals ({proposals.length})</CardTitle>
                  <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="h-4 w-4 mr-2" />New Proposal</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create New Proposal</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Title *</Label><Input value={newProposal.title} onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })} placeholder="Proposal title" /></div>
                        <div><Label>Description</Label><Input value={newProposal.description} onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })} placeholder="Brief description" /></div>
                        <div><Label>Amount ($)</Label><Input value={newProposal.totalAmount} onChange={(e) => setNewProposal({ ...newProposal, totalAmount: e.target.value })} placeholder="0.00" type="number" /></div>
                        <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newProposal.status} onChange={(e) => setNewProposal({ ...newProposal, status: e.target.value })}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateProposal} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Proposal</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : proposals.length === 0 ? <div className="p-8 text-center text-slate-500">No proposals yet. Click "New Proposal" to create one.</div> :
                  <div className="divide-y">{proposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white"><FileText className="h-5 w-5" /></div>
                      <div className="flex-1"><p className="font-medium">{proposal.title}</p><p className="text-sm text-slate-500">{proposal.description || 'No description'}</p></div>
                      <span className="text-lg font-semibold text-emerald-600">${(proposal.totalAmount || 0).toLocaleString()}</span>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[proposal.status])}>{proposal.status}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProposal(proposal); setEditProposalDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteProposal(proposal.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}</div>}
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            {activeTab === 'tasks' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle>Tasks ({tasks.length})</CardTitle>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Task</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Title *</Label><Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" /></div>
                        <div><Label>Description</Label><Input value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Task description" /></div>
                        <div><Label>Priority</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
                        <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateTask} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Task</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : tasks.length === 0 ? <div className="p-8 text-center text-slate-500">No tasks yet. Click "Add Task" to create one.</div> :
                  <div className="divide-y">{tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <button onClick={() => toggleTaskStatus(task)}>{task.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-400" />}</button>
                      <div className="flex-1"><p className={cn('font-medium', task.status === 'COMPLETED' && 'line-through text-slate-400')}>{task.title}</p><p className="text-sm text-slate-500">{task.description || 'No description'}</p></div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityColors[task.priority])}>{task.priority}</span>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[task.status])}>{task.status}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTask(task); setEditTaskDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}</div>}
                </CardContent>
              </Card>
            )}

            {/* Calendar */}
            {activeTab === 'calendar' && (
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>Calendar</CardTitle><CardDescription>Upcoming events and task deadlines</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map((task, i) => (
                      <div key={task.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white"><Calendar className="h-5 w-5" /></div>
                        <div className="flex-1"><p className="font-medium">{task.title}</p><p className="text-sm text-slate-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p></div>
                        <span className={cn('px-2 py-1 rounded text-xs', priorityColors[task.priority])}>{task.priority}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">Conversion Rate</p><p className="text-2xl font-bold">{contacts.length > 0 ? Math.round((contacts.filter(c => c.status === 'CUSTOMER').length / contacts.length) * 100) : 0}%</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Users className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">New Leads</p><p className="text-2xl font-bold">{contacts.filter(c => c.status === 'LEAD').length}</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"><DollarSign className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">Total Revenue</p><p className="text-2xl font-bold">${proposals.filter(p => p.status === 'ACCEPTED').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}</p></div></div></CardContent></Card>
                </div>
                <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader><CardContent><div className="space-y-3">{['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map(status => <div key={status} className="flex items-center gap-4"><span className="w-20 text-sm text-slate-500">{status}</span><div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', status === 'ACCEPTED' ? 'bg-emerald-500' : status === 'SENT' ? 'bg-blue-500' : status === 'REJECTED' ? 'bg-red-500' : 'bg-slate-400')} style={{ width: `${proposals.length > 0 ? (proposals.filter(p => p.status === status).length / proposals.length) * 100 : 0}%` }} /></div><span className="text-sm font-medium">{proposals.filter(p => p.status === status).length}</span></div>)}</div></CardContent></Card>
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader><CardTitle>Profile Settings</CardTitle><CardDescription>Manage your account</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-medium">{user?.name?.[0] || 'U'}</div><div><p className="text-lg font-medium">{user?.name}</p><p className="text-sm text-slate-500">{user?.email}</p><p className="text-xs text-emerald-600 mt-1">{user?.role}</p></div></div>
                    <div className="grid gap-4"><div><Label>Full Name</Label><Input defaultValue={user?.name} /></div><div><Label>Email</Label><Input defaultValue={user?.email} type="email" /></div><Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save Changes</Button></div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-500">ECI CRM - Enterprise Customer Intelligence</p><p className="text-sm text-slate-500 mt-1">Built by <span className="font-semibold">Irfan Munir</span></p><p className="text-xs text-slate-400 mt-2">Version 1.0.0</p></CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Dialogs */}
      <Dialog open={editContactDialogOpen} onOpenChange={setEditContactDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          {editingContact && <div className="space-y-3 py-4">
            <div><Label>Name</Label><Input value={editingContact.name} onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editingContact.email} onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={editingContact.phone || ''} onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })} /></div>
            <div><Label>Company</Label><Input value={editingContact.company || ''} onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })} /></div>
            <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingContact.status} onChange={(e) => setEditingContact({ ...editingContact, status: e.target.value })}><option value="LEAD">Lead</option><option value="PROSPECT">Prospect</option><option value="CUSTOMER">Customer</option></select></div>
          </div>}
          <DialogFooter><Button onClick={handleUpdateContact} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProposalDialogOpen} onOpenChange={setEditProposalDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Proposal</DialogTitle></DialogHeader>
          {editingProposal && <div className="space-y-3 py-4">
            <div><Label>Title</Label><Input value={editingProposal.title} onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={editingProposal.description || ''} onChange={(e) => setEditingProposal({ ...editingProposal, description: e.target.value })} /></div>
            <div><Label>Amount</Label><Input value={editingProposal.totalAmount} onChange={(e) => setEditingProposal({ ...editingProposal, totalAmount: parseFloat(e.target.value) || 0 })} type="number" /></div>
            <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingProposal.status} onChange={(e) => setEditingProposal({ ...editingProposal, status: e.target.value })}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></div>
          </div>}
          <DialogFooter><Button onClick={handleUpdateProposal} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editingTask && <div className="space-y-3 py-4">
            <div><Label>Title</Label><Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} /></div>
            <div><Label>Priority</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
            <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></div>
          </div>}
          <DialogFooter><Button onClick={handleUpdateTask} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
