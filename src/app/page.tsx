'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, useHydration } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Eye, EyeOff, Loader2, LayoutDashboard, Users, FileText, CheckSquare, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Bell, Menu, Search, BarChart3, Calendar, Plus, Trash2, Edit, Building, Clock, CheckCircle, Circle, TrendingUp, DollarSign, X, MessageSquare, UserPlus, Shield, Key, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabType = 'dashboard' | 'clients' | 'proposals' | 'tasks' | 'calendar' | 'reports' | 'settings' | 'users'

interface User { id: string; name: string; email: string; role: string; department?: string; isActive: boolean; }
interface Client { id: string; name: string; email: string; phone?: string; company?: string; position?: string; status: string; rfpNumber?: string; createdAt: string; }
interface Proposal { id: string; title: string; description?: string; rfpNumber?: string; status: string; totalAmount: number; deadline?: string; clientId: string; client?: Client; assigneeId?: string; assignee?: User; createdAt: string; }
interface Task { id: string; title: string; description?: string; status: string; priority: string; dueDate?: string; assignee?: User; proposalId?: string; proposal?: Proposal; createdAt: string; }
interface Remark { id: string; content: string; userId: string; user?: User; createdAt: string; }

export default function Home() {
  const { isAuthenticated, user, login, logout } = useAuthStore()
  const hasHydrated = useHydration()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [remarks, setRemarks] = useState<Remark[]>([])

  // Dialog states
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editClientDialogOpen, setEditClientDialogOpen] = useState(false)
  const [editProposalDialogOpen, setEditProposalDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  // Edit states
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Form states
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', company: '', position: '', status: 'LEAD', rfpNumber: '' })
  const [newProposal, setNewProposal] = useState({ title: '', description: '', rfpNumber: '', totalAmount: '', status: 'DRAFT', deadline: '', clientId: '', assigneeId: '' })
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '', proposalId: '' })
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'VIEWER', department: '' })
  const [newRemark, setNewRemark] = useState('')

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN'

  // Fetch all data
  const fetchData = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const [uRes, cRes, pRes, tRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/clients'),
        fetch('/api/proposals'),
        fetch('/api/tasks')
      ])
      const [uData, cData, pData, tData] = await Promise.all([uRes.json(), cRes.json(), pRes.json(), tRes.json()])
      setUsers(Array.isArray(uData) ? uData : [])
      setClients(Array.isArray(cData) ? cData : [])
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

  // Login handler
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
        setError(data.error || 'Invalid credentials')
        setIsLoading(false)
        return
      }
      login(data.user)
    } catch (err) {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResetSent(true)
    } catch (err) {
      setError('Failed to send reset email')
    }
    setIsLoading(false)
  }

  // ========== CLIENTS ==========
  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) {
      showToast('Name and Email are required', 'error')
      return
    }
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newClient, ownerId: user?.id }),
      })
      const data = await response.json()
      if (response.ok) {
        setClients([...clients, data])
        setNewClient({ name: '', email: '', phone: '', company: '', position: '', status: 'LEAD', rfpNumber: '' })
        setClientDialogOpen(false)
        showToast('Client created successfully!')
      } else {
        showToast(data.error || 'Failed to create client', 'error')
      }
    } catch (e) {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateClient = async () => {
    if (!editingClient) return
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      })
      const data = await response.json()
      if (response.ok) {
        setClients(clients.map(c => c.id === data.id ? data : c))
        setEditClientDialogOpen(false)
        setEditingClient(null)
        showToast('Client updated successfully!')
      }
    } catch (e) {
      showToast('Failed to update client', 'error')
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setClients(clients.filter(c => c.id !== id))
        showToast('Client deleted successfully!')
      }
    } catch (e) {
      showToast('Failed to delete client', 'error')
    }
  }

  // ========== PROPOSALS ==========
  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.clientId) {
      showToast('Title and Client are required', 'error')
      return
    }
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProposal,
          totalAmount: parseFloat(newProposal.totalAmount) || 0,
          deadline: newProposal.deadline ? new Date(newProposal.deadline) : null,
          ownerId: user?.id
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setProposals([...proposals, data])
        setNewProposal({ title: '', description: '', rfpNumber: '', totalAmount: '', status: 'DRAFT', deadline: '', clientId: '', assigneeId: '' })
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
        body: JSON.stringify({
          ...editingProposal,
          deadline: editingProposal.deadline ? new Date(editingProposal.deadline) : null
        }),
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

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !selectedProposal) return
    try {
      const response = await fetch('/api/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newRemark, proposalId: selectedProposal.id, userId: user?.id }),
      })
      const data = await response.json()
      if (response.ok) {
        setRemarks([...remarks, data])
        setNewRemark('')
        showToast('Remark added!')
      }
    } catch (e) {
      showToast('Failed to add remark', 'error')
    }
  }

  const openProposalDetail = async (proposal: Proposal) => {
    setSelectedProposal(proposal)
    try {
      const res = await fetch(`/api/remarks?proposalId=${proposal.id}`)
      const data = await res.json()
      setRemarks(Array.isArray(data) ? data : [])
    } catch (e) {
      setRemarks([])
    }
    setProposalDetailOpen(true)
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
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
          assigneeId: newTask.assigneeId || user?.id
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setTasks([...tasks, data])
        setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', assigneeId: '', proposalId: '' })
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
        body: JSON.stringify({
          ...editingTask,
          dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null
        }),
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

  // ========== USERS (Admin Only) ==========
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('Name, Email and Password are required', 'error')
      return
    }
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      const data = await response.json()
      if (response.ok) {
        setUsers([...users, data])
        setNewUser({ name: '', email: '', password: '', role: 'VIEWER', department: '' })
        setUserDialogOpen(false)
        showToast('User created successfully!')
      } else {
        showToast(data.error || 'Failed to create user', 'error')
      }
    } catch (e) {
      showToast('Network error', 'error')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      })
      const data = await response.json()
      if (response.ok) {
        setUsers(users.map(u => u.id === data.id ? data : u))
        setEditUserDialogOpen(false)
        setEditingUser(null)
        showToast('User updated successfully!')
      }
    } catch (e) {
      showToast('Failed to update user', 'error')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id))
        showToast('User deleted successfully!')
      }
    } catch (e) {
      showToast('Failed to delete user', 'error')
    }
  }

  // Show loading spinner during hydration
  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        <div className="w-full max-w-md relative">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">ECI CRM</CardTitle>
              <CardDescription>Enterprise Customer Intelligence</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {!forgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-emerald-600 hover:text-emerald-700">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {resetSent ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="text-slate-600">If an account exists with that email, you will receive password reset instructions.</p>
                      <Button variant="outline" className="mt-4" onClick={() => { setForgotPassword(false); setResetSent(false); }}>Back to Login</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-slate-600">Enter your email address and we'll send you instructions to reset your password.</p>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input type="email" placeholder="Enter your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="h-11" />
                      </div>
                      <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setForgotPassword(false)}>Back to Login</Button>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400">Built by <span className="font-medium text-slate-600">Irfan Munir</span> • © 2024 ECI CRM</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Dashboard Screen
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as TabType, label: 'Clients', icon: Users },
    { id: 'proposals' as TabType, label: 'Proposals', icon: FileText },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'users' as TabType, label: 'Users', icon: UserCog }] : []),
    { id: 'settings' as TabType, label: 'Settings', icon: Building2 },
  ]

  const statusColors: Record<string, string> = {
    LEAD: 'bg-amber-100 text-amber-700', PROSPECT: 'bg-blue-100 text-blue-700', CUSTOMER: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-slate-100 text-slate-700', SENT: 'bg-blue-100 text-blue-700', ACCEPTED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700',
    TODO: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
    ADMIN: 'bg-purple-100 text-purple-700', MANAGER: 'bg-blue-100 text-blue-700', SALES_REP: 'bg-emerald-100 text-emerald-700', VIEWER: 'bg-slate-100 text-slate-700',
  }
  const priorityColors: Record<string, string> = { LOW: 'bg-slate-100 text-slate-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {toast && <div className={cn('fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg', toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>{toast.message}</div>}
      
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={cn('fixed md:relative z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300', sidebarOpen ? 'w-64' : 'w-0 md:w-16 overflow-hidden md:overflow-visible')}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            {sidebarOpen && <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Building2 className="w-4 h-4 text-white" /></div><div><h1 className="font-bold text-slate-900 text-sm">ECI CRM</h1><p className="text-xs text-slate-500">by Irfan Munir</p></div></div>}
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
          </div>
          <nav className="flex-1 p-2 space-y-1 mt-4">{menuItems.map((item) => (<Button key={item.id} variant="ghost" className={cn('w-full justify-start gap-3 h-10', activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-100')} onClick={() => setActiveTab(item.id)}><item.icon className="h-5 w-5" />{sidebarOpen && <span>{item.label}</span>}</Button>))}</nav>
          {sidebarOpen && <div className="p-4 border-t border-slate-200"><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0] || 'U'}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-slate-500 truncate">{user?.role}</p></div></div><Button variant="outline" size="sm" className="w-full" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button></div>}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="h-5 w-5" /></Button>
                <div className="hidden sm:flex items-center relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search..." className="pl-9 h-9 bg-slate-100 border-0" /></div>
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
                  {[{ title: 'Total Clients', value: clients.length, icon: Users, color: 'from-emerald-500 to-teal-600' }, { title: 'Active Proposals', value: proposals.filter(p => !['REJECTED', 'CLOSED'].includes(p.status)).length, icon: FileText, color: 'from-blue-500 to-indigo-600' }, { title: 'Pending Tasks', value: tasks.filter(t => t.status !== 'COMPLETED').length, icon: CheckSquare, color: 'from-amber-500 to-orange-600' }, { title: 'Revenue', value: `$${proposals.filter(p => p.status === 'ACCEPTED').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-pink-600' }].map((stat, i) => (<Card key={i} className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{stat.title}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div><div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}><stat.icon className="h-6 w-6 text-white" /></div></div></CardContent></Card>))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader><CardContent><div className="space-y-3">{proposals.filter(p => p.deadline && new Date(p.deadline) > new Date()).slice(0, 5).map(p => <div key={p.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm"><Calendar className="h-4 w-4" /></div><div className="flex-1"><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-slate-500">Due: {new Date(p.deadline!).toLocaleDateString()}</p></div></div>)}</div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardTitle>Recent Tasks</CardTitle><CardContent><div className="space-y-3">{tasks.filter(t => t.status !== 'COMPLETED').slice(0, 5).map(t => <div key={t.id} className="flex items-center gap-3"><Circle className="h-4 w-4 text-slate-400" /><div className="flex-1"><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-slate-500">{t.priority} priority</p></div><span className={cn('px-2 py-0.5 rounded text-xs', priorityColors[t.priority])}>{t.priority}</span></div>)}</div></CardContent></Card>
                </div>
              </div>
            )}

            {/* Clients */}
            {activeTab === 'clients' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle>Clients ({clients.length})</CardTitle>
                  <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Client</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Name *</Label><Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client name" /></div>
                        <div><Label>Email *</Label><Input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
                        <div><Label>Phone</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="+1 234 567 8900" /></div>
                        <div><Label>Company</Label><Input value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} placeholder="Company name" /></div>
                        <div><Label>RFP Number</Label><Input value={newClient.rfpNumber} onChange={(e) => setNewClient({ ...newClient, rfpNumber: e.target.value })} placeholder="RFP-2024-001" /></div>
                        <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newClient.status} onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}><option value="LEAD">Lead</option><option value="PROSPECT">Prospect</option><option value="CUSTOMER">Customer</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateClient} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Client</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : clients.length === 0 ? <div className="p-8 text-center text-slate-500">No clients yet. Click "Add Client" to create one.</div> :
                  <div className="divide-y">{clients.map((client) => (
                    <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">{client.name[0]}</div>
                      <div className="flex-1"><p className="font-medium">{client.name}</p><p className="text-sm text-slate-500">{client.email} {client.company && `• ${client.company}`} {client.rfpNumber && `• RFP: ${client.rfpNumber}`}</p></div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[client.status])}>{client.status}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingClient(client); setEditClientDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteClient(client.id)}><Trash2 className="h-4 w-4" /></Button>
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
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Create New Proposal</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Title *</Label><Input value={newProposal.title} onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })} placeholder="Proposal title" /></div>
                        <div><Label>RFP Number</Label><Input value={newProposal.rfpNumber} onChange={(e) => setNewProposal({ ...newProposal, rfpNumber: e.target.value })} placeholder="RFP-2024-001" /></div>
                        <div><Label>Description</Label><Input value={newProposal.description} onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })} placeholder="Brief description" /></div>
                        <div><Label>Client *</Label>
                          <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newProposal.clientId} onChange={(e) => setNewProposal({ ...newProposal, clientId: e.target.value })}>
                            <option value="">Select Client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company && `(${c.company})`}</option>)}
                          </select>
                        </div>
                        <div><Label>Amount ($)</Label><Input value={newProposal.totalAmount} onChange={(e) => setNewProposal({ ...newProposal, totalAmount: e.target.value })} placeholder="0.00" type="number" /></div>
                        <div><Label>Deadline</Label><Input value={newProposal.deadline} onChange={(e) => setNewProposal({ ...newProposal, deadline: e.target.value })} type="date" /></div>
                        <div><Label>Assigned To</Label>
                          <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newProposal.assigneeId} onChange={(e) => setNewProposal({ ...newProposal, assigneeId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                          </select>
                        </div>
                        <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newProposal.status} onChange={(e) => setNewProposal({ ...newProposal, status: e.target.value })}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateProposal} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Proposal</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : proposals.length === 0 ? <div className="p-8 text-center text-slate-500">No proposals yet. Click "New Proposal" to create one.</div> :
                  <div className="divide-y">{proposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer" onClick={() => openProposalDetail(proposal)}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white"><FileText className="h-5 w-5" /></div>
                      <div className="flex-1"><p className="font-medium">{proposal.title}</p><p className="text-sm text-slate-500">{proposal.client?.name || 'Unknown'} {proposal.rfpNumber && `• RFP: ${proposal.rfpNumber}`}</p></div>
                      <span className="text-lg font-semibold text-emerald-600">${(proposal.totalAmount || 0).toLocaleString()}</span>
                      {proposal.deadline && <span className={cn('text-xs', new Date(proposal.deadline) < new Date() ? 'text-red-500' : 'text-slate-500')}>{new Date(proposal.deadline).toLocaleDateString()}</span>}
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[proposal.status])}>{proposal.status}</span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
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
                        <div><Label>Linked Proposal</Label>
                          <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newTask.proposalId} onChange={(e) => setNewTask({ ...newTask, proposalId: e.target.value })}>
                            <option value="">None</option>
                            {proposals.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                          </select>
                        </div>
                        <div><Label>Assigned To</Label>
                          <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                            <option value="">Assign to me</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <div><Label>Due Date</Label><Input value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} type="date" /></div>
                        <div><Label>Priority</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateTask} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create Task</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : tasks.length === 0 ? <div className="p-8 text-center text-slate-500">No tasks yet.</div> :
                  <div className="divide-y">{tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <button onClick={() => toggleTaskStatus(task)}>{task.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-400" />}</button>
                      <div className="flex-1"><p className={cn('font-medium', task.status === 'COMPLETED' && 'line-through text-slate-400')}>{task.title}</p><p className="text-sm text-slate-500">{task.description || ''} {task.proposal?.title && `• ${task.proposal.title}`}</p></div>
                      {task.dueDate && <span className="text-xs text-slate-500">{new Date(task.dueDate).toLocaleDateString()}</span>}
                      <span className={cn('px-2 py-1 rounded-full text-xs', priorityColors[task.priority])}>{task.priority}</span>
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
                <CardHeader><CardTitle>Calendar</CardTitle><CardDescription>Proposal deadlines and task due dates</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div><h3 className="font-medium mb-3">Proposal Deadlines</h3><div className="space-y-3">{proposals.filter(p => p.deadline).map(p => (<div key={p.id} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg"><div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', new Date(p.deadline!) < new Date() ? 'bg-red-500' : 'bg-emerald-500')}><Calendar className="h-5 w-5" /></div><div className="flex-1"><p className="font-medium">{p.title}</p><p className="text-sm text-slate-500">{p.client?.name || 'Unknown'} • Due: {new Date(p.deadline!).toLocaleDateString()}</p></div><span className={cn('px-2 py-1 rounded text-xs', statusColors[p.status])}>{p.status}</span></div>))}</div></div>
                    <div><h3 className="font-medium mb-3">Task Due Dates</h3><div className="space-y-3">{tasks.filter(t => t.dueDate && t.status !== 'COMPLETED').map(t => (<div key={t.id} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg"><div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', new Date(t.dueDate!) < new Date() ? 'bg-red-500' : 'bg-blue-500')}><CheckSquare className="h-5 w-5" /></div><div className="flex-1"><p className="font-medium">{t.title}</p><p className="text-sm text-slate-500">Due: {new Date(t.dueDate!).toLocaleDateString()}</p></div><span className={cn('px-2 py-1 rounded text-xs', priorityColors[t.priority])}>{t.priority}</span></div>))}</div></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">Conversion Rate</p><p className="text-2xl font-bold">{clients.length > 0 ? Math.round((clients.filter(c => c.status === 'CUSTOMER').length / clients.length) * 100) : 0}%</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Users className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">New Leads</p><p className="text-2xl font-bold">{clients.filter(c => c.status === 'LEAD').length}</p></div></div></CardContent></Card>
                  <Card className="border-0 shadow-lg"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center"><DollarSign className="h-6 w-6 text-white" /></div><div><p className="text-sm text-slate-500">Total Revenue</p><p className="text-2xl font-bold">${proposals.filter(p => p.status === 'ACCEPTED').reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}</p></div></div></CardContent></Card>
                </div>
                <Card className="border-0 shadow-lg"><CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader><CardContent><div className="space-y-3">{['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map(status => <div key={status} className="flex items-center gap-4"><span className="w-20 text-sm text-slate-500">{status}</span><div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div className={cn('h-full rounded-full', status === 'ACCEPTED' ? 'bg-emerald-500' : status === 'SENT' ? 'bg-blue-500' : status === 'REJECTED' ? 'bg-red-500' : 'bg-slate-400')} style={{ width: `${proposals.length > 0 ? (proposals.filter(p => p.status === status).length / proposals.length) * 100 : 0}%` }} /></div><span className="text-sm font-medium w-8">{proposals.filter(p => p.status === status).length}</span></div>)}</div></CardContent></Card>
              </div>
            )}

            {/* Users (Admin Only) */}
            {activeTab === 'users' && isAdmin && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />User Management</CardTitle>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><UserPlus className="h-4 w-4 mr-2" />Add User</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-4">
                        <div><Label>Name *</Label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" /></div>
                        <div><Label>Email *</Label><Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" type="email" /></div>
                        <div><Label>Password *</Label><Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Password" type="password" /></div>
                        <div><Label>Department</Label><Input value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} placeholder="Department" /></div>
                        <div><Label>Role *</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}><option value="VIEWER">Viewer</option><option value="SALES_REP">Sales Rep</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></div>
                      </div>
                      <DialogFooter><Button onClick={handleCreateUser} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Create User</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div></CardHeader>
                <CardContent className="p-0">
                  {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
                  <div className="divide-y">{users.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">{u.name[0]}</div>
                      <div className="flex-1"><p className="font-medium">{u.name}</p><p className="text-sm text-slate-500">{u.email} {u.department && `• ${u.department}`}</p></div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[u.role])}>{u.role}</span>
                      <span className={cn('px-2 py-1 rounded text-xs', u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setEditUserDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}</div>}
                </CardContent>
              </Card>
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
                  <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
                    <div><Label>New Password</Label><Input type="password" placeholder="••••••••" /></div>
                    <div><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
                    <Button variant="outline" className="w-full">Update Password</Button>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-slate-500">ECI CRM - Enterprise Customer Intelligence</p><p className="text-sm text-slate-500 mt-1">Built by <span className="font-semibold">Irfan Munir</span></p><p className="text-xs text-slate-400 mt-2">Version 2.0.0 - Professional Edition</p></CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Dialogs */}
      <Dialog open={editClientDialogOpen} onOpenChange={setEditClientDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
        {editingClient && <div className="space-y-3 py-4">
          <div><Label>Name</Label><Input value={editingClient.name} onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={editingClient.email} onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={editingClient.phone || ''} onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })} /></div>
          <div><Label>Company</Label><Input value={editingClient.company || ''} onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })} /></div>
          <div><Label>RFP Number</Label><Input value={editingClient.rfpNumber || ''} onChange={(e) => setEditingClient({ ...editingClient, rfpNumber: e.target.value })} /></div>
          <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingClient.status} onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}><option value="LEAD">Lead</option><option value="PROSPECT">Prospect</option><option value="CUSTOMER">Customer</option></select></div>
        </div>}
        <DialogFooter><Button onClick={handleUpdateClient} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editProposalDialogOpen} onOpenChange={setEditProposalDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Proposal</DialogTitle></DialogHeader>
        {editingProposal && <div className="space-y-3 py-4">
          <div><Label>Title</Label><Input value={editingProposal.title} onChange={(e) => setEditingProposal({ ...editingProposal, title: e.target.value })} /></div>
          <div><Label>RFP Number</Label><Input value={editingProposal.rfpNumber || ''} onChange={(e) => setEditingProposal({ ...editingProposal, rfpNumber: e.target.value })} /></div>
          <div><Label>Amount</Label><Input value={editingProposal.totalAmount} onChange={(e) => setEditingProposal({ ...editingProposal, totalAmount: parseFloat(e.target.value) || 0 })} type="number" /></div>
          <div><Label>Deadline</Label><Input value={editingProposal.deadline ? new Date(editingProposal.deadline).toISOString().split('T')[0] : ''} onChange={(e) => setEditingProposal({ ...editingProposal, deadline: e.target.value })} type="date" /></div>
          <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingProposal.status} onChange={(e) => setEditingProposal({ ...editingProposal, status: e.target.value })}><option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option></select></div>
        </div>}
        <DialogFooter><Button onClick={handleUpdateProposal} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
        {editingTask && <div className="space-y-3 py-4">
          <div><Label>Title</Label><Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} /></div>
          <div><Label>Due Date</Label><Input value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} type="date" /></div>
          <div><Label>Priority</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></div>
          <div><Label>Status</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}><option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option></select></div>
        </div>}
        <DialogFooter><Button onClick={handleUpdateTask} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        {editingUser && <div className="space-y-3 py-4">
          <div><Label>Name</Label><Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={editingUser.department || ''} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} /></div>
          <div><Label>Role</Label><select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}><option value="VIEWER">Viewer</option><option value="SALES_REP">Sales Rep</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={editingUser.isActive} onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })} className="rounded" /><Label>Active</Label></div>
        </div>}
        <DialogFooter><Button onClick={handleUpdateUser} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Detail Dialog */}
      <Dialog open={proposalDetailOpen} onOpenChange={setProposalDetailOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{selectedProposal?.title}</DialogTitle></DialogHeader>
        {selectedProposal && <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-slate-500">Client</p><p className="font-medium">{selectedProposal.client?.name || 'Unknown'}</p></div>
            <div><p className="text-sm text-slate-500">RFP Number</p><p className="font-medium">{selectedProposal.rfpNumber || 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Amount</p><p className="font-medium">${(selectedProposal.totalAmount || 0).toLocaleString()}</p></div>
            <div><p className="text-sm text-slate-500">Deadline</p><p className="font-medium">{selectedProposal.deadline ? new Date(selectedProposal.deadline).toLocaleDateString() : 'N/A'}</p></div>
            <div><p className="text-sm text-slate-500">Status</p><span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[selectedProposal.status])}>{selectedProposal.status}</span></div>
            <div><p className="text-sm text-slate-500">Assigned To</p><p className="font-medium">{selectedProposal.assignee?.name || 'Unassigned'}</p></div>
          </div>
          <div><p className="text-sm text-slate-500 mb-2">Description</p><p className="text-sm">{selectedProposal.description || 'No description'}</p></div>
          
          {/* Linked Tasks */}
          <div className="border-t pt-4"><h4 className="font-medium mb-2">Linked Tasks</h4><div className="space-y-2">{tasks.filter(t => t.proposalId === selectedProposal.id).map(t => <div key={t.id} className="flex items-center gap-2 text-sm"><Circle className="h-3 w-3" /><span>{t.title}</span><span className={cn('px-2 py-0.5 rounded text-xs', priorityColors[t.priority])}>{t.priority}</span></div>)}{tasks.filter(t => t.proposalId === selectedProposal.id).length === 0 && <p className="text-sm text-slate-500">No tasks linked</p>}</div></div>
          
          {/* Remarks */}
          <div className="border-t pt-4"><h4 className="font-medium mb-2">Remarks</h4><div className="space-y-2 max-h-40 overflow-y-auto">{remarks.map(r => <div key={r.id} className="p-2 bg-slate-50 rounded"><p className="text-sm">{r.content}</p><p className="text-xs text-slate-400 mt-1">{r.user?.name} • {new Date(r.createdAt).toLocaleString()}</p></div>)}{remarks.length === 0 && <p className="text-sm text-slate-500">No remarks</p>}</div>
          <div className="flex gap-2 mt-2"><Input value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder="Add a remark..." /><Button onClick={handleAddRemark} size="sm">Add</Button></div></div>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setProposalDetailOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
