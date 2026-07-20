"use client"

import { useEffect, useState, useRef } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { SecurityGate } from "@/components/SecurityGate"
import { getInventory, deleteInventoryItem, addInventoryItem, updateInventoryStock, getStockLogs, editInventoryItem } from "@/lib/actions"
import { Plus, Trash2, Package, Check, Search, X, History, Edit, AlertCircle, ArrowUpRight, ArrowDownRight, Filter, ChevronDown, PackageCheck, Pencil, ImagePlus, Eye, Image as ImageIcon } from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"

// --- Helper: Format Date ---
function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// --- Component: History Modal ---
function HistoryModal({ item, onClose }: { item: any, onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await getStockLogs(item.id)
      setLogs(data)
      setLoading(false)
    }
    fetchLogs()
  }, [item.id])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl"
        style={{ background: 'rgba(250,252,251,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.90) inset' }}
      >
        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, rgba(31,111,95,0.04) 0%, transparent 100%)' }}>
          <div>
            <h2 className="text-xl font-bold text-[#1F6F5F] flex items-center gap-2">
              <History className="w-5 h-5" /> Stock History
            </h2>
            <p className="text-xs text-[#111111]/50 font-medium mt-0.5">{item.name} ({item.size})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f2f1 100%)', boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 5px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.09)' }}>
            <X className="w-5 h-5 text-[#111111]/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-20 text-center text-[#111111]/40 font-medium">Loading history...</div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-[#111111]/40 font-medium">No history found for this item.</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(249,250,249,0.85)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.change > 0 ? 'bg-green-100 text-green-600' : 
                    log.change < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {log.change > 0 ? <ArrowUpRight className="w-5 h-5" /> : 
                     log.change < 0 ? <ArrowDownRight className="w-5 h-5" /> : <History className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-[#111111]">{log.type}</p>
                      <p className="text-[10px] font-bold text-[#111111]/30 uppercase tracking-wider">{formatDate(log.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest">
                        Before: <span className="text-sm text-[#111111]/80 ml-1">{log.oldLevel}</span>
                      </div>
                      <div className="w-px h-3 bg-gray-200" />
                      <div className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-widest">
                        After: <span className="text-sm text-[#1F6F5F] ml-1 font-black">{log.newLevel}</span>
                      </div>
                      <div className="ml-auto font-black text-xs px-2 py-0.5 rounded bg-white border border-gray-100 flex items-center gap-1">
                        {log.change > 0 ? '+' : ''}{log.change} {item.unit}s
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// --- Component: Design Viewer Modal ---
function DesignViewerModal({ item, onClose }: { item: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.65)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
        style={{ background: 'rgba(250,252,251,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 32px 80px rgba(0,0,0,0.26), 0 8px 24px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.90) inset' }}
      >
        <div className="p-5 flex justify-between items-center shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, rgba(31,111,95,0.04) 0%, transparent 100%)' }}>
          <div>
            <h2 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
              <Eye className="w-5 h-5" /> Design Preview
            </h2>
            <p className="text-xs text-[#111111]/50 font-medium mt-0.5">
              {item.name} {item.size ? `(${item.size})` : ''} · {item.type}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f0f2f1 100%)', boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 5px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.09)' }}>
            <X className="w-5 h-5 text-[#111111]/40" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
          {item.designUrl ? (
            <img
              src={item.designUrl}
              alt={`Design for ${item.name}`}
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-gray-100"
            />
          ) : (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 mx-auto text-[#111111]/10 mb-4" />
              <p className="text-sm font-bold text-[#111111]/30 uppercase tracking-wider">No design uploaded</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// --- Component: Design Upload Field ---
function DesignUploadField({ currentUrl, onUpload, onClear }: { currentUrl: string | null, onUpload: (url: string) => void, onClear: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP, or GIF).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload-design', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setPreview(data.url)
        onUpload(data.url)
      } else {
        alert(data.error || 'Upload failed.')
      }
    } catch (err) {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Design Image</label>
      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-[#FAFAFA]">
          <img src={preview} alt="Design preview" className="w-full h-36 object-contain p-2" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-[#111111] rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => { setPreview(null); onClear(); }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
            dragOver
              ? 'border-[#2FA084] bg-[#2FA084]/5'
              : 'border-gray-200 bg-[#EEEEEE] hover:border-[#2FA084]/50 hover:bg-[#2FA084]/5'
          }`}
        >
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-[#2FA084]/20 border-t-[#2FA084] rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wider">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-6 h-6 text-[#111111]/30" />
              <span className="text-[10px] font-bold text-[#111111]/40 uppercase tracking-wider">Click or drop image</span>
              <span className="text-[9px] text-[#111111]/25">JPG, PNG, WebP · Max 5MB</span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}

// --- Component: Update Modal ---
function UpdateModal({ item, onClose, onUpdate, onEdit, categories, types }: { item: any, onClose: () => void, onUpdate: (val: number) => void, onEdit: (data: any) => Promise<boolean>, categories: string[], types: string[] }) {
  const [activeTab, setActiveTab] = useState<'stock' | 'details'>('stock')
  
  // Stock Form State
  const [amount, setAmount] = useState("")
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [error, setError] = useState("")

  // Edit Details State
  const [formData, setFormData] = useState({ 
    name: item.name, 
    type: item.type, 
    size: item.size || "", 
    unit: item.unit, 
    lowStockThreshold: item.lowStockThreshold.toString(), 
    category: item.category,
    designUrl: item.designUrl || "" 
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState("")

  const handleStockSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const val = parseInt(amount)
    if (isNaN(val) || val === 0) {
      setError("Please enter a valid non-zero number.")
      return
    }
    setIsSecurityGateOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.type) {
      setEditError("Category and Type are required.")
      return
    }
    setIsEditing(true)
    setEditError("")
    const success = await onEdit(formData)
    setIsEditing(false)
    if (!success) {
      setEditError("Failed to save details.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full ${activeTab === 'details' ? 'max-w-lg' : 'max-w-[340px]'} overflow-hidden rounded-2xl transition-all duration-300`}
        style={{ background: 'rgba(250,252,251,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 6px 18px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.90) inset' }}
      >
        <div className="flex" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 100%)' }}>
          <button 
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'stock' ? 'text-[#1F6F5F] bg-white border-b-2 border-[#1F6F5F]' : 'text-[#111111]/40 hover:text-[#111111]/70'}`}
          >
            <PackageCheck className="w-4 h-4" /> Update Stock
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === 'details' ? 'text-[#1F6F5F] bg-white border-b-2 border-[#1F6F5F]' : 'text-[#111111]/40 hover:text-[#111111]/70'}`}
          >
            <Pencil className="w-4 h-4" /> Edit Details
          </button>
          <button onClick={onClose} className="px-4 hover:bg-gray-200 transition-colors text-[#111111]/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'stock' ? (
          <form onSubmit={handleStockSubmit} className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: '#E4E9E7', boxShadow: '0 2px 6px rgba(0,0,0,0.10) inset, 0 1px 2px rgba(0,0,0,0.07) inset, 0 1px 0 rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="text-center flex-1">
                <p className="text-[9px] font-black text-[#1F6F5F]/50 uppercase tracking-tighter mb-0.5">In Stock</p>
                <p className="text-lg font-black text-[#111111]">{item.stockLevel}</p>
              </div>
              <div className="w-px h-6 bg-[#1F6F5F]/10" />
              <div className="text-center flex-1">
                <p className="text-[9px] font-black text-[#2FA084] uppercase tracking-tighter mb-0.5">New Total</p>
                <p className="text-lg font-black text-[#2FA084]">
                  {item.stockLevel + (parseInt(amount) || 0)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#111111]/40 uppercase tracking-widest ml-1">Quantity to Update</label>
              <div className="relative">
                <input 
                  autoFocus
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(""); }}
                  placeholder="e.g. +20 or -5"
                  className="w-full rounded-xl px-4 py-2.5 text-base font-black text-[#1F6F5F] outline-none transition-all hide-arrows text-center skeu-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#111111]/20 uppercase">
                  {item.unit}s
                </span>
              </div>
              {error ? (
                <p className="text-red-500 text-[9px] font-bold flex items-center justify-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3"/> {error}
                </p>
              ) : (
                <p className="text-[9px] text-[#111111]/30 font-bold text-center uppercase tracking-tight">Add (+) or Deduct (-) boxes</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 text-white py-2.5 rounded-xl text-xs font-black transition-all" style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', border: '1px solid rgba(0,0,0,0.12)' }}>
                Confirm Stock
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                   <label className="text-[10px] font-black text-[#111111]/60 uppercase tracking-wide">Item Name</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm text-[#111111] outline-none transition-all font-semibold skeu-input" />
                </div>
                
                <CustomDropdown label="Category" value={formData.category} onChange={(val) => setFormData({...formData, category: val})} defaultOptions={categories} />
                <CustomDropdown label="Type/Finish" value={formData.type} onChange={(val) => setFormData({...formData, type: val})} defaultOptions={types} />
                
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-[#111111]/60 uppercase tracking-wide">Size (Optional)</label>
                   <input value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm text-[#111111] outline-none transition-all font-semibold skeu-input" />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#111111]/60 uppercase tracking-wide">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm text-[#111111] outline-none transition-all font-semibold skeu-input">
                      <option value="box">Box</option>
                      <option value="pc">Piece</option>
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#111111]/60 uppercase tracking-wide">Min Stock Alert</label>
                    <input required type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} className="w-full rounded-lg px-3 py-2 text-sm text-[#111111] outline-none transition-all font-semibold skeu-input" />
                 </div>

                 <div className="md:col-span-2">
                    <DesignUploadField
                      currentUrl={formData.designUrl || null}
                      onUpload={(url) => setFormData({...formData, designUrl: url})}
                      onClear={() => setFormData({...formData, designUrl: ""})}
                    />
                 </div>
              </div>

             {editError && (
               <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4"/> {editError}
               </p>
             )}

             <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isEditing} className="flex-1 text-white py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50" style={{ background: 'linear-gradient(180deg, #333333 0%, #111111 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 -2px 0 rgba(0,0,0,0.25) inset, 0 4px 12px rgba(0,0,0,0.20)', border: '1px solid rgba(0,0,0,0.20)' }}>
                  {isEditing ? 'Saving...' : 'Save Details'}
                </button>
             </div>
          </form>
        )}

        <SecurityGate 
          isOpen={isSecurityGateOpen} 
          onClose={() => setIsSecurityGateOpen(false)} 
          onSuccess={() => onUpdate(parseInt(amount))} 
        />
      </motion.div>
    </div>
  )
}


// --- Component: Custom Dropdown ---
function CustomDropdown({ 
  label, 
  value, 
  onChange, 
  defaultOptions 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void, 
  defaultOptions: string[] 
}) {
  const [options, setOptions] = useState(defaultOptions)
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newOption, setNewOption] = useState("")
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsAdding(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setOptions(prev => {
      // Merge unique options from defaultOptions that aren't already in state
      const merged = Array.from(new Set([...prev, ...defaultOptions]))
      return merged
    })
  }, [JSON.stringify(defaultOptions)])

  const handleAdd = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()])
      onChange(newOption.trim())
    }
    setNewOption("")
    setIsAdding(false)
    setIsOpen(false)
  }

  const requestDelete = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation()
    setOptionToDelete(opt)
    setIsOpen(false)
    setIsSecurityGateOpen(true)
  }

  const handleDeleteSuccess = () => {
    if (optionToDelete) {
      setOptions(options.filter(o => o !== optionToDelete))
      if (value === optionToDelete) onChange("")
    }
  }

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes((value || "").toLowerCase()))

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">{label}</label>
      <div className="relative">
         <input 
            value={value}
            onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isOpen && filteredOptions.length > 0) {
                  onChange(filteredOptions[0]);
                  setIsOpen(false);
                }
              }
            }}
            placeholder="Type to search or add..."
            className="w-full rounded-xl px-4 py-3.5 text-[#111111] outline-none font-medium placeholder:text-[#111111]/30 transition-all skeu-input"
         />
         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#111111]/40 pointer-events-none">▼</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden text-[#111111]">
           <div className="max-h-48 overflow-y-auto custom-scrollbar">
             {filteredOptions.length > 0 ? filteredOptions.map(opt => (
               <div 
                 key={opt}
                 onClick={() => { onChange(opt); setIsOpen(false); }}
                 className={`group flex justify-between items-center px-4 py-2.5 hover:bg-[#EEEEEE]/50 cursor-pointer text-sm font-medium transition-colors ${value === opt ? 'text-[#2FA084] bg-[#2FA084]/5 font-bold' : 'text-[#111111]'}`}
               >
                 <span>{opt}</span>
                 <button 
                   onClick={(e) => requestDelete(e, opt)} 
                   className="opacity-0 group-hover:opacity-100 p-1 text-[#111111]/30 hover:text-red-500 transition-all rounded hover:bg-red-50"
                   title="Delete Option"
                 >
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
               </div>
             )) : (
               <div className="px-4 py-3 text-xs text-[#111111]/40 text-center font-medium">No matches found.</div>
             )}
           </div>
           
           <div className="border-t border-gray-100 p-2 bg-gray-50">
             {isAdding ? (
               <div className="flex gap-2">
                 <input 
                   autoFocus
                   value={newOption}
                   onChange={e => setNewOption(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                   placeholder="Type & press enter"
                   className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-[#2FA084]"
                 />
                 <button type="button" onClick={handleAdd} className="bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-3 rounded text-xs font-bold transition-colors">Add</button>
               </div>
             ) : (
               <button 
                 type="button" 
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAdding(true); setNewOption(value); }}
                 className="w-full text-left px-2 py-1.5 text-xs font-bold text-[#2FA084] hover:text-[#1F6F5F] transition-colors flex items-center gap-1"
               >
                 <Plus className="w-3 h-3" /> Add option
               </button>
             )}
           </div>
        </div>
      )}
      <SecurityGate isOpen={isSecurityGateOpen} onClose={() => {setIsSecurityGateOpen(false); setOptionToDelete(null)}} onSuccess={handleDeleteSuccess} />
    </div>
  )
}

// --- Main: Inventory Page ---
export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSize, setSelectedSize] = useState("all")
  
  // Modals / Actions
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  
  const [historyItem, setHistoryItem] = useState<any | null>(null)
  const [updateItem, setUpdateItem] = useState<any | null>(null)
  const [designViewerItem, setDesignViewerItem] = useState<any | null>(null)

  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", type: "", size: "", unit: "box", stockLevel: "0", lowStockThreshold: "40", category: "", designUrl: "" })

  const loadData = async () => {
    setLoading(true)
    const data: any = await getInventory()
    setItems(data.items || [])
    setCategories(data.categories || [])
    setTypes(data.types || [])
    setSizes(data.sizes || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id)
    setIsSecurityGateOpen(true)
  }

  const handleSecuritySuccess = async () => {
    if (pendingDeleteId) {
      const res = await deleteInventoryItem(pendingDeleteId)
      if (res?.success) {
        setPendingDeleteId(null)
        await loadData()
      } else {
        alert(res?.error || "Failed to delete item.")
      }
    }
  }

  const handleUpdateStock = async (newStock: number) => {
    if (updateItem) {
      await updateInventoryStock(updateItem.id, newStock)
      setUpdateItem(null)
      await loadData()
    }
  }

  const handleEditDetails = async (data: any): Promise<boolean> => {
    if (updateItem) {
      const res: any = await editInventoryItem(updateItem.id, data)
      if (res?.success) {
        setUpdateItem(null)
        await loadData()
        return true
      }
    }
    return false
  }


  const [addError, setAddError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category) {
      setAddError("Please select or add a Category.")
      return
    }
    if (!formData.type) {
      setAddError("Please select or add a Surface Finish / Type.")
      return
    }

    setIsSaving(true)
    setAddError("")
    
    try {
      const res: any = await addInventoryItem(formData)
      if (res?.success) {
        setIsAddRouteOpen(false)
        setFormData({ name: "", type: "", size: "", unit: "box", stockLevel: "0", lowStockThreshold: "40", category: "", designUrl: "" })
        await loadData()
      } else {
        setAddError(res?.error || "Failed to save item. Please check your connection.")
      }
    } catch (err) {
      setAddError("A server error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSize = selectedSize === "all" || item.size === selectedSize
    
    return matchesSearch && matchesCategory && matchesSize
  })

  return (
    <div className="w-full pb-20 max-w-6xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="typo-h1">Inventory Management</h1>
          <p className="typo-body text-[#111111]/60 mt-1">Audit movements, track history, and manage stock.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/30" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tiles..."
              className="w-full bg-white border border-gray-200 focus:border-[#2FA084] focus:ring-4 focus:ring-[#6FCF97]/20 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm skeu-input"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
             <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-gray-100">
                <Filter className="w-3.5 h-3.5 text-[#1F6F5F]" />
                <span className="text-[10px] font-black uppercase text-[#111111]/40 tracking-widest">Filter:</span>
             </div>
             
             <div className="flex gap-1 pr-1">
                <select 
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#1F6F5F] focus:ring-0 cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                   <option value="all">All Categories</option>
                   {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select 
                  value={selectedSize}
                  onChange={e => setSelectedSize(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#1F6F5F] focus:ring-0 cursor-pointer py-1 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                   <option value="all">All Sizes</option>
                   {sizes.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
             </div>

             {(selectedCategory !== "all" || selectedSize !== "all" || searchQuery !== "") && (
                <button 
                  onClick={() => {
                     setSelectedCategory("all");
                     setSelectedSize("all");
                     setSearchQuery("");
                  }}
                  className="px-3 py-1.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-colors border-l border-gray-100 ml-1"
                >
                   Clear All
                </button>
             )}
          </div>

          <button 
            onClick={() => setIsAddRouteOpen(!isAddRouteOpen)}
            className="flex items-center gap-2 bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-4 md:px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-[#1F6F5F]/20 active:scale-[0.98] shrink-0"
          >
            <Plus className={`w-5 h-5 transition-transform duration-300 ${isAddRouteOpen ? 'rotate-45' : ''}`} />
            <span className="hidden sm:inline">{isAddRouteOpen ? 'Close' : 'Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Add Item Panel */}
      <AnimatePresence>
        {isAddRouteOpen && (
          <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="mb-8"
          >
            <div className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.07)' }}>
               <h2 className="text-xl font-bold text-[#1F6F5F] mb-6">Register New Inventory</h2>
               <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Item Name</label>
                     <input required placeholder="e.g. Premium Floor Tile" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <CustomDropdown 
                     label="Category" 
                     value={formData.category} 
                     onChange={(val) => setFormData({...formData, category: val})} 
                     defaultOptions={["Tiles", "Sanitary", "Washbasin", "Table Top", ...categories]} 
                  />

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Tile Size (Optional)</label>
                     <input placeholder="e.g. 60x60" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/40 font-semibold skeu-input" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                  </div>

                  <CustomDropdown 
                     label="Surface Finish / Type" 
                     value={formData.type} 
                     onChange={(val) => setFormData({...formData, type: val})} 
                     defaultOptions={["Matte", "Glossy", "High Depth", ...types]} 
                  />

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Physical Unit</label>
                     <select className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all skeu-input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                        <option value="box">Box</option>
                        <option value="pc">Piece</option>
                     </select>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Initial Stock Quantity</label>
                     <input required type="number" min="0" placeholder="0" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input" value={formData.stockLevel} onChange={e => setFormData({...formData, stockLevel: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Low Stock Alert Threshold</label>
                      <input required type="number" min="0" placeholder="40" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} />
                   </div>

                   <div className="lg:col-span-3">
                      <DesignUploadField
                        currentUrl={formData.designUrl || null}
                        onUpload={(url) => setFormData({...formData, designUrl: url})}
                        onClear={() => setFormData({...formData, designUrl: ""})}
                      />
                   </div>

                   {addError && (
                    <div className="lg:col-span-3 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                       <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                       <p className="text-sm font-bold text-red-600">{addError}</p>
                    </div>
                  )}

                  <div className="lg:col-span-3 flex justify-end gap-3 mt-4">
                     <button type="button" onClick={() => setIsAddRouteOpen(false)} className="px-5 py-2.5 rounded-lg text-[#111111]/60 hover:text-[#111111] font-bold transition-colors">Cancel</button>
                     <button type="submit" disabled={isSaving} className="text-white px-8 py-2.5 rounded-xl font-black transition-all disabled:opacity-50" style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', border: '1px solid rgba(0,0,0,0.12)' }}>
                        {isSaving ? 'Saving...' : 'Save Item'}
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 6px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)' }}>
        {/* Desktop Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 text-[11px] font-black text-[#111111] uppercase tracking-widest" style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)' }}>
          <div className="col-span-4">Item Details</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-2 text-center">Stock Level</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right px-4">Management</div>
        </div>

        <div className="divide-y divide-gray-300 border-t border-b border-gray-300">
          {loading ? (
            <div className="p-20 text-center text-[#111111]/40 font-medium">Loading inventory database...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-20 text-center text-[#111111]/40">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No inventory items found matching your search.</p>
            </div>
          ) : filteredItems.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.05}>
              {/* Desktop Row */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-5 items-center hover:bg-[#EEEEEE]/30 transition-colors group">
                <div className="col-span-4 flex items-center gap-3">
                  {item.designUrl ? (
                    <button
                      onClick={() => setDesignViewerItem(item)}
                      className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 hover:border-[#2FA084] hover:shadow-md transition-all shrink-0 cursor-pointer group/design skeu-input"
                      title="Click to View Design Preview"
                    >
                      <img src={item.designUrl} alt={`Design for ${item.name}`} className="w-full h-full object-cover group-hover/design:scale-110 transition-transform" />
                    </button>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#2FA084]/10 flex items-center justify-center text-[#2FA084] shrink-0 skeu-input">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col items-start gap-1.5">
                    <h3 className="text-sm font-bold text-[#333333] leading-snug break-words w-full">{item.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.size && (
                        <span className="text-[11px] bg-[#2FA084]/10 px-2 py-0.5 rounded-md text-[#1F6F5F] font-bold border border-[#2FA084]/25">{item.size}</span>
                      )}
                      {item.type && (
                        <span className="text-[11px] bg-[#2FA084]/10 px-2 py-0.5 rounded-md text-[#1F6F5F] font-bold border border-[#2FA084]/25 capitalize">{item.type}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs text-[#444444] font-bold">{item.category}</div>
                <div className="col-span-2 flex flex-col items-center justify-center">
                  <div className="flex items-baseline gap-1">
                    <p className="font-black text-xl text-[#1F6F5F]">{item.stockLevel}</p>
                    <p className="text-[10px] text-[#111111]/40 font-bold uppercase">{item.unit}s</p>
                  </div>
                  <p className="text-[9px] text-[#111111]/30 font-bold uppercase tracking-wide">Min: {item.lowStockThreshold}</p>
                </div>
                <div className="col-span-2 text-center">
                  <div className={`inline-flex px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                    item.stockLevel <= item.lowStockThreshold 
                    ? 'skeu-badge-red text-red-700' 
                    : 'skeu-badge-green text-[#1F6F5F]'
                  }`}>
                    {item.stockLevel <= item.lowStockThreshold ? 'Low Stock' : 'Healthy'}
                  </div>
                </div>
                <div className="col-span-2 text-right flex justify-end items-center gap-2 px-2">
                  <button onClick={() => setUpdateItem(item)} className="p-2.5 rounded-xl text-[#111111]/40 hover:text-[#1F6F5F] transition-all skeu-btn-action" title="Update Stock"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setHistoryItem(item)} className="p-2.5 rounded-xl text-[#111111]/40 hover:text-[#2FA084] transition-all skeu-btn-action" title="View History"><History className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRequest(item.id)} className="p-2.5 rounded-xl text-[#111111]/40 hover:text-red-500 transition-all skeu-btn-action" title="Delete Record"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Mobile Card */}
              <div className="md:hidden p-4 hover:bg-[#EEEEEE]/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.designUrl ? (
                      <button
                        onClick={() => setDesignViewerItem(item)}
                        className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 hover:border-[#2FA084] transition-all shrink-0 cursor-pointer group/design skeu-input"
                        title="View Design Preview"
                      >
                        <img src={item.designUrl} alt="" className="w-full h-full object-cover group-hover/design:scale-110 transition-transform" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#2FA084]/10 flex items-center justify-center text-[#2FA084] shrink-0 skeu-input">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 flex flex-col items-start gap-1.5">
                      <h3 className="text-sm font-bold text-[#333333] leading-snug break-words w-full">{item.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.size && (
                          <span className="text-[10px] bg-[#2FA084]/10 px-1.5 py-0.5 rounded-md text-[#1F6F5F] font-bold border border-[#2FA084]/25">{item.size}</span>
                        )}
                        {item.type && (
                          <span className="text-[10px] bg-[#2FA084]/10 px-1.5 py-0.5 rounded-md text-[#1F6F5F] font-bold border border-[#2FA084]/25 capitalize">{item.type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Stock badge */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-lg text-[#1F6F5F] leading-none">{item.stockLevel}</p>
                    <p className="text-[9px] text-[#111111]/40 font-bold uppercase">{item.unit}s</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${
                      item.stockLevel <= item.lowStockThreshold 
                      ? 'skeu-badge-red text-red-700' 
                      : 'skeu-badge-green text-[#1F6F5F]'
                    }`}>
                      {item.stockLevel <= item.lowStockThreshold ? '⚠ Low Stock' : '✓ Healthy'}
                    </div>
                    {item.designUrl && (
                      <button
                        onClick={() => setDesignViewerItem(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border border-[#2FA084]/20 bg-[#2FA084]/5 text-[#1F6F5F] hover:bg-[#2FA084]/10 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Design
                      </button>
                    )}
                  </div>
                  <div className="flex items-center">
                     <button onClick={() => setUpdateItem(item)} className="p-2 rounded-xl text-[#111111]/40 hover:text-[#1F6F5F] transition-all skeu-btn-action"><Edit className="w-4 h-4" /></button>
                     <button onClick={() => setHistoryItem(item)} className="p-2 rounded-xl text-[#111111]/40 hover:text-[#2FA084] transition-all skeu-btn-action"><History className="w-4 h-4" /></button>
                     <button onClick={() => handleDeleteRequest(item.id)} className="p-2 rounded-xl text-[#111111]/40 hover:text-red-500 transition-all skeu-btn-action"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {updateItem && (
          <UpdateModal 
            item={updateItem} 
            onClose={() => setUpdateItem(null)} 
            onUpdate={handleUpdateStock} 
            onEdit={handleEditDetails}
            categories={["Tiles", "Sanitary", "Washbasin", "Table Top", ...categories]}
            types={["Matte", "Glossy", "High Depth", ...types]}
          />
        )}
        {historyItem && (
          <HistoryModal 
            item={historyItem} 
            onClose={() => setHistoryItem(null)} 
          />
        )}
        {designViewerItem && (
          <DesignViewerModal
            item={designViewerItem}
            onClose={() => setDesignViewerItem(null)}
          />
        )}
      </AnimatePresence>

      <SecurityGate 
        isOpen={isSecurityGateOpen} 
        onClose={() => { setIsSecurityGateOpen(false); setPendingDeleteId(null); }} 
        onSuccess={handleSecuritySuccess} 
      />

      <style>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
