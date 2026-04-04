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
  Menu, X, Calendar, Download, RefreshCw, Upload, File,
  ArrowUpRight, Target, Award, Clock, Sparkles, Zap,
  FileCheck, Briefcase, Globe, Phone, Mail, MapPin,
  ChevronRight, Star, Activity, PieChart, LineChart
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

interface Attachment {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

interface ResourceMaterial {
  id: string
  title: string
  description?: string
  categoryId: string
  category?: ResourceCategory
  tags?: string
  isTemplate: boolean
  attachments?: Attachment[]
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const statusColors: Record<string, string> = {
  LEAD: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30',
  PROSPECT: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30',
  CLIENT: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30',
  CUSTOMER: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30',
  INACTIVE: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/30',
}

const stageColors: Record<string, string> = {
  NEW: 'bg-gradient-to-r from-sky-400 to-blue-500 text-white',
  DRAFT: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
  IN_PROGRESS: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  SUBMITTED: 'bg-gradient-to-r from-violet-400 to-purple-500 text-white',
  UNDER_EVALUATION: 'bg-gradient-to-r from-orange-400 to-red-500 text-white',
  ACCEPTED: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white',
  REJECTED: 'bg-gradient-to-r from-red-400 to-rose-500 text-white',
}

const taskStatusColors: Record<string, string> = {
  TODO: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white',
  IN_PROGRESS: 'bg-gradient-to-r from-sky-400 to-blue-500 text-white',
  COMPLETED: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
  MEDIUM: 'bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900',
  HIGH: 'bg-gradient-to-r from-orange-400 to-red-500 text-white',
  URGENT: 'bg-gradient-to-r from-red-500 to-rose-600 text-white animate-pulse',
}

const sectorIcons: Record<string, any> = {
  Technology: Globe,
  Banking: Building2,
  Healthcare: Activity,
  Government: Briefcase,
  Construction: Building2,
  Education: FileText,
  Manufacturing: Target,
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authData, setAuthData] = useState<{ user: User } | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
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

  // Pending files for resource upload
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Loading states
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Check auth on mount
  useEffect(() => {
    const auth = getAuth()
    if (auth) {
      setAuthData(auth)
    }
  }, [])

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
          const setupRes = await fetch('/api/setup')
          const setupData = await setupRes.json()
          if (setupData.status === 'success') {
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
    setUploadingFiles(true)
    try {
      const url = editingResource ? `/api/resource-materials/${editingResource.id}` : '/api/resource-materials'
      const method = editingResource ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...resourceForm, createdBy: authData?.user?.id })
      })

      if (res.ok) {
        const savedResource = await res.json()

        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('resourceId', savedResource.id)
            formData.append('uploadedBy', authData?.user?.id || 'system')

            try {
              const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              })
              if (!uploadRes.ok) {
                console.error('Failed to upload file:', file.name)
              }
            } catch (uploadErr) {
              console.error('Upload error for file:', file.name, uploadErr)
            }
          }
        }

        fetchResourceMaterials()
        fetchResourceCategories()
        setShowResourceModal(false)
        setEditingResource(null)
        setResourceForm({ title: '', description: '', categoryId: '', tags: '', isTemplate: false })
        setPendingFiles([])
      } else {
        const err = await res.json()
        alert(`Failed to save resource: ${err.error}${err.details ? ' - ' + err.details : ''}`)
      }
    } catch (err) {
      alert('Failed to save resource: Network error')
    } finally {
      setSaving(false)
      setUploadingFiles(false)
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

  // Download file with correct name
  const downloadFile = (attachment: Attachment) => {
    if (attachment.url.startsWith('data:')) {
      // Convert base64 to blob
      const [header, base64] = attachment.url.split(',')
      const mimeMatch = header.match(/data:([^;]+)/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
      
      const byteCharacters = atob(base64)
      const byteArrays = []
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      
      const blob = new Blob(byteArrays, { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      const link = document.createElement('a')
      link.href = attachment.url
      link.download = attachment.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="w-full max-w-md relative z-10 animate-scale-in">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
            
            <CardHeader className="text-center pb-2 relative">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                ECI CRM
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                Enterprise Customer Intelligence
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4 relative">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input type="email" placeholder="Enter your email" value={email} 
                      onChange={(e) => setEmail(e.target.value)} required 
                      className="h-12 pl-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" 
                      value={password} onChange={(e) => setPassword(e.target.value)} required 
                      className="h-12 pr-10 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                    <Button type="button" variant="ghost" size="sm" 
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40"
                  disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</>) : 'Sign In'}
                </Button>
              </form>
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                <p className="text-xs text-center text-amber-700 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Demo: admin@ecicrm.com / password123
                </p>
              </div>
            </CardContent>
            
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 relative">
              <p className="text-xs text-center text-slate-400">
                Built with <span className="text-red-500">❤</span> by <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Irfan Munir</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pattern-bg">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-6 h-6 text-slate-700" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">ECI CRM</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xs">{authData.user.name?.charAt(0) || 'U'}</span>
          </div>
        </div>
      </header>

      {/* Sidebar Backdrop for Mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-transform duration-300 flex flex-col z-50 shadow-2xl shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ECI CRM</span>
              <p className="text-[10px] text-slate-400">Enterprise Intelligence</p>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} 
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'emerald' },
            { id: 'clients', icon: Users, label: 'Clients', color: 'sky' },
            { id: 'proposals', icon: FileText, label: 'Proposals', color: 'violet' },
            { id: 'tasks', icon: CheckSquare, label: 'Tasks', color: 'amber' },
            { id: 'reports', icon: BarChart3, label: 'Reports', color: 'rose' },
            { id: 'users', icon: Users, label: 'Users', color: 'teal' },
            { id: 'resources', icon: FolderOpen, label: 'Resources', color: 'orange' },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); if (isMobile) setSidebarOpen(false); }}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                activeTab === item.id 
                  ? `bg-gradient-to-r from-${item.color}-500/20 to-${item.color}-600/10 text-white border border-${item.color}-500/30` 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}>
              <div className={`p-2 rounded-lg transition-all ${
                activeTab === item.id 
                  ? `bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 shadow-lg shadow-${item.color}-500/30` 
                  : 'bg-slate-700/50'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-bold text-sm">{authData.user.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{authData.user.name}</p>
              <p className="text-xs text-slate-400 truncate">{authData.user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} 
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-72 pt-16 lg:pt-0 overflow-x-hidden w-full">
        <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden w-full box-border">
          {dataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                <div className="absolute inset-0 blur-xl bg-emerald-500/30 rounded-full animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Dashboard Overview
                      </h1>
                      <p className="text-slate-500 mt-1">Welcome back, {authData.user.name}!</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAllData}
                      className="border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all w-full sm:w-auto">
                      <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="stat-card card-hover border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Proposals</p>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{dashboardStats.totalProposals}</p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs font-medium">Active pipeline</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0">
                            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="stat-card card-hover border-0 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Value (PKR)</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate">{formatCurrency(dashboardStats.totalValuePKR)}</p>
                            <div className="flex items-center gap-1 mt-2 text-amber-600">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs font-medium">Pipeline value</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30 shrink-0">
                            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="stat-card card-hover border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Won Value (PKR)</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 truncate">{formatCurrency(dashboardStats.wonValuePKR)}</p>
                            <div className="flex items-center gap-1 mt-2 text-emerald-600">
                              <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs font-medium">Revenue won</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0">
                            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="stat-card card-hover border-0 shadow-lg shadow-violet-500/5 bg-gradient-to-br from-white to-violet-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Win Rate</p>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{dashboardStats.winRate}%</p>
                            <div className="flex items-center gap-1 mt-2 text-violet-600">
                              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="text-xs font-medium">Success rate</span>
                            </div>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30 shrink-0">
                            <PieChart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Second Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Card className="card-hover border-0 shadow-lg shadow-sky-500/5 bg-gradient-to-br from-white to-sky-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Total Clients</p>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{dashboardStats.totalClients}</p>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/30 shrink-0">
                            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="card-hover border-0 shadow-lg shadow-orange-500/5 bg-gradient-to-br from-white to-orange-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Pending Tasks</p>
                            <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{dashboardStats.pendingTasks}</p>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/30 shrink-0">
                            <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="card-hover border-0 shadow-lg shadow-red-500/5 bg-gradient-to-br from-white to-red-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Overdue Tasks</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{dashboardStats.overdueTasks}</p>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-500/30 shrink-0">
                            <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="card-hover border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Accepted</p>
                            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{dashboardStats.acceptedProposals}</p>
                          </div>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0">
                            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50 overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          Proposals by Stage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          {[
                            { label: 'New', count: proposals.filter(p => p.stage === 'NEW').length, color: 'sky' },
                            { label: 'Draft', count: proposals.filter(p => p.stage === 'DRAFT').length, color: 'slate' },
                            { label: 'In Progress', count: proposals.filter(p => p.stage === 'IN_PROGRESS').length, color: 'amber' },
                            { label: 'Submitted', count: proposals.filter(p => p.stage === 'SUBMITTED').length, color: 'violet' },
                            { label: 'Evaluation', count: proposals.filter(p => p.stage === 'UNDER_EVALUATION').length, color: 'orange' },
                            { label: 'Accepted', count: proposals.filter(p => p.stage === 'ACCEPTED').length, color: 'emerald' },
                          ].map(item => (
                            <div key={item.label} className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-slate-200 transition-all">
                              <p className="text-xl sm:text-2xl font-bold text-slate-800">{item.count}</p>
                              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50 overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                          Recent Proposals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                          {proposals.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:border-emerald-200 transition-all">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{p.title}</p>
                                <p className="text-xs text-slate-500 truncate">{p.contact?.company || 'No client'}</p>
                              </div>
                              <Badge className={`${stageColors[p.stage] || 'bg-slate-100'} text-[10px] sm:text-xs shrink-0`}>{p.stage}</Badge>
                            </div>
                          ))}
                          {proposals.length === 0 && (
                            <p className="text-slate-500 text-center py-8">No proposals yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Clients Tab */}
              {activeTab === 'clients' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Clients
                      </h1>
                      <p className="text-slate-500 mt-1">Manage your client relationships</p>
                    </div>
                    <Button onClick={() => {
                      setEditingClient(null)
                      setClientForm({ name: '', email: '', phone: '', company: '', position: '', sector: '', status: 'LEAD', source: '', notes: '', rfpNumber: '', website: '', address: '' })
                      setShowClientModal(true)
                    }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Client
                    </Button>
                  </div>
                  
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input placeholder="Search clients..." value={clientSearch} 
                      onChange={(e) => setClientSearch(e.target.value)} 
                      className="pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredClients.map(client => (
                      <Card key={client.id} className="card-hover border-0 shadow-lg bg-gradient-to-r from-white to-slate-50/50">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">{client.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-base sm:text-lg truncate">{client.name}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                  {client.company && <span className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{client.company}</span></span>}
                                  {client.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{client.email}</span></span>}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {client.sector && (
                                    <Badge variant="outline" className="border-slate-200 text-xs">{client.sector}</Badge>
                                  )}
                                  <Badge className={`${statusColors[client.status] || 'bg-slate-100'} text-xs`}>{client.status}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
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
                              }} className="hover:bg-slate-100">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)} 
                                className="hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredClients.length === 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No clients found</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Proposals Tab */}
              {activeTab === 'proposals' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Proposals
                      </h1>
                      <p className="text-slate-500 mt-1">Track and manage your proposals</p>
                    </div>
                    <Button onClick={() => {
                      setEditingProposal(null)
                      setProposalForm({ title: '', description: '', rfpNumber: '', valuePKR: 0, valueUSD: 0, currency: 'PKR', status: 'DRAFT', stage: 'NEW', submissionDate: '', deadline: '', submissionMethod: '', ownerId: '', assigneeId: '', contactId: '', internalRemarks: '', externalRemarks: '', sector: '' })
                      setShowProposalModal(true)
                    }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Proposal
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input placeholder="Search proposals..." value={proposalSearch} 
                        onChange={(e) => setProposalSearch(e.target.value)} 
                        className="pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                    </div>
                    <Select value={proposalFilter} onValueChange={setProposalFilter}>
                      <SelectTrigger className="w-full sm:w-48 h-12 border-slate-200">
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
                  
                  <div className="grid gap-4">
                    {filteredProposals.map(proposal => (
                      <Card key={proposal.id} className="card-hover border-0 shadow-lg bg-gradient-to-r from-white to-slate-50/50">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-800 text-base sm:text-lg">{proposal.title}</p>
                                <Badge className={`${stageColors[proposal.stage] || 'bg-slate-100'} text-xs`}>{proposal.stage}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500">
                                {proposal.contact?.company && <span className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{proposal.contact.company}</span></span>}
                                {proposal.rfpNumber && <span className="flex items-center gap-1 truncate"><FileText className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{proposal.rfpNumber}</span></span>}
                                {proposal.valuePKR > 0 && <span className="flex items-center gap-1 text-emerald-600 font-medium"><DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />{formatCurrency(proposal.valuePKR)}</span>}
                              </div>
                              {proposal.deadline && (
                                <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-amber-600">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Deadline: {formatDate(proposal.deadline)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingProposal(proposal)
                                setProposalForm({
                                  title: proposal.title, description: proposal.description || '',
                                  rfpNumber: proposal.rfpNumber || '', valuePKR: proposal.valuePKR,
                                  valueUSD: proposal.valueUSD, currency: proposal.currency,
                                  status: proposal.status, stage: proposal.stage,
                                  submissionDate: proposal.submissionDate?.split('T')[0] || '',
                                  deadline: proposal.deadline?.split('T')[0] || '',
                                  submissionMethod: proposal.submissionMethod || '',
                                  ownerId: proposal.owner?.id || '', assigneeId: proposal.assignee?.id || '',
                                  contactId: proposal.contact?.id || '',
                                  internalRemarks: proposal.internalRemarks || '',
                                  externalRemarks: proposal.externalRemarks || '',
                                  sector: proposal.sector || ''
                                })
                                setShowProposalModal(true)
                              }} className="hover:bg-slate-100">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteProposal(proposal.id)} 
                                className="hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredProposals.length === 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No proposals found</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Tasks Tab */}
              {activeTab === 'tasks' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Tasks
                      </h1>
                      <p className="text-slate-500 mt-1">Manage your team's tasks</p>
                    </div>
                    <Button onClick={() => {
                      setEditingTask(null)
                      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '', proposalId: '' })
                      setShowTaskModal(true)
                    }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Task
                    </Button>
                  </div>
                  
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input placeholder="Search tasks..." value={taskSearch} 
                      onChange={(e) => setTaskSearch(e.target.value)} 
                      className="pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                  </div>
                  
                  <div className="grid gap-4">
                    {filteredTasks.map(task => (
                      <Card key={task.id} className="card-hover border-0 shadow-lg bg-gradient-to-r from-white to-slate-50/50">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                task.status === 'COMPLETED' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                task.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-sky-500 to-blue-600' :
                                'bg-gradient-to-br from-slate-400 to-slate-500'
                              } shadow-lg`}>
                                <CheckSquare className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm sm:text-base">{task.title}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                  {task.assignee && <span className="flex items-center gap-1"><Users className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{task.assignee.name}</span></span>}
                                  {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />{formatDate(task.dueDate)}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                              <Badge className={`${taskStatusColors[task.status] || 'bg-slate-100'} text-xs`}>{task.status}</Badge>
                              <Badge className={`${priorityColors[task.priority] || 'bg-slate-100'} text-xs`}>{task.priority}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingTask(task)
                                setTaskForm({
                                  title: task.title, description: task.description || '',
                                  status: task.status, priority: task.priority,
                                  dueDate: task.dueDate?.split('T')[0] || '',
                                  assigneeId: task.assignee?.id || '', proposalId: task.proposal?.id || ''
                                })
                                setShowTaskModal(true)
                              }} className="hover:bg-slate-100">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} 
                                className="hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredTasks.length === 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No tasks found</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Reports
                    </h1>
                    <p className="text-slate-500 mt-1">Generate insightful reports</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                    <Select value={activeReportType} onValueChange={setActiveReportType}>
                      <SelectTrigger className="w-full sm:w-48 h-12 border-slate-200">
                        <SelectValue placeholder="Report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proposals">Proposal Reports</SelectItem>
                        <SelectItem value="staff">Staff Reports</SelectItem>
                        <SelectItem value="clients">Client Reports</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="w-full sm:w-48 h-12 border-slate-200">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reportYear} onValueChange={setReportYear}>
                      <SelectTrigger className="w-full sm:w-36 h-12 border-slate-200">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2023, 2022, 2021].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchReportData} disabled={loadingReport}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                      {loadingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                      Generate Report
                    </Button>
                  </div>
                  
                  {reportData && (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="w-5 h-5 text-emerald-500" />
                          Report Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs sm:text-sm text-slate-600 overflow-auto max-h-96 p-4 bg-slate-50 rounded-xl">
                          {JSON.stringify(reportData, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Users
                      </h1>
                      <p className="text-slate-500 mt-1">Manage team members</p>
                    </div>
                    <Button onClick={() => {
                      setEditingUser(null)
                      setUserForm({ name: '', email: '', password: '', role: 'VIEWER', department: '', phone: '' })
                      setShowUserModal(true)
                    }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {users.map(user => (
                      <Card key={user.id} className="card-hover border-0 shadow-lg bg-gradient-to-r from-white to-slate-50/50">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">{user.name.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-base sm:text-lg">{user.name}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                  <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{user.email}</span></span>
                                  {user.department && <span className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /><span className="truncate">{user.department}</span></span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <Badge variant="outline" className="border-slate-200 text-xs">{user.role}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingUser(user)
                                setUserForm({
                                  name: user.name, email: user.email, password: '',
                                  role: user.role, department: user.department || '', phone: ''
                                })
                                setShowUserModal(true)
                              }} className="hover:bg-slate-100">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} 
                                className="hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {users.length === 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No users found</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Resource Materials
                      </h1>
                      <p className="text-slate-500 mt-1">Manage documents and templates</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={() => {
                        setCategoryForm({ name: '', slug: '', description: '' })
                        setShowCategoryModal(true)
                      }} className="border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                      </Button>
                      <Button onClick={() => {
                        setEditingResource(null)
                        setResourceForm({ title: '', description: '', categoryId: '', tags: '', isTemplate: false })
                        setPendingFiles([])
                        setShowResourceModal(true)
                      }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 w-full sm:w-auto">
                        <Upload className="w-4 h-4 mr-2" /> Add Resource
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input placeholder="Search resources..." value={resourceSearch} 
                      onChange={(e) => setResourceSearch(e.target.value)} 
                      className="pl-12 h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                  </div>
                  
                  {/* Categories with Resources */}
                  <div className="grid gap-6">
                    {resourceCategories.map(category => {
                      const categoryMaterials = filteredResources.filter(m => m.categoryId === category.id)
                      return (
                        <Card key={category.id} className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/50 overflow-hidden">
                          <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                                  <FolderOpen className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <CardTitle className="text-base sm:text-lg truncate">{category.name}</CardTitle>
                                  {category.description && (
                                    <CardDescription className="text-xs sm:text-sm truncate">{category.description}</CardDescription>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-slate-100 text-xs shrink-0">{categoryMaterials.length} items</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-5">
                            {categoryMaterials.length > 0 ? (
                              <div className="grid gap-4">
                                {categoryMaterials.map(material => (
                                  <div key={material.id} className="p-3 sm:p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/50 hover:border-emerald-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                                          material.isTemplate 
                                            ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/30' 
                                            : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'
                                        }`}>
                                          {material.isTemplate ? <Star className="w-5 h-5 text-white" /> : <File className="w-5 h-5 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-800 text-sm sm:text-base">{material.title}</p>
                                          {material.description && (
                                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{material.description}</p>
                                          )}
                                          {material.tags && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {material.tags.split(',').map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] sm:text-xs border-slate-200">{tag.trim()}</Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                                        {material.isTemplate && <Badge className="bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 text-xs">Template</Badge>}
                                        <Button variant="ghost" size="sm" onClick={() => {
                                          setEditingResource(material)
                                          setResourceForm({
                                            title: material.title,
                                            description: material.description || '',
                                            categoryId: material.categoryId,
                                            tags: material.tags || '',
                                            isTemplate: material.isTemplate
                                          })
                                          setPendingFiles([])
                                          setShowResourceModal(true)
                                        }} className="hover:bg-slate-100">
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteResource(material.id)} 
                                          className="hover:bg-red-50 hover:text-red-600">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    {/* Attachments Section */}
                                    {material.attachments && material.attachments.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-3 font-medium flex items-center gap-1">
                                          <FileCheck className="w-4 h-4" />
                                          Attached Files ({material.attachments.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {material.attachments.map(attachment => (
                                            <div key={attachment.id} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 text-sm hover:shadow-md transition-all">
                                              <File className="w-4 h-4 text-emerald-500" />
                                              <span className="truncate max-w-[120px] font-medium text-slate-700" title={attachment.originalName}>
                                                {attachment.originalName}
                                              </span>
                                              <span className="text-xs text-slate-400">
                                                ({formatFileSize(attachment.size)})
                                              </span>
                                              <div className="flex gap-1 ml-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                                  onClick={() => {
                                                    if (attachment.url.startsWith('data:')) {
                                                      const win = window.open()
                                                      if (win) {
                                                        win.document.write(`<iframe src="${attachment.url}" style="width:100%;height:100%;border:none;"></iframe>`)
                                                      }
                                                    } else {
                                                      window.open(attachment.url, '_blank')
                                                    }
                                                  }}
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                                  onClick={() => downloadFile(attachment)}
                                                >
                                                  <Download className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 text-center py-8">No materials in this category</p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                    {resourceCategories.length === 0 && (
                      <Card className="border-0 shadow-xl">
                        <CardContent className="p-12 text-center">
                          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No categories found. Create a category first to add resources.</p>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={clientForm.company} onChange={(e) => setClientForm({...clientForm, company: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input value={clientForm.position} onChange={(e) => setClientForm({...clientForm, position: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={clientForm.sector} onValueChange={(v) => setClientForm({...clientForm, sector: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select sector" /></SelectTrigger>
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
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select status" /></SelectTrigger>
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
              <Select value={clientForm.source} onValueChange={(v) => setClientForm({...clientForm, source: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="RFP">RFP</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={clientForm.website} onChange={(e) => setClientForm({...clientForm, website: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>RFP Number</Label>
              <Input value={clientForm.rfpNumber} onChange={(e) => setClientForm({...clientForm, rfpNumber: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={clientForm.notes} onChange={(e) => setClientForm({...clientForm, notes: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientModal(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingClient ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingProposal ? 'Edit Proposal' : 'Add Proposal'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input value={proposalForm.title} onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={proposalForm.description} onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>RFP Number</Label>
              <Input value={proposalForm.rfpNumber} onChange={(e) => setProposalForm({...proposalForm, rfpNumber: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={proposalForm.sector} onValueChange={(v) => setProposalForm({...proposalForm, sector: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select sector" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Banking">Banking</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value (PKR)</Label>
              <Input type="number" value={proposalForm.valuePKR} onChange={(e) => setProposalForm({...proposalForm, valuePKR: parseFloat(e.target.value) || 0})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Value (USD)</Label>
              <Input type="number" value={proposalForm.valueUSD} onChange={(e) => setProposalForm({...proposalForm, valueUSD: parseFloat(e.target.value) || 0})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={proposalForm.contactId} onValueChange={(v) => setProposalForm({...proposalForm, contactId: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={proposalForm.stage} onValueChange={(v) => setProposalForm({...proposalForm, stage: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select stage" /></SelectTrigger>
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
              <Label>Submission Date</Label>
              <Input type="date" value={proposalForm.submissionDate} onChange={(e) => setProposalForm({...proposalForm, submissionDate: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={proposalForm.deadline} onChange={(e) => setProposalForm({...proposalForm, deadline: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Internal Remarks</Label>
              <Textarea value={proposalForm.internalRemarks} onChange={(e) => setProposalForm({...proposalForm, internalRemarks: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>External Remarks</Label>
              <Textarea value={proposalForm.externalRemarks} onChange={(e) => setProposalForm({...proposalForm, externalRemarks: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProposal} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProposal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Assignee *</Label>
              <Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm({...taskForm, assigneeId: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select assignee" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({...taskForm, status: v})}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select status" /></SelectTrigger>
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
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select priority" /></SelectTrigger>
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
              <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <Input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select role" /></SelectTrigger>
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
                <Input value={userForm.department} onChange={(e) => setUserForm({...userForm, department: e.target.value})} 
                  className="border-slate-200 focus:border-emerald-500" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Modal */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="max-w-xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={resourceForm.title} onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={resourceForm.description} onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={resourceForm.categoryId} onValueChange={(v) => setResourceForm({...resourceForm, categoryId: v})}>
                <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {resourceCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={resourceForm.tags} onChange={(e) => setResourceForm({...resourceForm, tags: e.target.value})} 
                placeholder="template, guide, reference" className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Upload Files</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) {
                      setPendingFiles(prev => [...prev, ...files])
                    }
                    e.target.value = ''
                  }}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to select files</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS, Images (max 4MB each)</p>
                </label>
              </div>
              {pendingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Files to upload ({pendingFiles.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-100 text-sm">
                        <File className="w-4 h-4 text-sky-500" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <span className="text-xs text-slate-400">({formatFileSize(file.size)})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                          onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {editingResource?.attachments && editingResource.attachments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-2">Existing Files</p>
                  <div className="flex flex-wrap gap-2">
                    {editingResource.attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100 text-sm">
                        <File className="w-4 h-4 text-emerald-500" />
                        <span className="truncate max-w-[100px]">{attachment.originalName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100">
              <input type="checkbox" id="isTemplate" checked={resourceForm.isTemplate} onChange={(e) => setResourceForm({...resourceForm, isTemplate: e.target.checked})} className="rounded border-slate-300" />
              <Label htmlFor="isTemplate" className="cursor-pointer font-medium text-slate-700">Mark as Template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPendingFiles([])
              setShowResourceModal(false)
            }}>Cancel</Button>
            <Button onClick={handleSaveResource} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploadingFiles ? 'Uploading...' : (editingResource ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Resource Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} 
                className="border-slate-200 focus:border-emerald-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
