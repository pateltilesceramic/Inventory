"use client"

import { useEffect, useState, useRef } from "react"
import { getDynamicQRs, createDynamicQR, updateDynamicQR, deleteDynamicQR } from "@/lib/actions"
import { 
  QrCode, Plus, Search, ExternalLink, Copy, Check, Download, 
  Trash2, Edit3, BarChart2, ShieldCheck, Sparkles, Filter, 
  ArrowRight, Globe, Tag, Eye, RefreshCw 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SecurityGate } from "@/components/SecurityGate"
import { PaginationControls } from "@/components/common/PaginationControls"

export default function QRStudioPage() {
  const [qrList, setQrList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false)
  const [selectedQR, setSelectedQR] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Security gate
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<{ type: "create" | "update" | "delete" | "toggle"; data?: any } | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    category: "Catalogue",
    targetUrl: "",
    description: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // QR Code Styling reference
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrEngine, setQrEngine] = useState<any | null>(null)
  const [qrOrigin, setQrOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQrOrigin(window.location.origin)
    }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getDynamicQRs()
      setQrList(data || [])
    } catch (err) {
      console.error("Failed loading QR codes:", err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate code slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!isEditModalOpen) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
      setFormData(prev => ({ ...prev, title: val, code: slug }))
    } else {
      setFormData(prev => ({ ...prev, title: val }))
    }
  }

  // Handle Create / Edit Request with Admin check
  const initiateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!formData.title.trim() || !formData.code.trim() || !formData.targetUrl.trim()) {
      setErrorMsg("Title, short code, and target URL are required.")
      return
    }

    if (isEditModalOpen && selectedQR) {
      setSecurityAction({ type: "update", data: { id: selectedQR.id, ...formData } })
    } else {
      setSecurityAction({ type: "create", data: formData })
    }
    setIsSecurityGateOpen(true)
  }

  const initiateDelete = (qr: any) => {
    setSelectedQR(qr)
    setSecurityAction({ type: "delete", data: { id: qr.id } })
    setIsSecurityGateOpen(true)
  }

  const initiateToggle = (qr: any) => {
    setSelectedQR(qr)
    setSecurityAction({ type: "toggle", data: { id: qr.id, isActive: !qr.isActive } })
    setIsSecurityGateOpen(true)
  }

  const handleSecuritySuccess = async () => {
    setIsSecurityGateOpen(false)
    if (!securityAction) return

    setIsSaving(true)
    setErrorMsg("")
    try {
      if (securityAction.type === "create") {
        await createDynamicQR(securityAction.data)
        setIsCreateModalOpen(false)
        setFormData({ title: "", code: "", category: "Catalogue", targetUrl: "", description: "" })
      } else if (securityAction.type === "update") {
        await updateDynamicQR(securityAction.data.id, securityAction.data)
        setIsEditModalOpen(false)
      } else if (securityAction.type === "delete") {
        await deleteDynamicQR(securityAction.data.id)
      } else if (securityAction.type === "toggle") {
        await updateDynamicQR(securityAction.data.id, { isActive: securityAction.data.isActive })
      }
      await loadData()
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed.")
    } finally {
      setIsSaving(false)
      setSecurityAction(null)
    }
  }

  const copyToClipboard = (code: string, id: string) => {
    const fullUrl = `${qrOrigin}/qr/${code}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Open Studio & Render Dotted Matrix QR
  const openStudioModal = async (qr: any) => {
    setSelectedQR(qr)
    setIsStudioModalOpen(true)

    // Load qr-code-styling dynamically
    const QRCodeStyling = (await import("qr-code-styling")).default
    const fullUrl = `${qrOrigin}/qr/${qr.code}`

    const engine = new QRCodeStyling({
      type: "svg",
      width: 280,
      height: 280,
      data: fullUrl,
      image: "/logo-qr-circle.png",
      dotsOptions: {
        type: "rounded",
        color: "#000000"
      },
      backgroundOptions: {
        color: "#FFFFFF"
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 0,
        imageSize: 0.615,
        hideBackgroundDots: false
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#000000"
      },
      cornersDotOptions: {
        type: "dot",
        color: "#000000"
      },
      qrOptions: {
        errorCorrectionLevel: "H"
      }
    })

    setQrEngine(engine)
  }

  useEffect(() => {
    if (isStudioModalOpen && qrRef.current && qrEngine) {
      qrRef.current.innerHTML = ""
      qrEngine.append(qrRef.current)
    }
  }, [isStudioModalOpen, qrEngine])

  const downloadQR = (format: "png" | "svg") => {
    if (!qrEngine || !selectedQR) return
    qrEngine.update({ width: format === "png" ? 2000 : 500, height: format === "png" ? 2000 : 500 })
    qrEngine.download({
      name: `PatelTiles-QR-${selectedQR.code}`,
      extension: format
    })
    // Reset back to preview size
    qrEngine.update({ width: 280, height: 280 })
  }

  // Analytics computation
  const totalActive = qrList.filter(q => q.isActive).length
  const totalScans = qrList.reduce((acc, q) => acc + (q.scans || 0), 0)

  // Allowed categories
  const categories = ["All", "Catalogue", "3D Rooms"]

  // Client-side filtering of QR codes
  const filteredQRs = qrList.filter(qr => {
    const matchesCategory = selectedCategory === "All" || 
      (selectedCategory === "3D Rooms" && (qr.category === "3D Rooms" || qr.category === "3D Room View")) ||
      qr.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      qr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.targetUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="typo-h1 flex items-center gap-2.5">
            <QrCode className="w-8 h-8 text-[#2FA084]" /> QR Code Studio
          </h1>
          <p className="typo-body text-[#111111]/60 mt-1">
            Create permanent, high-density Dotted Matrix QR codes and update target URLs instantly without reprinting.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setFormData({ title: "", code: "", category: "Catalogue", targetUrl: "", description: "" })
              setErrorMsg("")
              setIsCreateModalOpen(true)
            }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md"
            style={{ 
              background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', 
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', 
              border: '1px solid rgba(0,0,0,0.12)' 
            }}
          >
            <Plus className="w-4 h-4" /> Create Dynamic QR Code
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active QR Links</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalActive} <span className="text-xs font-medium text-slate-400">/ {qrList.length} total</span></h3>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#1F6F5F] flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Scans</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{totalScans.toLocaleString()}</h3>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#1F6F5F] flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matrix Config</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">Charcoal Black</h3>
            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Level H • 100% Emblem</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#1F6F5F] text-white shadow-sm"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, code slug, or target URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] transition-all"
          />
        </div>
      </div>

      {/* QR Codes Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-[#1F6F5F] animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Loading QR Studio records...</p>
        </div>
      ) : filteredQRs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center border border-dashed border-slate-200 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#1F6F5F] flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Dynamic QR Codes Found</h3>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            {searchQuery || selectedCategory !== "All"
              ? "No QR links matched your filter criteria."
              : "Start by creating your first permanent QR code for your Master Tiles Catalogue or 3D Room Visualizer."}
          </p>
          <button
            onClick={() => {
              setFormData({ title: "", code: "", category: "Catalogue", targetUrl: "", description: "" })
              setErrorMsg("")
              setIsCreateModalOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-[#1F6F5F] hover:bg-[#18584B] text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First QR Code</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(() => {
              const itemsPerPage = 50
              const paginatedQRs = filteredQRs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              return paginatedQRs.map(qr => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[#1F6F5F] text-[10px] font-bold tracking-wide uppercase">
                        {qr.category === "3D Room View" ? "3D Rooms" : qr.category}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => initiateToggle(qr)}
                          title={qr.isActive ? "Pause QR Link" : "Activate QR Link"}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className={`w-3.5 h-3.5 ${qr.isActive ? "text-[#1F6F5F]" : "text-amber-500"}`} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQR(qr)
                            setFormData({
                              title: qr.title,
                              code: qr.code,
                              category: qr.category === "3D Room View" ? "3D Rooms" : qr.category,
                              targetUrl: qr.targetUrl,
                              description: qr.description || ""
                            })
                            setErrorMsg("")
                            setIsEditModalOpen(true)
                          }}
                          title="Edit Target / Details"
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => initiateDelete(qr)}
                          title="Delete QR Record"
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-[#1F6F5F] transition-colors line-clamp-1">
                      {qr.title}
                    </h3>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <BarChart2 className="w-3.5 h-3.5 text-[#1F6F5F]" />
                        <span>{qr.scans || 0} scans</span>
                      </div>

                      <button
                        onClick={() => openStudioModal(qr)}
                        className="inline-flex items-center gap-1 bg-[#1F6F5F] hover:bg-[#18584B] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>View QR</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            })()}
          </div>

          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={Math.ceil(filteredQRs.length / 50)}
              totalItems={filteredQRs.length}
              itemsPerPage={50}
              onPageChange={setCurrentPage}
              itemName="QR codes"
            />
          </div>
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {(isCreateModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F6F5F] flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {isEditModalOpen ? "Edit Target & Details" : "Create Dynamic QR Code"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isEditModalOpen ? "Modify target URL instantly without modifying physical printouts." : "Generate a permanent redirect link and custom Dotted Matrix QR."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={initiateSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Title / Catalogue Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Tiles Catalogue 2026 or Statuary White 3D"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Short Code Slug * {isEditModalOpen && <span className="text-[10px] text-amber-600 font-normal">(Permanent)</span>}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isEditModalOpen}
                      placeholder="tiles-catalogue"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className={`w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] outline-none transition-all ${
                        isEditModalOpen ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category === "3D Room View" ? "3D Rooms" : formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] outline-none transition-all bg-white"
                    >
                      <option value="Catalogue">Catalogue</option>
                      <option value="3D Rooms">3D Rooms</option>
                    </select>
                  </div>
                </div>

                {isEditModalOpen && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Permanent QR Redirect Link
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-700 truncate">
                        {qrOrigin ? `${qrOrigin}/qr/${formData.code}` : `/qr/${formData.code}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = `${qrOrigin}/qr/${formData.code}`;
                          navigator.clipboard.writeText(fullUrl);
                          alert("Permanent Link copied to clipboard!");
                        }}
                        className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm transition-all shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Destination URL (Target Link) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://drive.google.com/file/d/xyz... or 3D visualizer URL"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    When customers scan your QR, they will be redirected to this exact URL immediately.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Printed on 500 WhatsApp brochures and sample rack stickers."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F6F5F]/20 focus:border-[#1F6F5F] outline-none transition-all"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1F6F5F] hover:bg-[#18584B] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isEditModalOpen ? "Verify & Update Target" : "Verify & Create QR Code"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDIO PREVIEW & DOWNLOAD MODAL */}
      <AnimatePresence>
        {isStudioModalOpen && selectedQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F6F5F] flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedQR.title}</h3>
                    <p className="text-xs text-slate-500">Dark Charcoal Black • High-Density Rounded Matrix • Center Emblem (Level H)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStudioModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Dotted Matrix Canvas Preview Box */}
              <div className="my-6 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 inline-block shadow-inner mx-auto">
                <div ref={qrRef} className="mx-auto flex justify-center items-center" />
                <p className="text-[11px] font-medium text-slate-400 mt-3">
                  Scan with camera to test live redirect to <span className="text-emerald-700 font-semibold underline">{selectedQR.targetUrl}</span>
                </p>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  onClick={() => downloadQR("png")}
                  className="flex items-center justify-center gap-2.5 bg-[#1F6F5F] hover:bg-[#18584B] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download High-Res PNG</span>
                </button>

                <button
                  onClick={() => downloadQR("svg")}
                  className="flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Vector SVG</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="font-mono">
                  Permanent Link: <span className="font-bold text-slate-800">/qr/{selectedQR.code}</span>
                </div>
                <a
                  href={`/qr/${selectedQR.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#1F6F5F] hover:underline"
                >
                  <span>Open Redirect Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security Gate for Master Password */}
      <SecurityGate
        isOpen={isSecurityGateOpen}
        onClose={() => { setIsSecurityGateOpen(false); setSecurityAction(null); }}
        onSuccess={handleSecuritySuccess}
      />
    </div>
  )
}
