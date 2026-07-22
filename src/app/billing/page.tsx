"use client"
import { useEffect, useState, useRef } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { SecurityGate } from "@/components/SecurityGate"
import { PaginationControls } from "@/components/common/PaginationControls"
import { getInventory, createBill, updateBill, getBills, deleteBill, backfillInvoiceNumbers } from "@/lib/actions"
import { Trash2, Search, Receipt, Plus, AlertCircle, Calendar, Filter, Printer, X, Layers, Droplet, Pencil } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function BillingPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<any | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedBillForView, setSelectedBillForView] = useState<any | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [billItems, setBillItems] = useState<{ tempId: string, itemId: string | null, name: string, unit: string, quantity: number | "", price: number | "", adhocMode?: 'tile' | 'sanitary' | null, showSuggestions?: boolean }[]>([])
  const [finalNetAmountInput, setFinalNetAmountInput] = useState("")
  const [validationError, setValidationError] = useState("")

  const [billSearch, setBillSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("") // Empty string means "Show All" by default
  const [currentPage, setCurrentPage] = useState(1)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setCurrentPage(1)
  }, [billSearch, dateFilter])

  // Security gate for invoice deletion
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      await backfillInvoiceNumbers().catch(e => console.error("Error backfilling invoice numbers:", e))
    } catch (e) {}

    try {
      const invData = await getInventory()
      setInventory(invData?.items || [])
    } catch (e) {
      console.error("Error fetching inventory for billing:", e)
      setInventory([])
    }

    try {
      const billsData = await getBills()
      setBills(billsData || [])
    } catch (e) {
      console.error("Error fetching bills for billing:", e)
      setBills([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideAll = Object.values(dropdownRefs.current).every(ref => !ref || !ref.contains(event.target as Node))
      if (isOutsideAll) {
        setBillItems(prev => prev.map(bi => ({ ...bi, showSuggestions: false })))
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const totalAmount = billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)

  const resetForm = () => {
    setEditingBill(null)
    setCustomerName("")
    setCustomerPhone("")
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setBillItems([])
    setFinalNetAmountInput("")
    setValidationError("")
  }

  const handleEditBill = (bill: any) => {
    setEditingBill(bill)
    setCustomerName(bill.customerName || "")
    setCustomerPhone(bill.customerPhone || "")
    setInvoiceDate(bill.createdAt ? new Date(bill.createdAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10))
    setBillItems((bill.items || []).map((i: any) => ({
      tempId: i.id || Math.random().toString(36).substr(2, 9),
      itemId: i.itemId || null,
      name: i.name,
      unit: i.unit || "box",
      quantity: i.quantity,
      price: i.price,
      adhocMode: i.adhocMode || null,
      showSuggestions: false
    })))
    setFinalNetAmountInput(bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? String(bill.finalNetAmount) : "")
    setValidationError("")
    setIsAddRouteOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addNewRow = () => {
    setBillItems(prev => [...prev, { tempId: Math.random().toString(36).substr(2, 9), itemId: null, name: "", unit: "box", quantity: "", price: "", adhocMode: null, showSuggestions: false }])
  }

  const updateBillItem = (tempId: string, field: string, value: any) => {
    setBillItems(prev => prev.map(bi => bi.tempId === tempId ? { ...bi, [field]: value } : bi))
  }

  const selectInventoryItem = (tempId: string, item: any) => {
    setBillItems(prev => prev.map(bi => bi.tempId === tempId ? { ...bi, itemId: item.id, name: item.name, unit: item.unit, adhocMode: null, showSuggestions: false } : bi))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSaveBill = async () => {
    setValidationError("")
    if (!customerName) { setValidationError("Please enter a customer name."); return }
    if (billItems.length === 0) { setValidationError("Please add at least one item."); return }
    const invalidItem = billItems.find(bi => !bi.name || Number(bi.quantity) <= 0 || Number(bi.price) <= 0)
    if (invalidItem) {
      setValidationError("Each row must have a valid name, quantity, and price.")
      return
    }

    const finalAmountVal = finalNetAmountInput.trim() ? parseFloat(finalNetAmountInput) : totalAmount
    const payloadItems = billItems.map(i => ({ 
      itemId: i.itemId || undefined, 
      name: i.name, 
      unit: i.unit, 
      quantity: Number(i.quantity), 
      price: Number(i.price),
      adhocMode: i.adhocMode || null
    }))

    setIsSubmitting(true)
    try {
      if (editingBill) {
        await updateBill(editingBill.id, {
          customerName,
          customerPhone,
          totalAmount,
          finalNetAmount: finalAmountVal,
          items: payloadItems
        })
      } else {
        await createBill({
          customerName,
          customerPhone,
          totalAmount,
          finalNetAmount: finalAmountVal,
          items: payloadItems
        })
      }

      setIsAddRouteOpen(false)
      resetForm()
      await loadData()
    } catch (err: any) {
      console.error("Failed to save bill:", err)
      setValidationError(err?.message || "Failed to finalize invoice and deduct stock. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete invoice flow
  const requestDeleteBill = (id: string) => {
    setPendingDeleteId(id)
    setIsSecurityGateOpen(true)
  }

  const handleDeleteSuccess = async () => {
    if (pendingDeleteId) {
      await deleteBill(pendingDeleteId)
      setPendingDeleteId(null)
      await loadData()
    }
  }

  return (
    <div className="w-full pb-20 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="typo-h1">Smart Billing</h1>
          <p className="typo-body text-[#111111]/60 mt-1">Create invoices, manage transactions, and track payments.</p>
        </div>
        <button 
          onClick={() => { 
            if (isAddRouteOpen) {
              setIsAddRouteOpen(false)
              resetForm()
            } else {
              resetForm()
              setBillItems([{ tempId: Math.random().toString(36).substr(2, 9), itemId: null, name: "", unit: "box", quantity: "", price: "", adhocMode: null, showSuggestions: false }])
              setIsAddRouteOpen(true)
            }
          }}
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-bold transition-all cursor-pointer"
          style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', border: '1px solid rgba(0,0,0,0.12)' }}
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${isAddRouteOpen ? 'rotate-45' : ''}`} />
          {isAddRouteOpen ? (editingBill ? 'Close Edit' : 'Close Invoice') : 'New Invoice'}
        </button>
      </div>

      <AnimatePresence>
        {isAddRouteOpen && (
          <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             exit={{ opacity: 0, height: 0 }}
             className="mb-8 overflow-hidden"
          >
             <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.68)', boxShadow: '0 1px 0 rgba(255,255,255,0.92) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.07)' }}>
                <h2 className="text-xl font-bold text-[#1F6F5F] mb-6">
                  {editingBill ? `Edit Invoice (${editingBill.invoiceNo})` : 'Create Invoice Draft'}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Customer Name</label>
                      <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Walk-in Customer" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input" />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Customer Phone</label>
                      <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 9876543210 (Optional)" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input" />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Invoice Date</label>
                      <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all skeu-input" />
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-xl overflow-visible mb-6">
                   <div className="bg-gray-50 p-3 flex text-[10px] font-black text-[#111111]/40 uppercase tracking-widest border-b border-gray-200">
                      <div className="flex-1">Item Description</div>
                      <div className="w-24 text-center">Unit</div>
                      <div className="w-24 text-center">Qty</div>
                      <div className="w-32 text-center">Price (₹)</div>
                      <div className="w-32 text-right pr-4">Subtotal</div>
                      <div className="w-10"></div>
                   </div>
                   <div className="divide-y divide-gray-100 min-h-[50px]">
                      {billItems.map((bi) => (
                         <div key={bi.tempId} className="flex items-start p-3 hover:bg-gray-50/50 transition-colors gap-2">
                            {/* Autocomplete Description Input */}
                            <div className="flex-1 relative" ref={el => { dropdownRefs.current[bi.tempId] = el }}>
                               <div className="flex items-center gap-1.5">
                                 <input 
                                   value={bi.name} 
                                   onChange={e => {
                                     updateBillItem(bi.tempId, 'name', e.target.value);
                                     updateBillItem(bi.tempId, 'itemId', null);
                                     updateBillItem(bi.tempId, 'showSuggestions', true);
                                   }}
                                   onFocus={() => updateBillItem(bi.tempId, 'showSuggestions', true)}
                                   placeholder="Type item name..." 
                                   className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-2 text-[#111111] text-sm outline-none transition-all font-medium" 
                                 />
                                 
                                 {/* 3-Position Tactile Slider Switch */}
                                 {!bi.itemId && (
                                   <div 
                                     className="relative flex items-center bg-slate-100/90 border border-slate-200/80 rounded-full p-0.5 w-[96px] h-8 shrink-0 select-none overflow-hidden"
                                   >
                                     {/* Slide indicator background */}
                                     <div 
                                       className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                                       style={{
                                         width: '28px',
                                         left: bi.adhocMode === 'tile' ? '2px' : 
                                               bi.adhocMode === 'sanitary' ? '62px' : '32px',
                                         background: bi.adhocMode === 'tile' ? 'linear-gradient(135deg, #1F6F5F 0%, #2FA084 100%)' :
                                                     bi.adhocMode === 'sanitary' ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : '#cbd5e1',
                                       }}
                                     />

                                     {/* Label Buttons */}
                                     <button
                                       type="button"
                                       title="Track as Tiles Category"
                                       onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'tile')}
                                       className={`w-[30px] h-full text-center text-[9px] font-black z-10 transition-colors duration-200 ${bi.adhocMode === 'tile' ? 'text-white' : 'text-slate-500'}`}
                                     >
                                       Tile
                                     </button>
                                     <button
                                       type="button"
                                       title="Turn off tracking"
                                       onClick={() => updateBillItem(bi.tempId, 'adhocMode', null)}
                                       className={`w-[30px] h-full text-center text-[8px] font-black z-10 transition-colors duration-200 ${!bi.adhocMode ? 'text-white' : 'text-slate-400'}`}
                                     >
                                       off
                                     </button>
                                     <button
                                       type="button"
                                       title="Track as Sanitary Category"
                                       onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'sanitary')}
                                       className={`w-[30px] h-full text-center text-[9px] font-black z-10 transition-colors duration-200 ${bi.adhocMode === 'sanitary' ? 'text-white' : 'text-slate-500'}`}
                                     >
                                       San
                                     </button>
                                   </div>
                                 )}
                               </div>
                               
                               {/* Suggestions Dropdown */}
                               {bi.showSuggestions && bi.name.length > 0 && (
                                 <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                    {inventory
                                      .filter(i => 
                                        (i?.name || "").trim().toLowerCase().includes((bi?.name || "").trim().toLowerCase()) || 
                                        (i?.category || "").trim().toLowerCase().includes((bi?.name || "").trim().toLowerCase())
                                      )
                                      .map(item => (
                                        <button 
                                          key={item.id} 
                                          type="button" 
                                          onClick={() => selectInventoryItem(bi.tempId, item)}
                                          className="w-full text-left px-4 py-2 hover:bg-[#6FCF97]/10 transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                                        >
                                          <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-[#111111]">{item.name}</p>
                                            <span className="text-[9px] font-black text-[#111111]/30 uppercase">{item.category}</span>
                                          </div>
                                          <p className="text-[10px] text-[#111111]/40 font-medium">Stock: {item.stockLevel} {item.unit}s</p>
                                        </button>
                                      ))
                                    }
                                    {inventory.filter(i => 
                                      (i?.name || "").trim().toLowerCase().includes((bi?.name || "").trim().toLowerCase()) || 
                                      (i?.category || "").trim().toLowerCase().includes((bi?.name || "").trim().toLowerCase())
                                    ).length === 0 && (
                                      <div className="px-4 py-3 text-xs italic text-[#111111]/40">Manual entry mode</div>
                                    )}
                                 </div>
                               )}
                            </div>

                            {/* Unit Selector */}
                            <div className="w-24 px-1">
                               <select 
                                 value={bi.unit} 
                                 onChange={e => updateBillItem(bi.tempId, 'unit', e.target.value)}
                                 className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-2 py-2 text-[#111111] text-xs outline-none transition-all font-bold appearance-none text-center cursor-pointer"
                               >
                                  <option value="box">BOX</option>
                                  <option value="pc">PCS</option>
                               </select>
                            </div>

                            {/* Qty Input */}
                            <div className="w-24">
                               <input 
                                 type="number" 
                                 min="1" 
                                 value={bi.quantity} 
                                 onChange={e => {
                                   const val = e.target.value;
                                   updateBillItem(bi.tempId, 'quantity', val === "" ? "" : (parseInt(val) || 0));
                                 }} 
                                 className="w-full text-center bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-2 py-2 text-[#111111] text-sm outline-none transition-colors hide-arrows font-bold" 
                               />
                            </div>

                            {/* Price Input */}
                            <div className="w-32 font-bold">
                               <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#111111]/30">₹</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    value={bi.price} 
                                    onChange={e => {
                                      const val = e.target.value;
                                      updateBillItem(bi.tempId, 'price', val === "" ? "" : (parseFloat(val) || 0));
                                    }} 
                                    className="w-full pl-6 pr-3 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 text-[#111111] text-sm outline-none transition-colors hide-arrows text-right" 
                                  />
                               </div>
                            </div>

                            {/* Subtotal Display */}
                            <div className="w-32 text-right pt-2 font-black text-[#1F6F5F] pr-4">
                               ₹{(Number(bi.quantity) * Number(bi.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>

                            {/* Delete Row */}
                            <div className="w-10 pt-1 flex justify-end">
                               <button type="button" onClick={() => setBillItems(billItems.filter(i => i.tempId !== bi.tempId))} className="p-2 text-[#111111]/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                      ))}
                   </div>
                   
                   {/* Add Row Button */}
                   <div className="p-4 bg-gray-50/50 border-t border-gray-200 border-dashed">
                      <button 
                        type="button" 
                        onClick={addNewRow}
                        className="flex items-center gap-2 text-[#1F6F5F] hover:text-[#2FA084] font-black text-xs uppercase tracking-widest transition-all hover:translate-x-1"
                      >
                         <Plus className="w-4 h-4" />
                         Add New Item Line
                      </button>
                   </div>
                </div>

                {validationError && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                     <AlertCircle className="w-4 h-4 shrink-0" />
                     {validationError}
                  </div>
                )}

                <div className="-mx-6 -mb-6 p-6 rounded-b-2xl flex justify-between items-center" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
                   <div className="flex gap-8 items-center">
                      <div>
                         <p className="text-[10px] text-[#111111]/50 uppercase tracking-widest font-bold">Total Net Amount</p>
                         <p className="text-2xl font-black text-[#1F6F5F]">₹{billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider block">Final Net Amount (₹)</label>
                         <input 
                           type="number"
                           step="0.01"
                           placeholder={billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}
                           value={finalNetAmountInput}
                           onChange={e => setFinalNetAmountInput(e.target.value)}
                           className="w-40 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-1.5 text-sm font-bold outline-none text-right shadow-sm hide-arrows"
                         />
                      </div>
                   </div>
                   <div className="flex gap-4 items-center">
                      <button type="button" onClick={() => { setIsAddRouteOpen(false); resetForm(); }} className="px-5 py-2.5 rounded-lg text-[#111111]/60 hover:text-[#111111] font-medium transition-colors cursor-pointer">Cancel</button>
                      <button onClick={handleSaveBill} disabled={!customerName || billItems.length === 0 || isSubmitting} className="text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', border: '1px solid rgba(0,0,0,0.12)' }}>
                         {isSubmitting ? 'Saving Invoice...' : (editingBill ? 'Update & Sync Stock' : 'Finalize & Deduct Stock')}
                      </button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Register */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 6px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)' }}>
        <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, rgba(31,111,95,0.04) 0%, rgba(31,111,95,0.02) 100%)' }}>
           <div className="flex items-center gap-3">
             <Receipt className="w-5 h-5 text-[#2FA084]" />
             <h2 className="text-lg font-bold text-[#1F6F5F]">Invoices Register</h2>
           </div>
           
           <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/30" />
               <input 
                 value={billSearch}
                 onChange={e => setBillSearch(e.target.value)}
                 placeholder="Search by customer or invoice #..."
                 className="w-full bg-white border border-gray-200 focus:border-[#2FA084] focus:ring-4 focus:ring-[#6FCF97]/10 rounded-xl pl-10 pr-4 py-2 text-xs font-bold outline-none transition-all"
               />
             </div>

             <div className="relative w-full sm:w-auto flex items-center gap-2">
                <div className="relative flex-1">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#111111]/30 pointer-events-none" />
                   <input 
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className={`bg-white border border-gray-200 focus:border-[#2FA084] rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none transition-all w-full sm:w-40 ${!dateFilter ? 'text-[#111111]/30' : 'text-[#111111]'}`}
                   />
                </div>
                {dateFilter && (
                   <button 
                     onClick={() => setDateFilter('')}
                     className="p-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                   >
                      Clear
                   </button>
                )}
             </div>
           </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4 p-5 text-[11px] font-black text-[#111111] uppercase tracking-widest" style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)' }}>
          <div className="col-span-2">Invoice No</div>
          <div className="col-span-3">Customer Details</div>
          <div className="col-span-3 text-center">Total Amount</div>
          <div className="col-span-2 text-center">Receipt</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>

        <div className="divide-y divide-gray-300 border-t border-b border-gray-300">
          {(() => {
            const filteredBills = bills.filter(b => {
              const matchesSearch = b.customerName.toLowerCase().includes(billSearch.toLowerCase()) || (b.invoiceNo && b.invoiceNo.toLowerCase().includes(billSearch.toLowerCase()))
              const matchesDate = !dateFilter || new Date(b.createdAt).toISOString().substring(0, 10) === dateFilter
              return matchesSearch && matchesDate
            })
            const itemsPerPage = 50
            const totalPages = Math.ceil(filteredBills.length / itemsPerPage)
            const paginatedBills = filteredBills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

            if (loading) {
              return <div className="p-10 text-center text-[#111111]/40 font-medium">Fetching register data...</div>
            }

            if (bills.length === 0) {
              return (
                <div className="p-16 text-center text-[#111111]/40">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No sales invoices recorded yet.</p>
                </div>
              )
            }

            if (filteredBills.length === 0) {
              return <div className="p-16 text-center text-[#111111]/40 font-medium italic">No invoices found for this search/date</div>
            }

            return (
              <>
                {paginatedBills.map((bill, i) => (
                  <FadeIn key={bill.id} delay={i * 0.03}>
                    <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#EEEEEE]/40 transition-colors group">
                      
                      <div className="col-span-2">
                        <p className="font-black text-[#1F6F5F] text-xs tracking-tighter">{bill.invoiceNo}</p>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-[#111111]/30">#{bill.id.slice(0, 4)}</p>
                      </div>

                      <div className="col-span-3">
                        <p className="font-bold text-[#111111] truncate">{bill.customerName}</p>
                        {bill.customerPhone && (
                          <p className="text-[10px] text-[#111111]/60 font-semibold">{bill.customerPhone}</p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#111111]/40 mt-0.5">
                          {formatDate(bill.createdAt)} • {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>

                      <div className="col-span-3 text-center">
                          <p className="font-black text-sm text-[#1F6F5F]">
                            ₹{(bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount).toFixed(2)}
                          </p>
                          {bill.finalNetAmount !== null && bill.finalNetAmount !== undefined && Math.abs(bill.totalAmount - bill.finalNetAmount) > 0.01 && (
                            <p className="text-[9px] text-red-500 font-semibold line-through">₹{bill.totalAmount.toFixed(2)}</p>
                          )}
                      </div>

                      <div className="col-span-2 text-center">
                        <button 
                            onClick={() => setSelectedBillForView(bill)} 
                            className="px-3 py-1.5 bg-[#2FA084]/10 hover:bg-[#2FA084]/20 text-[#1F6F5F] text-xs font-bold rounded-lg transition-colors border border-[#2FA084]/20 whitespace-nowrap cursor-pointer shadow-sm"
                        >
                            View Bill
                        </button>
                      </div>

                      <div className="col-span-2 text-center flex justify-center items-center gap-2">
                        <button 
                          onClick={() => handleEditBill(bill)}
                          className="p-1.5 rounded-lg text-[#1F6F5F] hover:bg-[#1F6F5F]/10 hover:text-[#2FA084] transition-colors cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => requestDeleteBill(bill.id)}
                          className="p-1.5 rounded-lg text-[#111111]/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </FadeIn>
                ))}

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredBills.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  itemName="invoices"
                />
              </>
            )
          })()}
        </div>
      </div>

       <style>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-modal-container, #print-modal-container * {
            visibility: visible !important;
          }
          #print-modal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999 !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .no-print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 80mm !important;
            width: 80mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #print-area {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* Admin gate for deleting invoices */}
      <SecurityGate 
        isOpen={isSecurityGateOpen} 
        onClose={() => { setIsSecurityGateOpen(false); setPendingDeleteId(null); }} 
        onSuccess={handleDeleteSuccess} 
      />

      {/* View Bill Modal (Thermal Receipt) */}
      <AnimatePresence>
        {selectedBillForView && (
          <div id="print-modal-container" className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#111111]/40 backdrop-blur-sm no-print" 
              onClick={() => setSelectedBillForView(null)} 
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-2xl z-10 flex flex-col p-6 no-print-card"
              style={{ maxHeight: '90vh' }}
            >
              {/* Receipt Body (Screen Scrollable / Print Exact) */}
              <div className="flex-1 overflow-y-auto pr-1 -mr-1" id="print-area">
                {/* Logo & Header */}
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2 no-print">
                    <div className="w-12 h-12 bg-[#1F6F5F]/10 rounded-2xl flex items-center justify-center text-[#1F6F5F] border border-[#2FA084]/20 shadow-sm">
                      <Receipt className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-[#111111] uppercase">Patel Tiles & Ceramic</h3>
                  <p className="text-[9px] uppercase tracking-widest font-black text-[#111111]/40 mt-0.5">Inventory & Sales System</p>
                </div>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Meta details */}
                <div className="flex justify-between items-start text-xs text-[#111111]/70 mb-4 gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-[#111111]">
                      <span className="text-[9px] uppercase text-[#111111]/40 font-black block">Customer</span>
                      {selectedBillForView.customerName}
                    </p>
                    {selectedBillForView.customerPhone && (
                      <p className="font-semibold">
                        <span className="text-[9px] uppercase text-[#111111]/40 font-black block">Phone</span>
                        {selectedBillForView.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">
                      <span className="text-[9px] uppercase text-[#111111]/40 font-black block">Invoice No</span>
                      {selectedBillForView.invoiceNo}
                    </p>
                    <p className="font-semibold">
                      <span className="text-[9px] uppercase text-[#111111]/40 font-black block">Date</span>
                      {formatDate(selectedBillForView.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-3" />

                {/* Items list */}
                <table className="w-full text-left text-xs mb-4">
                  <thead>
                    <tr className="border-b border-dashed border-gray-200 text-[9px] text-[#111111]/40 uppercase tracking-widest font-black">
                      <th className="py-1.5 font-black">Item</th>
                      <th className="py-1.5 text-center font-black">Qty</th>
                      <th className="py-1.5 text-right font-black">Price</th>
                      <th className="py-1.5 text-right font-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedBillForView.items.map((item: any) => (
                      <tr key={item.id} className="text-[#111111]/80">
                        <td className="py-2 pr-2 font-medium">
                          <p className="text-xs font-bold text-[#111111]">{item.name}</p>
                          <span className="text-[9px] text-[#111111]/40 font-semibold uppercase">{item.unit}</span>
                        </td>
                        <td className="py-2 text-center font-bold text-xs">{item.quantity}</td>
                        <td className="py-2 text-right font-medium text-xs">₹{item.price.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold text-xs text-[#1F6F5F]">₹{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-gray-300 my-3" />

                {/* Total */}
                {(() => {
                  const finalAmt = selectedBillForView.finalNetAmount !== null && selectedBillForView.finalNetAmount !== undefined 
                    ? selectedBillForView.finalNetAmount 
                    : selectedBillForView.totalAmount;
                  const discountVal = selectedBillForView.totalAmount - finalAmt;
                  return (
                    <div className="space-y-1.5 mb-6 text-xs text-[#111111]/80">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-[#111111]/50 uppercase tracking-wider">Grand Total</span>
                        <span className="font-bold">₹{selectedBillForView.totalAmount.toFixed(2)}</span>
                      </div>
                      {discountVal > 0.01 && (
                        <div className="flex justify-between items-center text-red-600 font-semibold">
                          <span className="uppercase tracking-wider">Discount</span>
                          <span>-₹{discountVal.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between items-center">
                        <span className="font-black uppercase text-[#111111]/70 tracking-wider">Final Net Amount</span>
                        <span className="text-base font-black text-[#1F6F5F]">₹{finalAmt.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Footer terms */}
                <div className="text-center text-[9px] text-[#111111]/40 font-medium tracking-wide">
                  <p>Thank you for your visit!</p>
                  <p className="mt-0.5">Computer Generated Receipt</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-4 no-print">
                <button 
                  onClick={() => setSelectedBillForView(null)} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111111]/60 hover:text-[#111111] text-xs font-bold rounded-lg transition-colors border border-gray-200 shadow-sm"
                >
                  Close
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-1.5 bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

