"use client"
import Link from 'next/link'
import { ReactNode, useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  PackageSearch, 
  Receipt, 
  FileText, 
  Building2, 
  Briefcase, 
  QrCode, 
  LogOut, 
  Menu, 
  X, 
  BookOpen, 
  ChevronRight,
  PlusCircle,
  Store,
  Layers
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { AnimatePresence, motion } from 'framer-motion'

const primaryNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, mobileLabel: 'Overview' },
  { name: 'Inventory', href: '/inventory', icon: PackageSearch, mobileLabel: 'Stock' },
  { name: 'Billing', href: '/billing', icon: Receipt, mobileLabel: 'Quick Bill', isHighlight: true },
  { name: 'GST Billing', href: '/gst-billing', icon: FileText, mobileLabel: 'GST Tax' },
]

const managementNavItems = [
  { name: 'Purchase Ledger', href: '/purchase-ledger', icon: Building2, desc: 'Supplier & Vendor Accounts' },
  { name: 'B2B Ledger', href: '/b2b-ledger', icon: Briefcase, desc: 'Contractors & Dealers' },
  { name: 'Catalogue Studio', href: '/catalogue', icon: BookOpen, desc: 'Digital Tile Showroom' },
  { name: 'QR Code Studio', href: '/qr-studio', icon: QrCode, desc: 'Tile QR Rack Labels' },
]

const allNavItems = [
  ...primaryNavItems,
  ...managementNavItems
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleNav = () => onClose?.()

  return (
    <div className="flex flex-col h-full relative z-10 select-none">
      {/* Showroom Brand Header */}
      <div 
        className="p-5 text-white flex items-center justify-between relative"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 50%, #8C6D1F 100%)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
            }}
          >
            <span className="drop-shadow-sm font-serif">P</span>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 pointer-events-none" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none text-white drop-shadow-sm">
              Patel Tiles
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#6FCF97] font-extrabold mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FCF97] animate-pulse" />
              Ceramic ERP
            </p>
          </div>
        </div>

        {/* Close button on mobile drawer */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-2 rounded-xl text-white/70 hover:text-white transition-all bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Operations */}
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
            Operations & Counter
          </p>
          <div className="space-y-1">
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={handleNav}>
                  <span 
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold ${
                      isActive 
                        ? 'text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(47,160,132,0.95) 0%, rgba(20,80,68,0.95) 100%)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#6FCF97]' : 'text-white/60 group-hover:text-white'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.isHighlight && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        Counter
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Management & Showroom */}
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
            Ledgers & Showroom
          </p>
          <div className="space-y-1">
            {managementNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={handleNav}>
                  <span 
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold ${
                      isActive 
                        ? 'text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(47,160,132,0.95) 0%, rgba(20,80,68,0.95) 100%)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#6FCF97]' : 'text-white/60 group-hover:text-white'}`} />
                      <span>{item.name}</span>
                    </div>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* User Profile & Sign Out */}
      <div className="p-3 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 mb-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Terminal ID</p>
            <p className="text-xs font-black text-white truncate">Main Counter 01</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        <button
          id="logout-btn"
          onClick={() => { onClose?.(); logout() }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all group font-bold text-xs"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Sign Out Terminal</span>
        </button>
      </div>
    </div>
  )
}

function SidebarLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  // Close overlays on route change
  useEffect(() => { 
    setMobileDrawerOpen(false) 
    setMoreSheetOpen(false)
  }, [pathname])

  // Prevent background scroll when overlays are active
  useEffect(() => {
    if (mobileDrawerOpen || moreSheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileDrawerOpen, moreSheetOpen])

  if (!isAuthenticated || pathname === '/login') {
    return <>{children}</>
  }

  const currentRouteName = allNavItems.find(n => n.href === pathname)?.name ?? 'Overview'

  return (
    <div className="flex h-screen bg-[#F4F7F5] text-[#0F1715] overflow-hidden font-sans">
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex w-64 flex-col z-20 shrink-0 relative overflow-hidden print:hidden"
        style={{
          background: 'linear-gradient(170deg, #0f3d32 0%, #165A4B 45%, #0d332a 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden flex flex-col relative overflow-hidden"
              style={{
                background: 'linear-gradient(170deg, #0f3d32 0%, #165A4B 50%, #0d332a 100%)',
                boxShadow: '8px 0 32px rgba(0,0,0,0.35)',
                borderRight: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              <SidebarContent onClose={() => setMobileDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile "More" Quick Bottom Sheet ── */}
      <AnimatePresence>
        {moreSheetOpen && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreSheetOpen(false)}
              className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="more-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-t border-gray-200 pb-safe"
            >
              {/* Drag handle */}
              <div className="pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-gray-300" />
              </div>

              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#1F6F5F] text-base">Showroom Modules</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Additional ledgers & tools</p>
                </div>
                <button 
                  onClick={() => setMoreSheetOpen(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto">
                {managementNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setMoreSheetOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F6F9F7] hover:bg-[#EAF0EC] border border-gray-200/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1F6F5F] shadow-sm">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-[#0F1715]">{item.name}</p>
                        <p className="text-[10px] font-semibold text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}

                <div className="pt-2">
                  <Link
                    href="/catalogue"
                    onClick={() => setMoreSheetOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#1F6F5F] text-white rounded-xl font-bold text-xs shadow-md"
                  >
                    <Store className="w-4 h-4" />
                    <span>Open Customer Catalogue Screen</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Viewport Container ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 text-white shrink-0 relative print:hidden z-30"
          style={{
            background: 'linear-gradient(135deg, #0f3d32 0%, #165A4B 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.15)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl text-white/90 hover:text-white bg-white/10 transition-all touch-target flex items-center justify-center"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white truncate drop-shadow-sm font-serif">
                  Patel Tiles
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#D4AF37]/25 text-[#F5E5BE] border border-[#D4AF37]/40">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-[#6FCF97] uppercase tracking-wider font-bold">
                {currentRouteName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2FA084] to-[#1F6F5F] text-white text-xs font-black shadow-md border border-white/20 active:scale-95 transition-transform"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Bill</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#F4F7F5] pb-mobile-nav">
          <div className="p-3.5 sm:p-6 md:p-8 min-h-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Navigation Bar (Fixed) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 print:hidden select-none"
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(31, 111, 95, 0.15)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
          }}
        >
          <div className="flex items-center justify-around px-2 pt-2">
            {/* 1. Dashboard */}
            <Link href="/" className="flex flex-col items-center justify-center flex-1 py-1 touch-target">
              <div className={`p-1 rounded-xl transition-all ${pathname === '/' ? 'text-[#1F6F5F] bg-[#1F6F5F]/10 font-bold scale-105' : 'text-gray-400'}`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${pathname === '/' ? 'font-black text-[#1F6F5F]' : 'font-bold text-gray-500'}`}>
                Overview
              </span>
            </Link>

            {/* 2. Inventory */}
            <Link href="/inventory" className="flex flex-col items-center justify-center flex-1 py-1 touch-target">
              <div className={`p-1 rounded-xl transition-all ${pathname === '/inventory' ? 'text-[#1F6F5F] bg-[#1F6F5F]/10 font-bold scale-105' : 'text-gray-400'}`}>
                <PackageSearch className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${pathname === '/inventory' ? 'font-black text-[#1F6F5F]' : 'font-bold text-gray-500'}`}>
                Stock
              </span>
            </Link>

            {/* 3. Center Raised "Quick Bill" Button */}
            <div className="flex flex-col items-center justify-center -mt-5 px-1">
              <Link
                href="/billing"
                className="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #2FA084 0%, #1F6F5F 60%, #124036 100%)',
                  boxShadow: '0 6px 16px rgba(31, 111, 95, 0.45), inset 0 2px 0 rgba(255, 255, 255, 0.4)',
                  border: '3px solid #FFFFFF'
                }}
                aria-label="Create New Bill"
              >
                <Receipt className="w-6 h-6 text-white drop-shadow-sm" />
              </Link>
              <span className="text-[10px] font-black text-[#1F6F5F] mt-1 tracking-tight">
                Billing
              </span>
            </div>

            {/* 4. GST Billing */}
            <Link href="/gst-billing" className="flex flex-col items-center justify-center flex-1 py-1 touch-target">
              <div className={`p-1 rounded-xl transition-all ${pathname === '/gst-billing' ? 'text-[#1F6F5F] bg-[#1F6F5F]/10 font-bold scale-105' : 'text-gray-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${pathname === '/gst-billing' ? 'font-black text-[#1F6F5F]' : 'font-bold text-gray-500'}`}>
                GST Tax
              </span>
            </Link>

            {/* 5. More Sheet Trigger */}
            <button
              onClick={() => setMoreSheetOpen(true)}
              className="flex flex-col items-center justify-center flex-1 py-1 touch-target cursor-pointer"
            >
              <div className={`p-1 rounded-xl transition-all ${moreSheetOpen ? 'text-[#1F6F5F] bg-[#1F6F5F]/10' : 'text-gray-400'}`}>
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 tracking-tight mt-0.5">
                More
              </span>
            </button>
          </div>
        </nav>
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

