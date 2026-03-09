'use client'

import Link from 'next/link';
import { Zap, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimalist Auth Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg transition-all group-hover:rotate-12">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight lg:hidden">ECI CRM</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            SSL Encrypted
          </span>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Subtle Footer */}
      <footer className="p-6 text-center border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} ECI ENTERPRISE SYSTEMS • ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
