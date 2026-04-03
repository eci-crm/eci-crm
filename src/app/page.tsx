'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Building2, Eye, EyeOff, Loader2, LayoutDashboard, Users, FileText, 
  CheckSquare, BarChart3, LogOut, Plus, Edit, Trash2, 
  Search, DollarSign, TrendingUp, AlertCircle, FolderOpen,
  Menu, X, Calendar, Download, RefreshCw, Upload, File
} from 'lucide-react'

// Types
interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
}

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  sector?: string
  status: string
  source?: string
  notes?: string
  rfpNumber?: string
  website?: string
  address?: string
  owner?: { id: string; name: string }
  createdAt: string
}

interface Proposal {
  id: string
  title: string
  description?: string
  rfpNumber?: string
  valuePKR: number
  valueUSD: number
  currency: string
  status: string
  stage: string
  submissionDate?: string
  deadline?: string
  submissionMethod?: string
  internalRemarks?: string
  externalRemarks?: string
  sector?: string
  owner?: { id: string; name: string; email: string }
  assignee?: { id: string; name: string; email: string }
  contact?: { id: string; name: string; company: string; sector: string }
  createdAt: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  assignee?: { id: string; name: string }
  proposal?: { id: string; title: string }
  createdAt: string
}

interface ResourceCategory {
  id: string
  name: string
  slug: string
  description?: string
  materials?: ResourceMaterial[]
}

interface ResourceMaterial {
  id: string
  title: string
  description?: string
  categoryId: string
  category?: ResourceCategory
  tags?: string
  isTemplate: boolean
  createdAt: string
}

// Auth
const AUTH_KEY = 'eci-crm-auth'

function getAuth(): { user: User } | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(AUTH_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { return null }
  }
  return null
}

function setAuth(data: { user: User }) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
}

// Utils
function formatCurrency(amount: number, currency: string = 'PKR'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }
  return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount)}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  PROSPECT: 'bg-purple-100 text-purple-800',
  CLIENT: 'bg-green-100 text-green-800',
  CUSTOMER: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
}

const stageColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  UNDER_EVALUATION: 'bg-orange-100 text-orange-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const taskStatusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authData, setAuthData] = useState<{ user: User } | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Data states
  const [clients, setClients] = useState<Client[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [resourceCategories, setResourceCategories] = useState<ResourceCategory[]>([])
  const [resourceMaterials, setResourceMaterials] = useState<ResourceMaterial[]>([])
  const [dashboardStats, setDashboardStats] = useState({
    totalProposals: 0, acceptedProposals: 0, rejectedProposals: 0,
    inEvaluationProposals: 0, draftProposals: 0, totalValuePKR: 0,
    totalValueUSD: 0, wonValuePKR: 0, wonValueUSD: 0, winRate: 0,
    totalClients: 0, pendingTasks: 0, completedTasks: 0, overdueTasks: 0
  })
  
  // Report filters
  const [reportPeriod, setReportPeriod] = useState('yearly')
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString())
  const [reportMonth, setReportMonth] = useState((new Date().getMonth() + 1).toString())
  const [reportWeek, setReportWeek] = useState('1')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [reportData, setReportData] = useState<any>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [activeReportType, setActiveReportType] = useState('proposals')
  
  // Search and filter
  const [clientSearch, setClientSearch] = useState('')
  const [proposalSearch, setProposalSearch] = useState('')
  const [taskSearch, setTaskSearch] = useState('')
  const [resourceSearch, setResourceSearch] = useState('')
  const [proposalFilter, setProposalFilter] = useState('all')
  
  // Modal states
  const [showClientModal, setShowClientModal] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingResource, setEditingResource] = useState<ResourceMaterial | null>(null)
  
  // Form states
  const [clientForm, setClientForm] = useState({
    name: '', email: '', phone: '', company: '', position: '', sector: '',
    status: 'LEAD', source: '', notes: '', rfpNumber: '', website: '', address: ''
  })
  const [proposalForm, setProposalForm] = useState({
    title: '', description: '', rfpNumber: '', valuePKR: 0, valueUSD: 0,
    currency: 'PKR', status: 'DRAFT', stage: 'NEW', submissionDate: '',
    deadline: '', submissionMethod: '', ownerId: '', assigneeId: '', contactId: '',
    internalRemarks: '', externalRemarks: '', sector: ''
  })
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'TODO', priority: 'MEDIUM',
    dueDate: '', assigneeId: '', proposalId: ''
  })
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'VIEWER', department: '', phone: ''
  })
  const [resourceForm, setResourceForm] = useState({
    title: '', description: '', categoryId: '', tags: '', isTemplate: false
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', description: ''
  })

  // Loading states
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setupNeeded, setSetupNeeded] = useState(false)

  // Check auth on mount
  useEffect(() => {
    const auth = getAuth()
    if (auth) {
      setAuthData(auth)
    }
  }, [])

  // Fetch all data
  useEffect(() => {
    if (authData) {
      fetchAllData()
    }
  }, [authData])

  const fetchAllData = async () => {
    setDataLoading(true)
    try {
      await Promise.all([
        fetchClients(),
        fetchProposals(),
        fetchTasks(),
        fetchUsers(),
        fetchResourceCategories(),
        fetchResourceMaterials(),
        fetchDashboardStats()
      ])
    } finally {
      setDataLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (err) { console.error('Failed to fetch clients:', err) }
  }

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals')
      if (res.ok) {
        const data = await res.json()
        setProposals(data)
      }
    } catch (err) { console.error('Failed to fetch proposals:', err) }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (err) { console.error('Failed to fetch tasks:', err) }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) { console.error('Failed to fetch users:', err) }
  }

  const fetchResourceCategories = async () => {
    try {
      const res = await fetch('/api/resource-categories')
      if (res.ok) {
        const data = await res.json()
        setResourceCategories(data)
      }
    } catch (err) { console.error('Failed to fetch resource categories:', err) }
  }

  const fetchResourceMaterials = async () => {
    try {
      const res = await fetch('/api/resource-materials')
      if (res.ok) {
        const data = await res.json()
        setResourceMaterials(data)
      }
    } catch (err) { console.error('Failed to fetch resource materials:', err) }
  }

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setDashboardStats(data.summary)
      }
    } catch (err) { console.error('Failed to fetch dashboard:', err) }
  }

  const fetchReportData = async () => {
    setLoadingReport(true)
    try {
      let url = `/api/reports/${activeReportType}?`
      
      if (reportPeriod === 'yearly') {
        url += `year=${reportYear}`
      } else if (reportPeriod === 'monthly') {
        url += `year=${reportYear}&month=${reportMonth}`
      } else if (reportPeriod === 'weekly') {
        // Calculate week start and end dates
        const year = parseInt(reportYear)
        const weekNum = parseInt(reportWeek)
        const simple = new Date(year, 0, 1 + (weekNum - 1) * 7)
        const dow = simple.getDay()
        const ISOweekStart = new Date(simple)
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
        const ISOweekEnd = new Date(ISOweekStart)
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6)
        
        url += `startDate=${ISOweekStart.toISOString().split('T')[0]}&endDate=${ISOweekEnd.toISOString().split('T')[0]}`
      } else if (reportPeriod === 'custom' && customStartDate && customEndDate) {
        url += `startDate=${customStartDate}&endDate=${customEndDate}`
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoadingReport(false)
    }
  }

  // Login
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
        if (data.error?.includes('Invalid') || response.status === 401) {
          // Try setup
          const setupRes = await fetch('/api/setup')
          const setupData = await setupRes.json()
          if (setupData.status === 'success') {
            // Retry login
            const retryRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })
            const retryData = await retryRes.json()
            if (retryRes.ok) {
              setAuth({ user: retryData.user })
              setAuthData({ user: retryData.user })
              setIsLoading(false)
              return
            }
          }
        }
        setError(data.error || 'Invalid credentials')
        setIsLoading(false)
        return
      }
      setAuth({ user: data.user })
      setAuthData({ user: data.user })
    } catch (err) {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const handleLogout = useCallback(() => {
    clearAuth()
    setAuthData(null)
  }, [])

  // Client CRUD
  const handleSaveClient = async () => {
    if (!clientForm.name || !clientForm.email) {
      alert('Name and Email are required')
      return
    }
    setSaving(true)
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      const body = { ...clientForm, ownerId: authData?.user?.id }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        fetchClients()
        fetchDashboardStats()
        setShowClientModal(false)
        setEditingClient(null)
        setClientForm({
          name: '', email: '', phone: '', company: '', position: '', sector: '',
          status: 'LEAD', source: '', notes: '', rfpNumber: '', website: '', address: ''
        })
      } else {
        const err = await res.json()
        alert(`Failed to save client: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save client: Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchClients()
        fetchDashboardStats()
      }
    } catch (err) {
      alert('Failed to delete client')
    }
  }

  // Proposal CRUD
  const handleSaveProposal = async () => {
    if (!proposalForm.title) {
      alert('Title is required')
      return
    }
    setSaving(true)
    try {
      const url = editingProposal ? `/api/proposals/${editingProposal.id}` : '/api/proposals'
      const method = editingProposal ? 'PUT' : 'POST'
      const body = { ...proposalForm, ownerId: proposalForm.ownerId || authData?.user?.id }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        fetchProposals()
        fetchDashboardStats()
        setShowProposalModal(false)
        setEditingProposal(null)
        setProposalForm({
          title: '', description: '', rfpNumber: '', valuePKR: 0, valueUSD: 0,
          currency: 'PKR', status: 'DRAFT', stage: 'NEW', submissionDate: '',
          deadline: '', submissionMethod: '', ownerId: '', assigneeId: '', contactId: '',
          internalRemarks: '', externalRemarks: '', sector: ''
        })
      } else {
        const err = await res.json()
        alert(`Failed to save proposal: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save proposal: Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProposals()
        fetchDashboardStats()
      }
    } catch (err) {
      alert('Failed to delete proposal')
    }
  }

  // Task CRUD
  const handleSaveTask = async () => {
    if (!taskForm.title || !taskForm.assigneeId) {
      alert('Title and Assignee are required')
      return
    }
    setSaving(true)
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      })
      
      if (res.ok) {
        fetchTasks()
        fetchDashboardStats()
        setShowTaskModal(false)
        setEditingTask(null)
        setTaskForm({
          title: '', description: '', status: 'TODO', priority: 'MEDIUM',
          dueDate: '', assigneeId: '', proposalId: ''
        })
      } else {
        const err = await res.json()
        alert(`Failed to save task: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save task: Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchTasks()
        fetchDashboardStats()
      }
    } catch (err) {
      alert('Failed to delete task')
    }
  }

  // User CRUD
  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email || (!editingUser && !userForm.password)) {
      alert('Name, Email and Password are required')
      return
    }
    setSaving(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })
      
      if (res.ok) {
        fetchUsers()
        setShowUserModal(false)
        setEditingUser(null)
        setUserForm({ name: '', email: '', password: '', role: 'VIEWER', department: '', phone: '' })
      } else {
        const err = await res.json()
        alert(`Failed to save user: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save user: Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) fetchUsers()
    } catch (err) {
      alert('Failed to delete user')
    }
  }

  // Resource CRUD
  const handleSaveResource = async () => {
    if (!resourceForm.title || !resourceForm.categoryId) {
      alert('Title and Category are required')
      return
    }
    setSaving(true)
    try {
      const url = editingResource ? `/api/resource-materials/${editingResource.id}` : '/api/resource-materials'
      const method = editingResource ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resourceForm, createdBy: authData?.user?.id })
      })
      
      if (res.ok) {
        fetchResourceMaterials()
        fetchResourceCategories()
        setShowResourceModal(false)
        setEditingResource(null)
        setResourceForm({ title: '', description: '', categoryId: '', tags: '', isTemplate: false })
      } else {
        const err = await res.json()
        alert(`Failed to save resource: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save resource: Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    try {
      const res = await fetch(`/api/resource-materials/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchResourceMaterials()
        fetchResourceCategories()
      }
    } catch (err) {
      alert('Failed to delete resource')
    }
  }

  // Category CRUD
  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.slug) {
      alert('Name and Slug are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/resource-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })
      
      if (res.ok) {
        fetchResourceCategories()
        setShowCategoryModal(false)
        setCategoryForm({ name: '', slug: '', description: '' })
      } else {
        const err = await res.json()
        alert(`Failed to save category: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save category: Network error')
    } finally {
      setSaving(false)
    }
  }

  // Filtered data
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  )

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(proposalSearch.toLowerCase()) ||
      (p.rfpNumber && p.rfpNumber.toLowerCase().includes(proposalSearch.toLowerCase()))
    const matchesFilter = proposalFilter === 'all' || p.stage === proposalFilter
    return matchesSearch && matchesFilter
  })

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  )

  const filteredResources = resourceMaterials.filter(r =>
    r.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(resourceSearch.toLowerCase())) ||
    (r.tags && r.tags.toLowerCase().includes(resourceSearch.toLowerCase()))
  )

  // Login screen
  if (!authData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">ECI CRM</CardTitle>
              <CardDescription>Enterprise Customer Intelligence</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="Enter your email" value={email} 
                    onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" 
                      value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="sm" 
                      className="absolute right-0 top-0 h-full px-3" 
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>) : 'Sign In'}
                </Button>
              </form>
              <p className="text-xs text-center text-slate-500 mt-4">
                Demo: admin@ecicrm.com / password123
              </p>
            </CardContent>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100">
              <p className="text-xs text-center text-slate-400">
                Built by <span className="font-medium text-slate-600">Irfan Munir</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">ECI CRM</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white hover:bg-slate-800">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'proposals', icon: FileText, label: 'Proposals' },
            { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
            { id: 'reports', icon: BarChart3, label: 'Reports' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'resources', icon: FolderOpen, label: 'Resources' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}>
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{authData.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{authData.user.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-6">
          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <Button variant="outline" size="sm" onClick={fetchAllData}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Proposals</p>
                            <p className="text-2xl font-bold">{dashboardStats.totalProposals}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Value (PKR)</p>
                            <p className="text-xl font-bold">{formatCurrency(dashboardStats.totalValuePKR)}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Won Value (PKR)</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(dashboardStats.wonValuePKR)}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Win Rate</p>
                            <p className="text-2xl font-bold">{dashboardStats.winRate}%</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Second Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Total Clients</p>
                            <p className="text-2xl font-bold">{dashboardStats.totalClients}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Pending Tasks</p>
                            <p className="text-2xl font-bold">{dashboardStats.pendingTasks}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <CheckSquare className="w-5 h-5 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Overdue Tasks</p>
                            <p className="text-2xl font-bold text-red-600">{dashboardStats.overdueTasks}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Accepted</p>
                            <p className="text-2xl font-bold text-green-600">{dashboardStats.acceptedProposals}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Proposals by Stage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { label: 'New', count: proposals.filter(p => p.stage === 'NEW').length },
                            { label: 'Draft', count: proposals.filter(p => p.stage === 'DRAFT').length },
                            { label: 'In Progress', count: proposals.filter(p => p.stage === 'IN_PROGRESS').length },
                            { label: 'Submitted', count: proposals.filter(p => p.stage === 'SUBMITTED').length },
                            { label: 'Evaluation', count: proposals.filter(p => p.stage === 'UNDER_EVALUATION').length },
                            { label: 'Accepted', count: proposals.filter(p => p.stage === 'ACCEPTED').length },
                          ].map(item => (
                            <div key={item.label} className="text-center p-3 rounded-lg bg-gray-50">
                              <p className="text-xl font-bold">{item.count}</p>
                              <p className="text-xs text-gray-500">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Proposals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {proposals.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                              <div>
                                <p className="font-medium text-sm">{p.title}</p>
                                <p className="text-xs text-gray-500">{p.contact?.company || 'No client'}</p>
                              </div>
                              <Badge className={stageColors[p.stage] || 'bg-gray-100'}>{p.stage}</Badge>
                            </div>
                          ))}
                          {proposals.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No proposals yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Clients Tab */}
              {activeTab === 'clients' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <Button onClick={() => {
                      setEditingClient(null)
                      setClientForm({ name: '', email: '', phone: '', company: '', position: '', sector: '', status: 'LEAD', source: '', notes: '', rfpNumber: '', website: '', address: '' })
                      setShowClientModal(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Client
                    </Button>
                  </div>
                  
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search clients..." value={clientSearch} 
                      onChange={(e) => setClientSearch(e.target.value)} className="pl-10" />
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Name</th>
                              <th className="text-left p-4 font-medium">Company</th>
                              <th className="text-left p-4 font-medium">Email</th>
                              <th className="text-left p-4 font-medium">Sector</th>
                              <th className="text-left p-4 font-medium">Status</th>
                              <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map(client => (
                              <tr key={client.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                  <p className="font-medium">{client.name}</p>
                                  {client.position && <p className="text-sm text-gray-500">{client.position}</p>}
                                </td>
                                <td className="p-4">{client.company || '-'}</td>
                                <td className="p-4">{client.email}</td>
                                <td className="p-4">{client.sector || '-'}</td>
                                <td className="p-4">
                                  <Badge className={statusColors[client.status] || 'bg-gray-100'}>{client.status}</Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setEditingClient(client)
                                      setClientForm({
                                        name: client.name, email: client.email, phone: client.phone || '',
                                        company: client.company || '', position: client.position || '',
                                        sector: client.sector || '', status: client.status,
                                        source: client.source || '', notes: client.notes || '',
                                        rfpNumber: client.rfpNumber || '', website: client.website || '',
                                        address: client.address || ''
                                      })
                                      setShowClientModal(true)
                                    }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)} className="text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredClients.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">No clients found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Proposals Tab */}
              {activeTab === 'proposals' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
                    <Button onClick={() => {
                      setEditingProposal(null)
                      setProposalForm({
                        title: '', description: '', rfpNumber: '', valuePKR: 0, valueUSD: 0,
                        currency: 'PKR', status: 'DRAFT', stage: 'NEW', submissionDate: '',
                        deadline: '', submissionMethod: '', ownerId: '', assigneeId: '', contactId: '',
                        internalRemarks: '', externalRemarks: '', sector: ''
                      })
                      setShowProposalModal(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Proposal
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input placeholder="Search proposals..." value={proposalSearch} 
                        onChange={(e) => setProposalSearch(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={proposalFilter} onValueChange={setProposalFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="UNDER_EVALUATION">Under Evaluation</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Title</th>
                              <th className="text-left p-4 font-medium">Client</th>
                              <th className="text-left p-4 font-medium">Value (PKR)</th>
                              <th className="text-left p-4 font-medium">Value (USD)</th>
                              <th className="text-left p-4 font-medium">Stage</th>
                              <th className="text-left p-4 font-medium">Deadline</th>
                              <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProposals.map(proposal => (
                              <tr key={proposal.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                  <p className="font-medium">{proposal.title}</p>
                                  {proposal.rfpNumber && <p className="text-sm text-gray-500">RFP: {proposal.rfpNumber}</p>}
                                </td>
                                <td className="p-4">{proposal.contact?.company || '-'}</td>
                                <td className="p-4">{formatCurrency(proposal.valuePKR)}</td>
                                <td className="p-4">{formatCurrency(proposal.valueUSD, 'USD')}</td>
                                <td className="p-4">
                                  <Badge className={stageColors[proposal.stage] || 'bg-gray-100'}>{proposal.stage}</Badge>
                                </td>
                                <td className="p-4">{formatDate(proposal.deadline)}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setEditingProposal(proposal)
                                      setProposalForm({
                                        title: proposal.title,
                                        description: proposal.description || '',
                                        rfpNumber: proposal.rfpNumber || '',
                                        valuePKR: proposal.valuePKR,
                                        valueUSD: proposal.valueUSD,
                                        currency: proposal.currency,
                                        status: proposal.status,
                                        stage: proposal.stage,
                                        submissionDate: proposal.submissionDate ? proposal.submissionDate.split('T')[0] : '',
                                        deadline: proposal.deadline ? proposal.deadline.split('T')[0] : '',
                                        submissionMethod: proposal.submissionMethod || '',
                                        ownerId: proposal.owner?.id || '',
                                        assigneeId: proposal.assignee?.id || '',
                                        contactId: proposal.contact?.id || '',
                                        internalRemarks: proposal.internalRemarks || '',
                                        externalRemarks: proposal.externalRemarks || '',
                                        sector: proposal.sector || ''
                                      })
                                      setShowProposalModal(true)
                                    }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProposal(proposal.id)} className="text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredProposals.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">No proposals found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <Button onClick={() => {
                      setEditingTask(null)
                      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '', proposalId: '' })
                      setShowTaskModal(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Task
                    </Button>
                  </div>
                  
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search tasks..." value={taskSearch} 
                      onChange={(e) => setTaskSearch(e.target.value)} className="pl-10" />
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredTasks.map(task => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{task.title}</p>
                                <Badge className={taskStatusColors[task.status]}>{task.status}</Badge>
                                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                              </div>
                              {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
                                {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
                                {task.proposal && <span>Proposal: {task.proposal.title}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingTask(task)
                                setTaskForm({
                                  title: task.title,
                                  description: task.description || '',
                                  status: task.status,
                                  priority: task.priority,
                                  dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                                  assigneeId: task.assignee?.id || '',
                                  proposalId: task.proposal?.id || ''
                                })
                                setShowTaskModal(true)
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredTasks.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center text-gray-500">No tasks found</CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                  
                  {/* Report Type Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={`cursor-pointer transition-all ${activeReportType === 'proposals' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveReportType('proposals')}>
                      <CardContent className="p-4 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Proposal Reports</p>
                        <p className="text-sm text-gray-500">Track submissions, wins, values</p>
                      </CardContent>
                    </Card>
                    <Card className={`cursor-pointer transition-all ${activeReportType === 'staff' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveReportType('staff')}>
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Staff Reports</p>
                        <p className="text-sm text-gray-500">Workload, tasks per person</p>
                      </CardContent>
                    </Card>
                    <Card className={`cursor-pointer transition-all ${activeReportType === 'clients' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveReportType('clients')}>
                      <CardContent className="p-4 text-center">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        <p className="font-medium">Client Reports</p>
                        <p className="text-sm text-gray-500">Top clients, sector analysis</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Date Filters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Filter by Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Period</Label>
                          <Select value={reportPeriod} onValueChange={setReportPeriod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {reportPeriod === 'yearly' && (
                          <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={reportYear} onValueChange={setReportYear}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[2024, 2023, 2022, 2021].map(y => (
                                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {reportPeriod === 'monthly' && (
                          <>
                            <div className="space-y-2">
                              <Label>Year</Label>
                              <Select value={reportYear} onValueChange={setReportYear}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[2024, 2023, 2022, 2021].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Month</Label>
                              <Select value={reportMonth} onValueChange={setReportMonth}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                    <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        {reportPeriod === 'weekly' && (
                          <>
                            <div className="space-y-2">
                              <Label>Year</Label>
                              <Select value={reportYear} onValueChange={setReportYear}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[2024, 2023, 2022, 2021].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Week</Label>
                              <Select value={reportWeek} onValueChange={setReportWeek}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: 52}, (_, i) => i + 1).map(w => (
                                    <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        
                        {reportPeriod === 'custom' && (
                          <>
                            <div className="space-y-2">
                              <Label>Start Date</Label>
                              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>End Date</Label>
                              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button onClick={fetchReportData} disabled={loadingReport}>
                          {loadingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                          Generate Report
                        </Button>
                        {reportData && (
                          <Button variant="outline" onClick={() => window.print()}>
                            <Download className="w-4 h-4 mr-2" /> Export
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Report Results */}
                  {reportData && (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Total Proposals</p>
                            <p className="text-2xl font-bold">{reportData.summary?.totalProposals || 0}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Accepted</p>
                            <p className="text-2xl font-bold text-green-600">{reportData.summary?.accepted || 0}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Total Value (PKR)</p>
                            <p className="text-xl font-bold">{formatCurrency(reportData.summary?.totalValuePKR || 0)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-500">Won Value (PKR)</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.summary?.wonValuePKR || 0)}</p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Detailed Table */}
                      {reportData.proposals && reportData.proposals.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Proposal Details</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="text-left p-4 font-medium">Title</th>
                                    <th className="text-left p-4 font-medium">Client</th>
                                    <th className="text-left p-4 font-medium">Value PKR</th>
                                    <th className="text-left p-4 font-medium">Value USD</th>
                                    <th className="text-left p-4 font-medium">Stage</th>
                                    <th className="text-left p-4 font-medium">Owner</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reportData.proposals.map((p: any) => (
                                    <tr key={p.id} className="border-b">
                                      <td className="p-4">{p.title}</td>
                                      <td className="p-4">{p.client}</td>
                                      <td className="p-4">{formatCurrency(p.valuePKR)}</td>
                                      <td className="p-4">{formatCurrency(p.valueUSD, 'USD')}</td>
                                      <td className="p-4"><Badge className={stageColors[p.stage]}>{p.stage}</Badge></td>
                                      <td className="p-4">{p.owner}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <Button onClick={() => {
                      setEditingUser(null)
                      setUserForm({ name: '', email: '', password: '', role: 'VIEWER', department: '', phone: '' })
                      setShowUserModal(true)
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Name</th>
                              <th className="text-left p-4 font-medium">Email</th>
                              <th className="text-left p-4 font-medium">Role</th>
                              <th className="text-left p-4 font-medium">Department</th>
                              <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map(user => (
                              <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                  <Badge variant="outline">{user.role}</Badge>
                                </td>
                                <td className="p-4">{user.department || '-'}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                      setEditingUser(user)
                                      setUserForm({
                                        name: user.name, email: user.email, password: '',
                                        role: user.role, department: user.department || '', phone: ''
                                      })
                                      setShowUserModal(true)
                                    }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-700">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {users.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No users found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Resource Materials</h1>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setCategoryForm({ name: '', slug: '', description: '' })
                        setShowCategoryModal(true)
                      }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                      </Button>
                      <Button onClick={() => {
                        setEditingResource(null)
                        setResourceForm({ title: '', description: '', categoryId: '', tags: '', isTemplate: false })
                        setShowResourceModal(true)
                      }}>
                        <Upload className="w-4 h-4 mr-2" /> Add Resource
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search resources..." value={resourceSearch} 
                      onChange={(e) => setResourceSearch(e.target.value)} className="pl-10" />
                  </div>
                  
                  {/* Categories with Resources */}
                  <div className="grid gap-6">
                    {resourceCategories.map(category => {
                      const categoryMaterials = filteredResources.filter(m => m.categoryId === category.id)
                      return (
                        <Card key={category.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{category.name}</CardTitle>
                                {category.description && (
                                  <CardDescription>{category.description}</CardDescription>
                                )}
                              </div>
                              <Badge variant="secondary">{categoryMaterials.length} items</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {categoryMaterials.length > 0 ? (
                              <div className="grid gap-3">
                                {categoryMaterials.map(material => (
                                  <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <File className="w-5 h-5 text-gray-400" />
                                      <div>
                                        <p className="font-medium">{material.title}</p>
                                        {material.description && (
                                          <p className="text-sm text-gray-500">{material.description}</p>
                                        )}
                                        {material.tags && (
                                          <div className="flex gap-1 mt-1">
                                            {material.tags.split(',').map((tag, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {material.isTemplate && <Badge className="bg-blue-100 text-blue-800">Template</Badge>}
                                      <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingResource(material)
                                        setResourceForm({
                                          title: material.title,
                                          description: material.description || '',
                                          categoryId: material.categoryId,
                                          tags: material.tags || '',
                                          isTemplate: material.isTemplate
                                        })
                                        setShowResourceModal(true)
                                      }}>
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteResource(material.id)} className="text-red-600 hover:text-red-700">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">No materials in this category</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                    {resourceCategories.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                          No categories found. Create a category first to add resources.
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Client Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={clientForm.company} onChange={(e) => setClientForm({...clientForm, company: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input value={clientForm.position} onChange={(e) => setClientForm({...clientForm, position: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={clientForm.sector} onValueChange={(v) => setClientForm({...clientForm, sector: v})}>
                <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Banking">Banking</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={clientForm.status} onValueChange={(v) => setClientForm({...clientForm, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input value={clientForm.source} onChange={(e) => setClientForm({...clientForm, source: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={clientForm.website} onChange={(e) => setClientForm({...clientForm, website: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>RFP Number</Label>
              <Input value={clientForm.rfpNumber} onChange={(e) => setClientForm({...clientForm, rfpNumber: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={clientForm.notes} onChange={(e) => setClientForm({...clientForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientModal(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingClient ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProposal ? 'Edit Proposal' : 'Add Proposal'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input value={proposalForm.title} onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>RFP Number</Label>
              <Input value={proposalForm.rfpNumber} onChange={(e) => setProposalForm({...proposalForm, rfpNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={proposalForm.contactId} onValueChange={(v) => setProposalForm({...proposalForm, contactId: v})}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value (PKR)</Label>
              <Input type="number" value={proposalForm.valuePKR} onChange={(e) => setProposalForm({...proposalForm, valuePKR: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Value (USD)</Label>
              <Input type="number" value={proposalForm.valueUSD} onChange={(e) => setProposalForm({...proposalForm, valueUSD: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={proposalForm.stage} onValueChange={(v) => setProposalForm({...proposalForm, stage: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_EVALUATION">Under Evaluation</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Submission Method</Label>
              <Select value={proposalForm.submissionMethod} onValueChange={(v) => setProposalForm({...proposalForm, submissionMethod: v})}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PORTAL">Portal</SelectItem>
                  <SelectItem value="HARD_COPY">Hard Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={proposalForm.deadline} onChange={(e) => setProposalForm({...proposalForm, deadline: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Submission Date</Label>
              <Input type="date" value={proposalForm.submissionDate} onChange={(e) => setProposalForm({...proposalForm, submissionDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={proposalForm.assigneeId} onValueChange={(v) => setProposalForm({...proposalForm, assigneeId: v})}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={proposalForm.sector} onValueChange={(v) => setProposalForm({...proposalForm, sector: v})}>
                <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Banking">Banking</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={proposalForm.description} onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Internal Remarks</Label>
              <Textarea value={proposalForm.internalRemarks} onChange={(e) => setProposalForm({...proposalForm, internalRemarks: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>External Remarks</Label>
              <Textarea value={proposalForm.externalRemarks} onChange={(e) => setProposalForm({...proposalForm, externalRemarks: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProposal} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProposal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({...taskForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Assignee *</Label>
              <Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm({...taskForm, assigneeId: v})}>
                <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Proposal</Label>
              <Select value={taskForm.proposalId} onValueChange={(v) => setTaskForm({...taskForm, proposalId: v})}>
                <SelectTrigger><SelectValue placeholder="Select proposal (optional)" /></SelectTrigger>
                <SelectContent>
                  {proposals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <Input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={userForm.department} onChange={(e) => setUserForm({...userForm, department: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Modal */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={resourceForm.title} onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={resourceForm.description} onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={resourceForm.categoryId} onValueChange={(v) => setResourceForm({...resourceForm, categoryId: v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {resourceCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={resourceForm.tags} onChange={(e) => setResourceForm({...resourceForm, tags: e.target.value})} placeholder="template, guide, reference" />
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input 
                  type="file" 
                  id="fileUpload" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('uploadedBy', authData?.user?.id || 'system')
                      
                      try {
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData
                        })
                        if (res.ok) {
                          const data = await res.json()
                          alert(`File "${data.attachment.originalName}" uploaded successfully!`)
                          fetchResourceMaterials()
                        } else {
                          alert('Failed to upload file')
                        }
                      } catch (err) {
                        alert('Failed to upload file')
                      }
                    }
                  }}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, Images (max 500KB for preview)</p>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isTemplate" checked={resourceForm.isTemplate} onChange={(e) => setResourceForm({...resourceForm, isTemplate: e.target.checked})} className="rounded" />
              <Label htmlFor="isTemplate">Mark as Template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResourceModal(false)}>Cancel</Button>
            <Button onClick={handleSaveResource} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingResource ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} placeholder="e.g., proposal-templates" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
