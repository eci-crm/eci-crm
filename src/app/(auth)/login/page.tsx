'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Login failed')

      // Update Zustand Store
      login(data.user)
      
      // Redirect to Dashboard
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Branding/Marketing */}
      <div className="hidden lg:flex w-1/2 bg-primary p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white p-1.5 rounded-lg">
              <Zap className="h-6 w-6 text-primary fill-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ECI CRM</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Close more deals <br /> with intelligence.
          </div>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            The all-in-one platform for sales teams to track contacts, 
            manage proposals, and automate their daily workflow.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-8 border-t border-white/20 pt-8">
          <div>
            <p className="text-3xl font-bold">99%</p>
            <p className="text-sm text-primary-foreground/60">Uptime SLA</p>
          </div>
          <div>
            <p className="text-3xl font-bold">256-bit</p>
            <p className="text-sm text-primary-foreground/60">AES Encryption</p>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your workspace
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Secure, encrypted login session
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
