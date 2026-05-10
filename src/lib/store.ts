'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CRMStore {
  isAuthenticated: boolean
  user: Record<string, unknown> | null
  currentPage: string
  sidebarOpen: boolean
  login: (user: Record<string, unknown>) => void
  logout: () => void
  setCurrentPage: (page: string) => void
  setSidebarOpen: (open: boolean) => void
}

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      currentPage: 'dashboard',
      sidebarOpen: true,
      login: (user: Record<string, unknown>) =>
        set({ isAuthenticated: true, user }),
      logout: () =>
        set({ isAuthenticated: false, user: null, currentPage: 'dashboard' }),
      setCurrentPage: (page: string) => set({ currentPage: page }),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    }),
    {
      name: 'crm-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        currentPage: state.currentPage,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
