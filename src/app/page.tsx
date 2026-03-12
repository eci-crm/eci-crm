'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
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
  const { isAuthenticated, user, login, logout, hydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    hydrate()
    setMounted(true)
  }, [hydrate])

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

  // Show loading spinner during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  // ... REST OF THE FILE STAYS THE SAME (from "Login Screen" onwards)
