'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginScreen() {
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              ECI CRM
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Enterprise Customer Intelligence
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-0">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
              <p className="font-medium text-amber-800 dark:text-amber-200">Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                  <p className="font-medium text-amber-700 dark:text-amber-300">Admin</p>
                  <p className="text-slate-600 dark:text-slate-400">admin@crm.com</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                  <p className="font-medium text-amber-700 dark:text-amber-300">Manager</p>
                  <p className="text-slate-600 dark:text-slate-400">manager@crm.com</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                  <p className="font-medium text-amber-700 dark:text-amber-300">Sales Rep</p>
                  <p className="text-slate-600 dark:text-slate-400">sales@crm.com</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                  <p className="font-medium text-amber-700 dark:text-amber-300">Viewer</p>
                  <p className="text-slate-600 dark:text-slate-400">viewer@crm.com</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-2">
                Password: <code className="bg-white/50 dark:bg-black/20 px-1 rounded">password123</code>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                Built by <span className="font-semibold text-amber-700 dark:text-amber-300">Irfan Munir</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
