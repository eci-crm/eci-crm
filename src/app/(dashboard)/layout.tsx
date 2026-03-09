'use client'

import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-slate-950 overflow-hidden text-slate-900">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Fixed Top Navbar */}
        <Navbar />
        
        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
