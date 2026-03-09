export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Top Nav for Auth pages only */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-bold text-xl text-primary lg:hidden">ECI CRM</div>
        <div className="text-sm text-slate-500">
          Need help? <a href="#" className="underline">Support</a>
        </div>
      </nav>
      {children}
    </div>
  )
}
