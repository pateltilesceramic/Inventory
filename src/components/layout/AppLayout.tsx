"use client"
import Link from 'next/link'
import { ReactNode, useState, useEffect } from 'react'
import { LayoutDashboard, PackageSearch, Receipt, FileText, Building2, Briefcase, QrCode, LogOut, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { AnimatePresence, motion } from 'framer-motion'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: PackageSearch },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'GST Billing', href: '/gst-billing', icon: FileText },
  { name: 'Purchase Ledger', href: '/purchase-ledger', icon: Building2 },
  { name: 'B2B Ledger', href: '/b2b-ledger', icon: Briefcase },
  { name: 'QR Code Studio', href: '/qr-studio', icon: QrCode },
]



function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleNav = () => onClose?.()

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Logo */}
      <div className="p-6 text-white flex items-center justify-between relative" style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)'
      }}>
        {/* Top highlight line — skeuomorphic bevel */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div>
          <h1 className="text-xl font-bold tracking-tight drop-shadow-sm">Tiles & Sanitary</h1>
          <p className="text-xs uppercase tracking-wider text-white/60 mt-1 font-medium">Management System</p>
        </div>
        {/* Close button only on mobile */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 rounded-xl text-white/50 hover:text-white transition-all" style={{
            background: 'rgba(255,255,255,0.08)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.15) inset'
          }}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={handleNav}>
              <span className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`} style={isActive ? {
                background: 'linear-gradient(180deg, rgba(47,160,132,0.90) 0%, rgba(31,111,95,0.95) 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 -1px 0 rgba(0,0,0,0.18) inset, 0 4px 12px rgba(0,0,0,0.20)',
                border: '1px solid rgba(255,255,255,0.10)'
              } : {
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.10) inset'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                }
              }}>
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute left-2 w-1 h-4 rounded-full bg-white/60" style={{
                    boxShadow: '0 0 6px rgba(255,255,255,0.60)'
                  }} />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium text-sm">{item.name}</span>
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 py-2 mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Signed in as</p>
          <p className="text-xs font-bold text-white/50 mt-0.5 truncate">Patel Tiles & Ceramic</p>
        </div>
        <button
          id="logout-btn"
          onClick={() => { onClose?.(); logout() }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-red-300 transition-all duration-200 group"
          style={{
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.05) inset'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  )
}

function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex w-64 flex-col z-20 shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a5e50 0%, #1F6F5F 40%, #174f43 100%)',
          boxShadow: '2px 0 20px rgba(0,0,0,0.25), 1px 0 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Noise texture overlay */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }} />
        {/* Top bevel highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-10" />
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            />
            {/* Drawer — Glassmorphism on mobile */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden flex flex-col relative overflow-hidden"
              style={{
                background: 'rgba(20, 70, 60, 0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '4px 0 32px rgba(0,0,0,0.35), 1px 0 0 rgba(255,255,255,0.06)',
                borderRight: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {/* Noise texture */}
              <div className="absolute inset-0 pointer-events-none z-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
                backgroundSize: '150px 150px'
              }} />
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header
          className="md:hidden flex items-center gap-4 px-4 py-3 text-white shrink-0 relative"
          style={{
            background: 'rgba(20, 70, 60, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.20)'
          }}
        >
          {/* Bottom bevel */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent pointer-events-none" />
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-white/70 hover:text-white transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.15) inset'
            }}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <p className="text-sm font-black tracking-tight drop-shadow-sm">Tiles & Sanitary</p>
            <p className="text-[9px] text-white/45 uppercase tracking-widest font-bold">
              {navItems.find(n => n.href === pathname)?.name ?? 'Management System'}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 md:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </AuthProvider>
  )
}
