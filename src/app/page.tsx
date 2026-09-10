"use client"
import { useEffect, useState } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { getDashboardStats } from "@/lib/actions"
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  PieChart, 
  Layers, 
  Receipt, 
  FileText, 
  PlusCircle, 
  BookOpen, 
  ArrowUpRight,
  Boxes,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Store
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [stats, setStats] = useState<any | null>(null)
  
  useEffect(() => {
    getDashboardStats(selectedMonth, selectedYear).then((data) => {
      setStats(data)
    }).catch((err) => {
      console.error("Error fetching dashboard stats:", err)
      setStats({
        totalBoxes: 0,
        tilesStock: 0,
        sanitaryStock: 0,
        stockByCategory: [],
        stockBySize: [],
        categoriesBreakdown: [],
        lowStockItems: [],
        monthlyRevenue: 0,
        monthlyBillsCount: 0
      })
    })
  }, [selectedMonth, selectedYear])

  const getMonthOptions = () => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      const value = `${d.getFullYear()}-${d.getMonth()}`
      options.push({ label, value })
    }
    return options
  }

  if (!stats) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1F6F5F]/20 border-t-[#1F6F5F] rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#1F6F5F] uppercase tracking-widest">Loading Showroom Intelligence...</p>
      </div>
    </div>
  )

  const maxCategoryQty = Math.max(...(stats.categoriesBreakdown || []).map((item: any) => item.quantity), 1)
  const averageTicket = (stats.monthlyBillsCount && stats.monthlyBillsCount > 0)
    ? Math.round((stats.monthlyRevenue || 0) / stats.monthlyBillsCount)
    : 0

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Executive Header & Quick Actions Dock ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest text-[#1F6F5F] uppercase">Live Showroom & Warehouse Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#0F1715] mt-1 font-serif">
            Showroom Executive Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Patel Tiles & Ceramic · Counter Billing, Inventory Control & Sales Register
          </p>
        </div>

        {/* Quick Action Dock */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Link
            href="/billing"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#2FA084] to-[#1F6F5F] text-white text-xs font-black shadow-md active:scale-95 transition-all whitespace-nowrap"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Counter Bill</span>
          </Link>

          <Link
            href="/gst-billing"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-[#0F1715] hover:bg-gray-50 text-xs font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-[#1F6F5F]" />
            <span>+ GST Invoice</span>
          </Link>

          <Link
            href="/catalogue"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-[#0F1715] hover:bg-gray-50 text-xs font-bold shadow-sm active:scale-95 transition-all whitespace-nowrap"
          >
            <Store className="w-4 h-4 text-[#D4AF37]" />
            <span>Catalogue</span>
          </Link>
        </div>
      </div>

      {/* ── Main Showroom KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* 1. Monthly Revenue Slab */}
        <FadeIn delay={0.05}>
          <div 
            className="rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden h-full text-white shadow-xl group"
            style={{
              background: 'linear-gradient(135deg, #0f3d32 0%, #165A4B 60%, #0d332a 100%)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                  <TrendingUp className="w-5 h-5 text-[#6FCF97]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6FCF97]">Monthly Sales Revenue</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-tabular leading-tight mt-0.5">
                    ₹{(stats.monthlyRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/10 my-1">
              <div>
                <p className="text-[9px] font-black uppercase text-white/50">Total Invoices</p>
                <p className="text-sm font-black text-white">{stats.monthlyBillsCount ?? 0} Bills</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-white/50">Avg Order Value</p>
                <p className="text-sm font-black text-white font-tabular">₹{averageTicket.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wide">Period Filter</span>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split("-").map(Number)
                  setSelectedYear(y)
                  setSelectedMonth(m)
                }}
                className="bg-black/30 border border-white/20 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white outline-none cursor-pointer"
              >
                {getMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#165A4B] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FadeIn>

        {/* 2. Total Warehouse Physical Stock */}
        <FadeIn delay={0.1}>
          <div className="ceramic-card p-5 sm:p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1F6F5F]/10 border border-[#1F6F5F]/20 flex items-center justify-center text-[#1F6F5F] shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Live Stock</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#0F1715] font-tabular leading-tight mt-0.5">
                      {(stats.totalBoxes ?? 0).toLocaleString()} <span className="text-xs font-bold text-gray-400">Units</span>
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">Tiles Inventory:</span>
                  <span className="font-black text-[#1F6F5F]">{(stats.tilesStock ?? 0).toLocaleString()} Boxes</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div 
                    className="h-full bg-[#1F6F5F] rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((stats.tilesStock || 0) / Math.max(1, stats.totalBoxes || 1)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-500 font-bold">Sanitary & Fittings:</span>
                  <span className="font-black text-[#2FA084]">{(stats.sanitaryStock ?? 0).toLocaleString()} Pcs</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category Lines</span>
              <span className="text-xs font-black text-[#1F6F5F]">
                {(stats.stockByCategory || []).length} Active Types
              </span>
            </div>
          </div>
        </FadeIn>

        {/* 3. Critical Stock Radar Card */}
        <FadeIn delay={0.15}>
          <div className="ceramic-card p-5 sm:p-6 flex flex-col justify-between h-full sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Alerts</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-red-600 font-tabular leading-tight mt-0.5">
                      {(stats.lowStockItems || []).length} <span className="text-xs font-bold text-red-400 uppercase">Items Low</span>
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  (stats.lowStockItems || []).length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {(stats.lowStockItems || []).length > 0 ? 'Action Needed' : 'Optimal'}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-2 font-medium">
                {(stats.lowStockItems || []).length > 0
                  ? "Items dropped below threshold. Recommended to place factory reorders immediately."
                  : "Warehouse stock levels are currently within safe operational buffers."}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
              <Link 
                href="/inventory"
                className="text-xs font-black text-[#1F6F5F] hover:text-[#2FA084] flex items-center gap-1"
              >
                <span>Review In Inventory</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ── Warehouse Stock by Category (Ceramic Grid) ── */}
      <FadeIn delay={0.2}>
        <div className="ceramic-card p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F6F5F]/10 border border-[#1F6F5F]/20 flex items-center justify-center text-[#1F6F5F]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0F1715] font-serif">
                  Physical Stock by Category
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Live quantities across tile & sanitary product lines
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/inventory"
                className="text-xs font-black text-[#1F6F5F] hover:underline flex items-center gap-1"
              >
                <span>Full Inventory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {(stats.stockByCategory || []).map((entry: any) => (
              <div 
                key={entry.category}
                className="p-3.5 rounded-2xl bg-[#F6F9F7] hover:bg-white border border-gray-200/80 hover:border-[#1F6F5F]/30 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block truncate" title={entry.category}>
                    {entry.category}
                  </span>
                  <p className="text-xl font-black text-[#0F1715] mt-1 font-tabular">
                    {entry.boxes.toLocaleString()}
                  </p>
                </div>
                <span className="text-[9px] font-extrabold text-[#1F6F5F] uppercase mt-2">
                  {entry.unit === 'box' ? 'Boxes' : entry.unit === 'pc' ? 'Pieces' : `${entry.unit}s`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Tile Asset Distribution by Size ── */}
      <FadeIn delay={0.25}>
        <div className="ceramic-card p-5 sm:p-7">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2FA084]/10 border border-[#2FA084]/20 flex items-center justify-center text-[#2FA084]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0F1715] font-serif">
                  Tile Dimensions Breakdown
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Quantities categorized by ceramic slab & tile dimensions
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {(stats.stockBySize || []).filter((entry: any) => entry.size && entry.size !== 'Other').map((entry: any) => (
              <div 
                key={entry.size}
                className="p-3.5 rounded-2xl bg-[#F6F9F7] hover:bg-white border border-gray-200/80 hover:border-[#2FA084]/40 transition-all group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="tile-dim-tag">
                      {entry.size}
                    </span>
                  </div>
                  <p className="text-xl font-black text-[#0F1715] font-tabular mt-1">
                    {entry.boxes.toLocaleString()}
                  </p>
                </div>
                <span className="text-[9px] font-extrabold text-gray-400 uppercase mt-2">
                  {entry.unit === 'box' ? 'Boxes in Yard' : 'Pieces in Stock'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Category Sales Tracker (Chart Format) ── */}
      <FadeIn delay={0.3}>
        <div 
          className="rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0A2E26 0%, #15463B 100%)',
            border: '1px solid rgba(255, 255, 255, 0.10)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-emerald-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#6FCF97]">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-serif">
                  Dispatched Sales by Category
                </h2>
                <p className="text-[10px] font-bold text-emerald-300/60 uppercase tracking-wider">
                  Monthly movement tracker
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-300/80">
              {(stats.categoriesBreakdown || []).length} Product Lines Sold
            </span>
          </div>

          {(!stats.categoriesBreakdown || stats.categoriesBreakdown.length === 0) ? (
            <p className="text-xs text-emerald-200/40 italic py-12 text-center">No sales registered for the selected period.</p>
          ) : (
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <div className="relative h-48 min-w-[500px] w-full flex items-end justify-around pt-6 pb-2 px-3 border-b border-l border-emerald-800/40">
                {(stats.categoriesBreakdown || []).map((item: any) => {
                  const pct = Math.max(8, (item.quantity / maxCategoryQty) * 100)
                  return (
                    <div key={item.category} className="flex flex-col items-center group relative h-full justify-end min-w-[60px] max-w-[85px]">
                      <span className="text-xs font-black text-emerald-300 mb-1 font-tabular">
                        {item.quantity}
                      </span>
                      <div className="w-4.5 bg-emerald-950/60 rounded-full h-[65%] relative overflow-hidden flex flex-col justify-end border border-emerald-800/30">
                        <div 
                          className="w-full bg-gradient-to-t from-[#2FA084] to-[#6FCF97] rounded-full transition-all duration-700 ease-out hover:brightness-110"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-100/80 leading-tight text-center mt-2 uppercase tracking-tight line-clamp-2" title={item.category}>
                        {item.category}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Critical Low Stock Warning Grid ── */}
      {stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <FadeIn delay={0.35}>
          <div className="ceramic-card p-5 sm:p-7 border-red-200">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-red-700 font-serif">
                    Critical Low Stock Radar
                  </h2>
                  <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-wider">
                    Immediate replenishment required
                  </p>
                </div>
              </div>

              <span className="text-xs font-black bg-red-100 text-red-700 px-3 py-1 rounded-full">
                {stats.lowStockItems.length} Warnings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {stats.lowStockItems.map((item: any) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl bg-red-50/50 border border-red-200/80 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[#0F1715] text-sm truncate uppercase" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.size && (
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-gray-600 border border-gray-200">
                          {item.size}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                        {item.type || item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3 border-l border-red-200">
                    <p className="text-xl font-black text-red-600 font-tabular leading-none">
                      {item.stockLevel}
                    </p>
                    <p className="text-[9px] font-black text-red-400 uppercase mt-0.5">
                      {item.unit}s left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}

