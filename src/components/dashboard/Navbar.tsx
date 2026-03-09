'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { 
  Search, 
  Bell, 
  LogOut, 
  User as UserIcon,
  Shield,
  Menu
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const onLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Mobile Menu Toggle (Visible only on small screens) */}
      <Button variant="ghost" size="icon" className="lg:hidden mr-2">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          type="search"
          placeholder="Search records (Ctrl + K)"
          className="pl-10 bg-slate-100/50 border-transparent focus:bg-white focus:border-primary/20 transition-all w-[300px]"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="text-slate-500 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-auto flex items-center gap-2 pl-1 pr-2 hover:bg-slate-100 rounded-full transition-colors">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-sm shadow-primary/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold leading-none">{user?.name}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2" align="end">
            <DropdownMenuLabel>Account Management</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer py-2">
              <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2">
              <Shield className="mr-2 h-4 w-4 text-slate-500" />
              <span>Privacy Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer py-2"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
