import { create } from 'zustand'

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  phone?: string
  department?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
  hydrate: () => void
}

const getStoredAuth = (): { isAuthenticated: boolean; user: User | null } => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }
  try {
    const stored = localStorage.getItem('eci-crm-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      return { isAuthenticated: true, user: parsed.user }
    }
  } catch (e) {
    console.error('Failed to parse stored auth', e)
  }
  return { isAuthenticated: false, user: null }
}

const saveAuth = (user: User | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem('eci-crm-auth', JSON.stringify({ user }))
  } else {
    localStorage.removeItem('eci-crm-auth')
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  user: null,
  login: (user) => {
    saveAuth(user)
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    saveAuth(null)
    set({ isAuthenticated: false, user: null })
  },
  hydrate: () => {
    const stored = getStoredAuth()
    set(stored)
  },
))
