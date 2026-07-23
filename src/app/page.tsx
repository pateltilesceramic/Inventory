"use client"
import { useEffect, useState } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { getDashboardStats } from "@/lib/actions"
import { TrendingUp, Package, AlertTriangle, PieChart, Layers, ListChecks, Calendar } from "lucide-react"
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
      // Fallback empty stats if tables are initializing or empty
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
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Waking Up System...</p>
      </div>
    </div>
  )

  const maxCategoryQty = Math.max(...(stats.categoriesBreakdown || []).map((item: any) => item.quantity), 1);

  return (
    <div className="w-full pb-20 max-w-6xl mx-auto px-4 sm:px-6 relative overflow-x-hidden">
      {/* High-End Fluid Backdrops */}
      <div className="absolute top-[-120px] left-[-120px] w-96 h-96 rounded-full bg-[#1F6F5F]/8 blur-[100px] pointer-events-none -z-10 animate-float" />
      <div className="absolute top-[280px] right-[-120px] w-[500px] h-[500px] rounded-full bg-[#2FA084]/6 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[80px] left-[20%] w-80 h-80 rounded-full bg-emerald-800/4 blur-[110px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-2 bg-gradient-to-r from-[#1F6F5F] via-[#2FA084] to-[#0A2E26] bg-clip-text text-transparent">Executive Overview</h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
            <span>Real-time Operations Intelligence</span>
          </p>
        </div>
        
        {/* Status Row */}
        <div className="flex items-center gap-3">
          {/* Glass "System Live" badge */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(31,111,95,0.15)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 2px 8px rgba(0,0,0,0.07)'
            }}
          >
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             <span className="text-[10px] font-black text-primary/60 uppercase tracking-wider">System Live</span>
          </div>
        </div>
      </div>

      {/* Main Metric Grid - 2 Columns (Removed Physical Stock card, keep Sales & Alerts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        
        {/* Monthly Sales Card — Polished Jade Slab */}
        <FadeIn delay={0.05}>
          <div 
            className="rounded-2xl p-5 group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden h-full animate-shine-sweep"
            style={{
              background: 'linear-gradient(135deg, #1F6F5F 0%, #0c352d 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 12px 30px rgba(12, 53, 45, 0.22), inset 0 2px 4px rgba(255, 255, 255, 0.25)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform relative"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 3px 8px rgba(0,0,0,0.15)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-200/80 uppercase tracking-widest font-black mb-0.5">Monthly Sales</p>
                <p className="text-xl font-black text-white leading-none">₹{(stats.monthlyRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-[9px] text-emerald-300 font-bold mt-1 uppercase">{(stats.monthlyBillsCount ?? 0)} Invoices Total</p>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed border-emerald-800/40 flex items-center justify-between gap-2">
              <span className="text-[9px] font-bold text-emerald-200/60 uppercase tracking-wide">Select Month</span>
              <select
                value={`${selectedYear}-${selectedMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split("-").map(Number)
                  setSelectedYear(y)
                  setSelectedMonth(m)
                }}
                className="bg-[#0b3029] border border-emerald-800/40 rounded-lg px-2 py-1 text-[9px] font-bold text-white outline-none focus:border-white/30 cursor-pointer"
              >
                {getMonthOptions().map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0c352d] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FadeIn>
        
        {/* Low Stock Card — Glass */}
        <FadeIn delay={0.15}>
          <div className="clay-card rounded-2xl p-5 group hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform"
              style={{
                background: 'linear-gradient(145deg, rgba(254,220,220,0.80) 0%, rgba(252,200,200,0.60) 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 3px 8px rgba(220,50,50,0.12)',
                border: '1px solid rgba(220,50,50,0.12)'
              }}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-[#444444] uppercase tracking-widest font-black mb-0.5">Critical Alerts</p>
              <p className="text-2xl font-black text-red-600 leading-none">{(stats.lowStockItems || []).length}</p>
              <p className="text-[9px] text-red-400 font-bold mt-1 uppercase">Action Required</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Large Full-Width Physical Stock in Warehouse Card */}
      <FadeIn delay={0.25}>
        <div
          className="rounded-3xl p-1 mb-8"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 20px rgba(0,0,0,0.07)'
          }}
        >
          <div
            className="clay-card rounded-[26px] p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary"
                  style={{
                    background: 'linear-gradient(145deg, rgba(111,207,151,0.22) 0%, rgba(31,111,95,0.12) 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 3px 8px rgba(31,111,95,0.12)',
                    border: '1px solid rgba(31,111,95,0.12)'
                  }}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Physical Stock in Warehouse</h2>
                  <p className="text-[10px] font-bold text-[#444444] uppercase tracking-widest mt-0.5">Live inventory quantities category-wise</p>
                </div>
              </div>
              
              <div className="px-4 py-2 rounded-xl bg-emerald-50 text-[#1F6F5F] border border-emerald-100/50 flex items-baseline gap-1.5 shadow-sm">
                <span className="text-[10px] font-black uppercase text-[#1F6F5F]/60">Total Stock:</span>
                <span className="text-lg font-black">{(stats.totalBoxes ?? 0).toLocaleString()}</span>
                <span className="text-[10px] font-bold lowercase text-[#1F6F5F]/80">units</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {(stats.stockByCategory || []).map((entry: any) => (
                <div 
                  key={entry.category} 
                  className="clay-card p-4 rounded-2xl flex flex-col justify-between transition-all group hover:scale-[1.02] cursor-pointer hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1.5 truncate" title={entry.category}>
                      {entry.category}
                    </p>
                    <p className="text-xl font-black text-[#333333] leading-none">
                      {entry.boxes.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[8px] font-black text-[#2FA084] uppercase tracking-wider mt-3">
                    {entry.unit === 'box' ? 'Boxes' : entry.unit === 'pc' ? 'Pieces' : entry.unit + 's'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Category Performance Tracker (Chart Format) */}
      <FadeIn delay={0.3}>
        <div
          className="rounded-3xl p-1 mb-8"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 20px rgba(0,0,0,0.07)'
          }}
        >
          <div
            className="rounded-[26px] p-6 text-white"
            style={{
              background: 'linear-gradient(145deg, #0A2E26 0%, #153e35 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-emerald-900/30 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 3px 8px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter">Category-wise Sales Tracker</h2>
                  <p className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest mt-0.5">Monthly Quantities Dispatched</p>
                </div>
              </div>
              
            </div>

            <div className="w-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-200/50 border-b border-emerald-900/30 pb-1.5 mb-4 flex justify-between">
                <span>All Categories Sales</span>
                <span className="text-[9px] text-emerald-300 font-bold">{(stats.categoriesBreakdown || []).length} Categories</span>
              </h3>
              {(!stats.categoriesBreakdown || stats.categoriesBreakdown.length === 0) ? (
                <p className="text-xs text-emerald-200/40 italic py-16 text-center">No category sales this month</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                    <div className="relative h-56 min-w-[450px] w-full flex items-end justify-around pt-6 pb-2 px-3 border-b border-l border-emerald-900/40">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
                        <div className="border-t border-emerald-950/50 w-full" />
                        <div className="border-t border-emerald-950/50 w-full" />
                        <div className="border-t border-emerald-950/50 w-full" />
                        <div className="border-t border-emerald-950/50 w-full" />
                      </div>

                      {(stats.categoriesBreakdown || []).map((item: any) => {
                        const pct = (item.quantity / maxCategoryQty) * 100
                        return (
                          <div key={item.category} className="flex flex-col items-center group relative h-full justify-end min-w-[54px] max-w-[80px]">
                            {/* Tooltip */}
                            <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                              {item.category}: {item.quantity} units
                            </div>
                            
                            {/* Quantity label above the track */}
                            <span className="text-xs font-black text-emerald-300 mb-0.5 shrink-0">
                              {item.quantity}
                            </span>
                            
                            {/* Slender capsule bar track */}
                            <div className="w-4 bg-emerald-950/40 rounded-full h-[65%] relative overflow-hidden flex flex-col justify-end border border-emerald-900/20">
                              {/* Pill Fill */}
                              <div 
                                className="w-full bg-gradient-to-t from-[#2FA084] to-[#6FCF97] rounded-full transition-all duration-700 ease-out cursor-pointer hover:brightness-110 glazed-cylinder"
                                style={{ height: `${pct}%` }}
                              />
                            </div>

                            {/* Label */}
                            <span className="text-[10px] sm:text-[11px] font-black text-emerald-100/90 leading-tight text-center mt-2.5 uppercase tracking-tight w-full break-words px-0.5 line-clamp-2 min-h-[28px]" title={item.category}>
                              {item.category}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Large Full-Width Asset Distribution by Size Card */}
      <FadeIn delay={0.35}>
        <div
          className="rounded-3xl p-1 mb-8"
          style={{
            background: 'rgba(255,255,255,0.40)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 20px rgba(0,0,0,0.07)'
          }}
        >
          <div
            className="clay-card rounded-[26px] p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-primary"
                  style={{
                    background: 'linear-gradient(145deg, rgba(111,207,151,0.22) 0%, rgba(31,111,95,0.12) 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 3px 8px rgba(31,111,95,0.12)',
                    border: '1px solid rgba(31,111,95,0.12)'
                  }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Asset Distribution by Size</h2>
                  <p className="text-[10px] font-bold text-[#444444] uppercase tracking-widest mt-0.5">Live inventory quantities organized by dimensions</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {(stats.stockBySize || []).filter((entry: any) => entry.size !== 'Other' && entry.size !== '').map((entry: any) => (
                <div 
                  key={entry.size} 
                  className="clay-card p-4 rounded-2xl flex flex-col justify-between transition-all group hover:scale-[1.02] cursor-pointer hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1.5 truncate" title={entry.size}>
                      {entry.size}
                    </p>
                    <p className="text-xl font-black text-[#333333] leading-none">
                      {entry.boxes.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[8px] font-black text-[#2FA084] uppercase tracking-wider mt-3">
                    {entry.unit === 'box' ? 'Boxes' : entry.unit === 'pc' ? 'Pieces' : entry.unit + 's'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="w-full">
        {/* Critical Stock Breakdown — Glass Panel */}
        <FadeIn delay={0.5}>
          <div
            className="rounded-3xl p-1"
            style={{
              background: 'rgba(255,255,255,0.40)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.60)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 4px 20px rgba(0,0,0,0.07)'
            }}
          >
            <div
              className="clay-card rounded-[26px] p-6"
            >
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-red-600"
                      style={{
                        background: 'linear-gradient(145deg, #fde8e8 0%, #fcd5d5 100%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 3px 8px rgba(220,50,50,0.15)',
                        border: '1px solid rgba(220,50,50,0.12)'
                      }}
                    >
                       <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Low Level Warnings</h2>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase text-red-700"
                    style={{
                      background: 'linear-gradient(180deg, #fee4e4 0%, #fdd0d0 100%)',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.80) inset, 0 -1px 0 rgba(0,0,0,0.06) inset',
                      border: '1px solid rgba(220,50,50,0.15)'
                    }}
                  >
                    {(stats.lowStockItems || []).length} Items
                  </div>
               </div>

               <div className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                  {(!stats.lowStockItems || stats.lowStockItems.length === 0) ? (
                    <div className="text-center py-20">
                      <p className="text-xs font-bold text-[#444444] uppercase tracking-widest">Warehouse is Fully Optimized</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.lowStockItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-2xl transition-all group border border-red-100 bg-red-50/20"
                          style={{
                            boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 1px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="font-black text-[#333333] text-sm break-words leading-tight uppercase tracking-tight line-clamp-2" title={item.name}>{item.name}</p>
                              <p className="text-[9px] font-bold text-[#555555] uppercase tracking-widest mt-1">{item.size} • {item.type}</p>
                            </div>
                           <div
                            className="text-right pl-4 ml-4"
                            style={{ borderLeft: '1px solid rgba(220,50,50,0.10)' }}
                           >
                              <p className="font-black text-lg text-red-600 leading-none">{item.stockLevel}</p>
                              <p className="text-[8px] font-black text-red-400 uppercase tracking-tighter mt-1">{item.unit}s</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
