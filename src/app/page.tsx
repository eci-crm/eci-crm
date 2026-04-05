'use client'

import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Building2, Eye, EyeOff, Loader2, Users, FileText,
  CheckSquare, BarChart3, Plus, Edit, Trash2,
  Search, DollarSign, TrendingUp, AlertCircle, FolderOpen,
  Calendar, Download, RefreshCw, Upload, File,
  ArrowUpRight, Target, Award, Clock, Sparkles,
  Briefcase, Globe, Mail, ChevronRight, ArrowRight,
  TrendingDown, Minus, Activity, MoreHorizontal
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

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

function formatShortCurrency(amount: number): string {
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
  return amount.toString()
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

// Premium refined status colors
const statusColors: Record<string, string> = {
  LEAD: 'badge-info',
  PROSPECT: 'badge-primary',
  CLIENT: 'badge-success',
  CUSTOMER: 'badge-success',
  INACTIVE: 'badge-neutral',
}

const stageColors: Record<string, string> = {
  NEW: 'badge-info',
  DRAFT: 'badge-neutral',
  IN_PROGRESS: 'badge-warning',
  SUBMITTED: 'badge-primary',
  UNDER_EVALUATION: 'badge-warning',
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-error',
}

const stageProgressColors: Record<string, string> = {
  NEW: '#0284c7',
  DRAFT: '#737373',
  IN_PROGRESS: '#d97706',
  SUBMITTED: '#0d9488',
  UNDER_EVALUATION: '#ea580c',
  ACCEPTED: '#059669',
  REJECTED: '#dc2626',
}

const taskStatusColors: Record<string, string> = {
  TODO: 'badge-neutral',
  IN_PROGRESS: 'badge-info',
  COMPLETED: 'badge-success',
}

const priorityColors: Record<string, string> = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  URGENT: 'badge-error',
}

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authData, setAuthData] = useState<{ user: User } | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  
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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Login screen
  if (!authData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)] text-white mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">ECI CRM</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Enterprise Customer Intelligence</p>
          </div>
          
          <div className="card-premium p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--error-bg)] text-[var(--error-text)] text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--text-secondary)]">Email</Label>
                <Input type="email" placeholder="Enter your email" value={email} 
                  onChange={(e) => setEmail(e.target.value)} required 
                  className="h-9 text-sm border-[var(--border-2)] focus:border-[var(--primary)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--text-secondary)]">Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" 
                    value={password} onChange={(e) => setPassword(e.target.value)} required 
                    className="h-9 text-sm pr-9 border-[var(--border-2)] focus:border-[var(--primary)] rounded-lg" />
                  <Button type="button" variant="ghost" size="sm" 
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-[var(--text-muted)]" /> : <Eye className="h-4 w-4 text-[var(--text-muted)]" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" 
                className="w-full h-9 text-sm font-medium bg-[var(--primary)] hover:bg-[#0f766e] text-white rounded-lg"
                disabled={isLoading}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>) : 'Sign in'}
              </Button>
            </form>
            <div className="mt-4 p-2.5 rounded-lg bg-[var(--surface-2)]">
              <p className="text-xs text-center text-[var(--text-tertiary)]">
                Demo: admin@ecicrm.com / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Proposal stages for the widget
  const proposalStages = [
    { key: 'NEW', label: 'New', count: proposals.filter(p => p.stage === 'NEW').length },
    { key: 'DRAFT', label: 'Draft', count: proposals.filter(p => p.stage === 'DRAFT').length },
    { key: 'IN_PROGRESS', label: 'In Progress', count: proposals.filter(p => p.stage === 'IN_PROGRESS').length },
    { key: 'SUBMITTED', label: 'Submitted', count: proposals.filter(p => p.stage === 'SUBMITTED').length },
    { key: 'UNDER_EVALUATION', label: 'Evaluation', count: proposals.filter(p => p.stage === 'UNDER_EVALUATION').length },
    { key: 'ACCEPTED', label: 'Accepted', count: proposals.filter(p => p.stage === 'ACCEPTED').length },
  ]

  // Main Dashboard
  return (
    <DashboardLayout
      user={authData.user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {dataLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <React.Fragment>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              {/* Premium Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-display">
                      {getGreeting()}, {authData.user.name?.split(' ')[0]}
                    </h1>
                    <p className="text-body mt-1">
                      Here's an overview of your proposals and pipeline activity.
                    </p>
                  </div>
                  <button 
                    onClick={fetchAllData}
                    className="btn-ghost hidden sm:flex"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
              
              {/* Premium KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card-metric animate-slide-up stagger-1">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-label">Proposals</span>
                    <div className="metric-icon">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-metric mb-1">{dashboardStats.totalProposals}</div>
                  <div className="text-label-sm">Active in pipeline</div>
                </div>

                <div className="card-metric animate-slide-up stagger-2">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-label">Pipeline Value</span>
                    <div className="metric-icon amber">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-metric mb-1">{formatShortCurrency(dashboardStats.totalValuePKR)}</div>
                  <div className="text-label-sm">Total potential</div>
                </div>

                <div className="card-metric animate-slide-up stagger-3">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-label">Won Revenue</span>
                    <div className="metric-icon emerald">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-metric mb-1" style={{ color: 'var(--success)' }}>{formatShortCurrency(dashboardStats.wonValuePKR)}</div>
                  <div className="text-label-sm">Closed won</div>
                </div>

                <div className="card-metric animate-slide-up stagger-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-label">Win Rate</span>
                    <div className="metric-icon violet">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-metric mb-1">{dashboardStats.winRate}%</div>
                  <div className="text-label-sm">Success ratio</div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="flex flex-wrap gap-2 mb-8">
                <div className="badge-dot success">
                  {dashboardStats.acceptedProposals} Accepted
                </div>
                <div className="badge-dot primary">
                  {dashboardStats.totalClients} Clients
                </div>
                <div className="badge-dot warning">
                  {dashboardStats.pendingTasks} Pending Tasks
                </div>
                {dashboardStats.overdueTasks > 0 && (
                  <div className="badge-dot error">
                    {dashboardStats.overdueTasks} Overdue
                  </div>
                )}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Proposals by Stage - Takes 2 columns */}
                <div className="xl:col-span-2">
                  <div className="card-premium overflow-hidden animate-slide-up stagger-5">
                    <div className="p-5 border-b border-[var(--border-1)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-title-2">Pipeline Stages</h2>
                          <p className="text-body-sm mt-0.5">Distribution across stages</p>
                        </div>
                        <span className="text-label-sm">{proposals.length} total</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        {proposalStages.map((stage) => {
                          const percentage = proposals.length > 0 
                            ? Math.round((stage.count / proposals.length) * 100) 
                            : 0
                          return (
                            <div 
                              key={stage.key}
                              className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-1)] transition-colors cursor-pointer"
                            >
                              <div 
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: stageProgressColors[stage.key] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-[var(--text-primary)]">{stage.label}</span>
                                  <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{stage.count}</span>
                                </div>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-bar-fill"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: stageProgressColors[stage.key]
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs text-[var(--text-muted)] tabular-nums w-8 text-right">
                                {percentage}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Proposals - Takes 3 columns */}
                <div className="xl:col-span-3">
                  <div className="card-premium overflow-hidden animate-slide-up stagger-6">
                    <div className="p-5 border-b border-[var(--border-1)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-title-2">Recent Proposals</h2>
                          <p className="text-body-sm mt-0.5">Latest activity in your pipeline</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('proposals')}
                          className="btn-ghost"
                        >
                          View all
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-[var(--border-1)]">
                      {proposals.slice(0, 5).map((proposal) => (
                        <div 
                          key={proposal.id}
                          className="group flex items-center gap-4 p-4 hover:bg-[var(--surface-1)] transition-colors cursor-pointer"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {proposal.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                              <span className="truncate">{proposal.contact?.company || 'No client'}</span>
                              {proposal.valuePKR > 0 && (
                                <>
                                  <span className="text-[var(--border-2)]">·</span>
                                  <span className="text-[var(--primary)] font-medium">
                                    {formatShortCurrency(proposal.valuePKR)}
                                  </span>
                                </>
                              )}
                              {proposal.deadline && (
                                <>
                                  <span className="text-[var(--border-2)]">·</span>
                                  <span>Due {formatDate(proposal.deadline)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`badge ${stageColors[proposal.stage]}`}>
                            {proposal.stage.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                      {proposals.length === 0 && (
                        <div className="p-8 text-center">
                          <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mb-2">No proposals yet</p>
                          <button 
                            onClick={() => setActiveTab('proposals')}
                            className="text-sm text-[var(--primary)] font-medium hover:underline"
                          >
                            Create your first proposal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-title-1">Clients</h1>
                  <p className="text-body-sm mt-1">Manage your client relationships</p>
                </div>
                <button onClick={() => {
                  setEditingClient(null)
                  setClientForm({ name: '', email: '', phone: '', company: '', position: '', sector: '', status: 'LEAD', source: '', notes: '', rfpNumber: '', website: '', address: '' })
                  setShowClientModal(true)
                }} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Client
                </button>
              </div>
              
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input placeholder="Search clients..." value={clientSearch} 
                  onChange={(e) => setClientSearch(e.target.value)} 
                  className="pl-9 h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              
              <div className="space-y-2">
                {filteredClients.map(client => (
                  <div key={client.id} className="card-premium p-4 hover:border-[var(--border-2)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center text-[var(--primary)] font-semibold text-sm shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">{client.name}</div>
                          <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                            {client.company && <span>{client.company}</span>}
                            {client.company && client.email && <span className="mx-1.5">·</span>}
                            {client.email && <span>{client.email}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {client.sector && (
                              <span className="badge badge-neutral">{client.sector}</span>
                            )}
                            <span className={`badge ${statusColors[client.status]}`}>{client.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => {
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
                        }} className="btn-icon">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClient(client.id)} className="btn-icon hover:bg-[var(--error-bg)] hover:text-[var(--error-text)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredClients.length === 0 && (
                  <div className="card-premium p-12 text-center">
                    <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No clients found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-title-1">Proposals</h1>
                  <p className="text-body-sm mt-1">Track and manage your proposals</p>
                </div>
                <button onClick={() => {
                  setEditingProposal(null)
                  setProposalForm({ title: '', description: '', rfpNumber: '', valuePKR: 0, valueUSD: 0, currency: 'PKR', status: 'DRAFT', stage: 'NEW', submissionDate: '', deadline: '', submissionMethod: '', ownerId: '', assigneeId: '', contactId: '', internalRemarks: '', externalRemarks: '', sector: '' })
                  setShowProposalModal(true)
                }} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Proposal
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input placeholder="Search proposals..." value={proposalSearch} 
                    onChange={(e) => setProposalSearch(e.target.value)} 
                    className="pl-9 h-9 text-sm border-[var(--border-2)] rounded-lg" />
                </div>
                <Select value={proposalFilter} onValueChange={setProposalFilter}>
                  <SelectTrigger className="w-40 h-9 text-sm border-[var(--border-2)] rounded-lg">
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
              
              <div className="space-y-2">
                {filteredProposals.map(proposal => (
                  <div key={proposal.id} className="card-premium p-4 hover:border-[var(--border-2)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{proposal.title}</span>
                          <span className={`badge ${stageColors[proposal.stage]}`}>{proposal.stage.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-tertiary)]">
                          {proposal.contact?.company && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{proposal.contact.company}</span>}
                          {proposal.rfpNumber && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{proposal.rfpNumber}</span>}
                          {proposal.valuePKR > 0 && <span className="text-[var(--primary)] font-medium">{formatCurrency(proposal.valuePKR)}</span>}
                        </div>
                        {proposal.deadline && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--warning-text)]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Deadline: {formatDate(proposal.deadline)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => {
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
                        }} className="btn-icon">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProposal(proposal.id)} className="btn-icon hover:bg-[var(--error-bg)] hover:text-[var(--error-text)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProposals.length === 0 && (
                  <div className="card-premium p-12 text-center">
                    <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No proposals found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-title-1">Tasks</h1>
                  <p className="text-body-sm mt-1">Manage your team's tasks</p>
                </div>
                <button onClick={() => {
                  setEditingTask(null)
                  setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '', proposalId: '' })
                  setShowTaskModal(true)
                }} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </div>
              
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input placeholder="Search tasks..." value={taskSearch} 
                  onChange={(e) => setTaskSearch(e.target.value)} 
                  className="pl-9 h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <div key={task.id} className="card-premium p-4 hover:border-[var(--border-2)] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          task.status === 'COMPLETED' ? 'bg-[var(--success-bg)] text-[var(--success)]' :
                          task.status === 'IN_PROGRESS' ? 'bg-[var(--info-bg)] text-[var(--info)]' :
                          'bg-[var(--surface-2)] text-[var(--text-muted)]'
                        }`}>
                          <CheckSquare className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{task.title}</span>
                          <div className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2">
                            {task.assignee && <span>{task.assignee.name}</span>}
                            {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge ${taskStatusColors[task.status]}`}>{task.status}</span>
                        <span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span>
                        <button onClick={() => {
                          setEditingTask(task)
                          setTaskForm({
                            title: task.title, description: task.description || '',
                            status: task.status, priority: task.priority,
                            dueDate: task.dueDate?.split('T')[0] || '',
                            assigneeId: task.assignee?.id || '', proposalId: task.proposal?.id || ''
                          })
                          setShowTaskModal(true)
                        }} className="btn-icon">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="btn-icon hover:bg-[var(--error-bg)] hover:text-[var(--error-text)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="card-premium p-12 text-center">
                    <CheckSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No tasks found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h1 className="text-title-1">Reports</h1>
                <p className="text-body-sm mt-1">Generate insightful reports</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={activeReportType} onValueChange={setActiveReportType}>
                  <SelectTrigger className="w-40 h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposals">Proposal Reports</SelectItem>
                    <SelectItem value="staff">Staff Reports</SelectItem>
                    <SelectItem value="clients">Client Reports</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-32 h-9 text-sm border-[var(--border-2)] rounded-lg">
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
                  <SelectTrigger className="w-28 h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2023, 2022, 2021].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={fetchReportData} disabled={loadingReport} className="btn-primary">
                  {loadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  Generate
                </button>
              </div>
              
              {reportData && (
                <div className="card-premium">
                  <div className="p-5 border-b border-[var(--border-1)]">
                    <h2 className="text-title-2">Report Results</h2>
                  </div>
                  <div className="p-5">
                    <pre className="text-xs text-[var(--text-secondary)] overflow-auto max-h-96 p-4 bg-[var(--surface-1)] rounded-lg">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-title-1">Users</h1>
                  <p className="text-body-sm mt-1">Manage team members</p>
                </div>
                <button onClick={() => {
                  setEditingUser(null)
                  setUserForm({ name: '', email: '', password: '', role: 'VIEWER', department: '', phone: '' })
                  setShowUserModal(true)
                }} className="btn-primary">
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>
              
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="card-premium p-4 hover:border-[var(--border-2)] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center text-[var(--primary)] font-semibold text-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{user.name}</span>
                          <div className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center gap-2">
                            <span>{user.email}</span>
                            {user.department && <><span className="text-[var(--border-2)]">·</span><span>{user.department}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge badge-neutral">{user.role}</span>
                        <button onClick={() => {
                          setEditingUser(user)
                          setUserForm({
                            name: user.name, email: user.email, password: '',
                            role: user.role, department: user.department || '', phone: ''
                          })
                          setShowUserModal(true)
                        }} className="btn-icon">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="btn-icon hover:bg-[var(--error-bg)] hover:text-[var(--error-text)]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="card-premium p-12 text-center">
                    <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-title-1">Resource Materials</h1>
                  <p className="text-body-sm mt-1">Manage documents and templates</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setCategoryForm({ name: '', slug: '', description: '' })
                    setShowCategoryModal(true)
                  }} className="btn-secondary">
                    <Plus className="w-4 h-4" /> Category
                  </button>
                  <button onClick={() => {
                    setEditingResource(null)
                    setResourceForm({ title: '', description: '', categoryId: '', tags: '', isTemplate: false })
                    setPendingFiles([])
                    setShowResourceModal(true)
                  }} className="btn-primary">
                    <Upload className="w-4 h-4" /> Add Resource
                  </button>
                </div>
              </div>
              
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <Input placeholder="Search resources..." value={resourceSearch} 
                  onChange={(e) => setResourceSearch(e.target.value)} 
                  className="pl-9 h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              
              <div className="space-y-4">
                {resourceCategories.map(category => {
                  const categoryMaterials = filteredResources.filter(m => m.categoryId === category.id)
                  return (
                    <div key={category.id} className="card-premium overflow-hidden">
                      <div className="p-4 border-b border-[var(--border-1)] bg-[var(--surface-1)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--warning-bg)] flex items-center justify-center shrink-0">
                              <FolderOpen className="w-4 h-4 text-[var(--warning)]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-[var(--text-primary)]">{category.name}</span>
                              {category.description && (
                                <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="badge badge-neutral">{categoryMaterials.length}</span>
                        </div>
                      </div>
                      <div className="p-3">
                        {categoryMaterials.length > 0 ? (
                          <div className="space-y-1">
                            {categoryMaterials.map(material => (
                              <div key={material.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-1)] transition-colors group">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-md bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                                    <File className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">{material.title}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {material.isTemplate && (
                                        <span className="badge badge-primary text-[10px] h-5">Template</span>
                                      )}
                                      {material.attachments && material.attachments.length > 0 && (
                                        <span className="text-xs text-[var(--text-muted)]">{material.attachments.length} file{material.attachments.length > 1 ? 's' : ''}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => {
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
                                  }} className="btn-icon">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteResource(material.id)} className="btn-icon hover:bg-[var(--error-bg)] hover:text-[var(--error-text)]">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-muted)] text-center py-4">No materials in this category</p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {resourceCategories.length === 0 && (
                  <div className="card-premium p-12 text-center">
                    <FolderOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No categories found. Create a category to start organizing resources.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </React.Fragment>
      )}
      
      {/* Client Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>Fill in the client details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input value={clientForm.name} onChange={(e) => setClientForm({...clientForm, name: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email *</Label>
                <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({...clientForm, email: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phone</Label>
                <Input value={clientForm.phone} onChange={(e) => setClientForm({...clientForm, phone: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Company</Label>
                <Input value={clientForm.company} onChange={(e) => setClientForm({...clientForm, company: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Position</Label>
                <Input value={clientForm.position} onChange={(e) => setClientForm({...clientForm, position: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sector</Label>
                <Select value={clientForm.sector} onValueChange={(v) => setClientForm({...clientForm, sector: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Banking">Banking</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={clientForm.status} onValueChange={(v) => setClientForm({...clientForm, status: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source</Label>
                <Input value={clientForm.source} onChange={(e) => setClientForm({...clientForm, source: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Website</Label>
              <Input value={clientForm.website} onChange={(e) => setClientForm({...clientForm, website: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Address</Label>
              <Textarea value={clientForm.address} onChange={(e) => setClientForm({...clientForm, address: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea value={clientForm.notes} onChange={(e) => setClientForm({...clientForm, notes: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowClientModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveClient} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingProposal ? 'Edit Proposal' : 'Add New Proposal'}</DialogTitle>
            <DialogDescription>Fill in the proposal details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title *</Label>
              <Input value={proposalForm.title} onChange={(e) => setProposalForm({...proposalForm, title: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">RFP Number</Label>
                <Input value={proposalForm.rfpNumber} onChange={(e) => setProposalForm({...proposalForm, rfpNumber: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Client</Label>
                <Select value={proposalForm.contactId} onValueChange={(v) => setProposalForm({...proposalForm, contactId: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Value (PKR)</Label>
                <Input type="number" value={proposalForm.valuePKR || ''} onChange={(e) => setProposalForm({...proposalForm, valuePKR: Number(e.target.value)})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Value (USD)</Label>
                <Input type="number" value={proposalForm.valueUSD || ''} onChange={(e) => setProposalForm({...proposalForm, valueUSD: Number(e.target.value)})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sector</Label>
                <Select value={proposalForm.sector} onValueChange={(v) => setProposalForm({...proposalForm, sector: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Banking">Banking</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Stage</Label>
                <Select value={proposalForm.stage} onValueChange={(v) => setProposalForm({...proposalForm, stage: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Owner</Label>
                <Select value={proposalForm.ownerId} onValueChange={(v) => setProposalForm({...proposalForm, ownerId: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Submission Date</Label>
                <Input type="date" value={proposalForm.submissionDate} onChange={(e) => setProposalForm({...proposalForm, submissionDate: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Deadline</Label>
                <Input type="date" value={proposalForm.deadline} onChange={(e) => setProposalForm({...proposalForm, deadline: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assignee</Label>
                <Select value={proposalForm.assigneeId} onValueChange={(v) => setProposalForm({...proposalForm, assigneeId: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Submission Method</Label>
                <Input value={proposalForm.submissionMethod} onChange={(e) => setProposalForm({...proposalForm, submissionMethod: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={proposalForm.description} onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Internal Remarks</Label>
              <Textarea value={proposalForm.internalRemarks} onChange={(e) => setProposalForm({...proposalForm, internalRemarks: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">External Remarks</Label>
              <Textarea value={proposalForm.externalRemarks} onChange={(e) => setProposalForm({...proposalForm, externalRemarks: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowProposalModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveProposal} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Proposal'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>Fill in the task details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title *</Label>
              <Input value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({...taskForm, status: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assignee *</Label>
              <Select value={taskForm.assigneeId} onValueChange={(v) => setTaskForm({...taskForm, assigneeId: v})}>
                <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Related Proposal</Label>
              <Select value={taskForm.proposalId} onValueChange={(v) => setTaskForm({...taskForm, proposalId: v})}>
                <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                  <SelectValue placeholder="Select proposal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {proposals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Due Date</Label>
              <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveTask} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Task'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>Fill in the user details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email *</Label>
              <Input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password {!editingUser && '*'}</Label>
              <Input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" placeholder={editingUser ? 'Leave blank to keep current' : ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                  <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Department</Label>
                <Input value={userForm.department} onChange={(e) => setUserForm({...userForm, department: e.target.value})} 
                  className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowUserModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveUser} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save User'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Resource Modal */}
      <Dialog open={showResourceModal} onOpenChange={setShowResourceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>Fill in the resource details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title *</Label>
              <Input value={resourceForm.title} onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category *</Label>
              <Select value={resourceForm.categoryId} onValueChange={(v) => setResourceForm({...resourceForm, categoryId: v})}>
                <SelectTrigger className="h-9 text-sm border-[var(--border-2)] rounded-lg">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {resourceCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={resourceForm.description} onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags (comma separated)</Label>
              <Input value={resourceForm.tags} onChange={(e) => setResourceForm({...resourceForm, tags: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isTemplate" checked={resourceForm.isTemplate} 
                onChange={(e) => setResourceForm({...resourceForm, isTemplate: e.target.checked})}
                className="w-4 h-4 rounded border-[var(--border-2)] text-[var(--primary)]" />
              <Label htmlFor="isTemplate" className="text-xs font-medium">Mark as Template</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Files</Label>
              <Input type="file" multiple onChange={(e) => {
                if (e.target.files) {
                  setPendingFiles(Array.from(e.target.files))
                }
              }} className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
              {pendingFiles.length > 0 && (
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowResourceModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveResource} disabled={saving || uploadingFiles} className="btn-primary">
              {saving || uploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {uploadingFiles ? 'Uploading...' : saving ? 'Saving...' : 'Save Resource'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Category</DialogTitle>
            <DialogDescription>Create a new resource category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Slug *</Label>
              <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})} 
                className="h-9 text-sm border-[var(--border-2)] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} 
                className="border-[var(--border-2)] rounded-lg min-h-[80px] text-sm" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowCategoryModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveCategory} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
