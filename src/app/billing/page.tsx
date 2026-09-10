"use client"
import { useEffect, useState, useRef, useMemo } from "react"
import { FadeIn } from "@/components/motion/FadeIn"
import { SecurityGate } from "@/components/SecurityGate"
import { PaginationControls } from "@/components/common/PaginationControls"
import { getInventory, createBill, updateBill, getBills, deleteBill, backfillInvoiceNumbers, recordBillPayment } from "@/lib/actions"
import { Trash2, Search, Receipt, Plus, AlertCircle, Calendar, Filter, Printer, X, Layers, Droplet, Pencil, MessageCircle, Minus, ChevronDown, ChevronUp, Users, Wallet, Phone, Clock } from "lucide-react"
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
  const [amountPaidInput, setAmountPaidInput] = useState("")
  const [validationError, setValidationError] = useState("")

  // Payment modal state
  const [paymentModalBill, setPaymentModalBill] = useState<any | null>(null)
  const [paymentAmountInput, setPaymentAmountInput] = useState("")
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  const [billSearch, setBillSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("") // Empty string means "Show All" by default
  const [activeTab, setActiveTab] = useState<"All" | "Pending">("All")
  const [pendingViewMode, setPendingViewMode] = useState<"customer" | "bills">("customer")
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({})
  const [customerPaymentModal, setCustomerPaymentModal] = useState<{ customerName: string; customerPhone?: string; totalDue: number; bills: any[] } | null>(null)
  const [customerPaymentAmount, setCustomerPaymentAmount] = useState("")
  const [isSubmittingCustomerPayment, setIsSubmittingCustomerPayment] = useState(false)
  const [customerPaymentError, setCustomerPaymentError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setCurrentPage(1)
  }, [billSearch, dateFilter])

  // Security gate for invoice deletion/editing
  const [isSecurityGateOpen, setIsSecurityGateOpen] = useState(false)
  const [securityAction, setSecurityAction] = useState<"delete" | "edit" | "save_edit" | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingEditBill, setPendingEditBill] = useState<any | null>(null)
  const [pendingEditPayload, setPendingEditPayload] = useState<any | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [invData, billsData] = await Promise.all([
        getInventory().catch(e => { console.error("Error fetching inventory:", e); return null }),
        getBills().catch(e => { console.error("Error fetching bills:", e); return null })
      ])
      if (invData) setInventory(invData.items || [])
      if (billsData) setBills(billsData || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])
  
  // Removed handleClickOutside in favor of onBlur on the input for better reliability

  const totalAmount = billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)

  const resetForm = () => {
    setEditingBill(null)
    setCustomerName("")
    setCustomerPhone("")
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setBillItems([])
    setFinalNetAmountInput("")
    setAmountPaidInput("")
    setValidationError("")
  }

  const handleWhatsAppShare = (bill: any) => {
    const rawPhone = (bill.customerPhone || "").replace(/[^0-9]/g, "")
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
    const finalAmt = bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount
    const itemsText = (bill.items || []).map((i: any, idx: number) => 
      `${idx + 1}. *${i.name}* - ${i.quantity} ${i.unit}s @ ₹${i.price} = ₹${(i.quantity * i.price).toFixed(2)}`
    ).join('\n')
    
    const balanceText = (bill.balanceDue || 0) > 0 
      ? `\n*Advance Received:* ₹${((bill.amountPaid || 0)).toFixed(2)}\n*Balance Due:* ₹${bill.balanceDue.toFixed(2)}`
      : `\n*Status:* PAID IN FULL ✅`

    const message = `*PATEL TILES & CERAMIC*\n` +
      `--------------------------------\n` +
      `*Invoice:* ${bill.invoiceNo || 'Cash Bill'}\n` +
      `*Date:* ${formatDate(bill.createdAt)}\n` +
      `*Customer:* ${bill.customerName}\n` +
      (bill.customerPhone ? `*Phone:* ${bill.customerPhone}\n` : '') +
      `--------------------------------\n` +
      `*Items:*\n${itemsText}\n` +
      `--------------------------------\n` +
      `*Final Total:* ₹${finalAmt.toFixed(2)}${balanceText}\n\n` +
      `Thank you for your business!`

    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
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
    setAmountPaidInput(bill.amountPaid !== null && bill.amountPaid !== undefined ? String(bill.amountPaid) : "")
    setValidationError("")
    setIsAddRouteOpen(true)
  }

  const addNewRow = () => {
    setBillItems(prev => [...prev, { tempId: Math.random().toString(36).substr(2, 9), itemId: null, name: "", unit: "box", quantity: "", price: "", adhocMode: null, showSuggestions: false }])
  }

  const updateBillItem = (tempId: string, fieldOrUpdates: string | any, value?: any) => {
    setBillItems(prev => prev.map(bi => {
      if (bi.tempId !== tempId) return bi;
      if (typeof fieldOrUpdates === 'string') {
        return { ...bi, [fieldOrUpdates]: value };
      }
      return { ...bi, ...fieldOrUpdates };
    }))
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
    const amountPaidVal = amountPaidInput.trim() ? parseFloat(amountPaidInput) : finalAmountVal
    const balanceDueVal = Math.max(0, finalAmountVal - amountPaidVal)
    
    const payloadItems = billItems.map(i => ({ 
      itemId: i.itemId || undefined, 
      name: i.name, 
      unit: i.unit, 
      quantity: Number(i.quantity), 
      price: Number(i.price),
      adhocMode: i.adhocMode || null
    }))

    const payload = {
      customerName,
      customerPhone,
      totalAmount,
      finalNetAmount: finalAmountVal,
      amountPaid: amountPaidVal,
      balanceDue: balanceDueVal,
      items: payloadItems
    }

    if (editingBill && !pendingEditPayload && securityAction !== 'save_edit') {
      setPendingEditPayload(payload)
      setSecurityAction('save_edit')
      setIsSecurityGateOpen(true)
      return
    }

    setIsSubmitting(true)
    try {
      let res: any
      if (editingBill) {
        res = await updateBill(editingBill.id, pendingEditPayload || payload)
      } else {
        res = await createBill(payload)
      }

      if (res && res.success === false) {
        setValidationError(res.error || "Failed to finalize invoice and deduct stock. Please try again.")
        return
      }

      setIsAddRouteOpen(false)
      resetForm()
      setPendingEditPayload(null)
      setSecurityAction(null)
      await loadData()
    } catch (err: any) {
      console.error("Failed to save bill:", err)
      setValidationError(err?.message || "Failed to finalize invoice and deduct stock. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Security gate for actions
  const requestDeleteBill = (id: string) => {
    setPendingDeleteId(id)
    setSecurityAction('delete')
    setIsSecurityGateOpen(true)
  }

  const handleSecuritySuccess = async () => {
    if (securityAction === 'delete' && pendingDeleteId) {
      const res: any = await deleteBill(pendingDeleteId)
      if (res && res.success === false) {
        alert(res.error || "Failed to delete invoice.")
      } else {
        setPendingDeleteId(null)
        setSecurityAction(null)
        await loadData()
      }
    } else if (securityAction === 'save_edit' && pendingEditPayload) {
      // The user successfully authenticated to save the edit. Let's call handleSaveBill again to process it.
      handleSaveBill()
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentModalBill) return
    setPaymentError("")
    const amt = parseFloat(paymentAmountInput)
    if (isNaN(amt) || amt <= 0) {
      setPaymentError("Please enter a valid amount greater than 0.")
      return
    }
    setIsSubmittingPayment(true)
    try {
      const res = await recordBillPayment(paymentModalBill.id, amt)
      if (res && res.success === false) {
        setPaymentError(res.error || "Failed to record payment.")
        return
      }
      const targetBillId = paymentModalBill.id
      setPaymentModalBill(null)
      setPaymentAmountInput("")
      await loadData()
      // Refresh selected bill view if open using updated state
      if (selectedBillForView && selectedBillForView.id === targetBillId) {
        setBills(currentBills => {
          const match = currentBills.find((b: any) => b.id === targetBillId)
          if (match) setSelectedBillForView(match)
          return currentBills
        })
      }
    } catch (err: any) {
      setPaymentError(err?.message || "Failed to record payment.")
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const getDaysAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "1 day ago"
    return `${days} days ago`
  }

  // Customer Groups for Pending Bills
  const customerGroups = useMemo(() => {
    const map = new Map<string, {
      customerName: string
      customerPhone?: string
      totalDue: number
      totalAmount: number
      bills: any[]
      oldestDate: string
    }>()

    bills.forEach(bill => {
      if ((bill.balanceDue || 0) > 0) {
        const nameKey = (bill.customerName || "Walk-in Customer").trim().toLowerCase()
        const existing = map.get(nameKey)
        const billTotal = bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount

        if (!existing) {
          map.set(nameKey, {
            customerName: bill.customerName || "Walk-in Customer",
            customerPhone: bill.customerPhone || "",
            totalDue: bill.balanceDue || 0,
            totalAmount: billTotal || 0,
            bills: [bill],
            oldestDate: bill.createdAt
          })
        } else {
          existing.totalDue += (bill.balanceDue || 0)
          existing.totalAmount += (billTotal || 0)
          if (bill.customerPhone && !existing.customerPhone) {
            existing.customerPhone = bill.customerPhone
          }
          existing.bills.push(bill)
          if (new Date(bill.createdAt) < new Date(existing.oldestDate)) {
            existing.oldestDate = bill.createdAt
          }
        }
      }
    })

    // Sort bills in each group oldest first (FIFO order)
    const list = Array.from(map.values()).map(g => ({
      ...g,
      bills: g.bills.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }))

    // Sort customer groups by highest balance due first
    return list.sort((a, b) => b.totalDue - a.totalDue)
  }, [bills])

  const totalPendingDues = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.balanceDue || 0), 0)
  }, [bills])

  const totalPendingBillsCount = useMemo(() => {
    return bills.filter(b => (b.balanceDue || 0) > 0).length
  }, [bills])

  // FIFO payment distribution across customer's pending bills
  const handleCustomerPayment = async () => {
    if (!customerPaymentModal) return
    setCustomerPaymentError("")
    let remainingAmount = parseFloat(customerPaymentAmount)
    if (isNaN(remainingAmount) || remainingAmount <= 0) {
      setCustomerPaymentError("Please enter a valid amount greater than 0.")
      return
    }
    if (remainingAmount > customerPaymentModal.totalDue + 0.05) {
      setCustomerPaymentError(`Amount cannot exceed total balance due (₹${customerPaymentModal.totalDue.toFixed(2)})`)
      return
    }

    setIsSubmittingCustomerPayment(true)
    try {
      // Settle oldest bills first
      const sortedBills = [...customerPaymentModal.bills].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      for (const b of sortedBills) {
        if (remainingAmount <= 0.009) break
        const billDue = b.balanceDue || 0
        if (billDue <= 0) continue
        const paymentForThisBill = Math.min(remainingAmount, billDue)
        const res: any = await recordBillPayment(b.id, paymentForThisBill)
        if (res && res.success === false) {
          throw new Error(res.error || `Failed to record payment for invoice ${b.invoiceNo}`)
        }
        remainingAmount -= paymentForThisBill
      }

      setCustomerPaymentModal(null)
      setCustomerPaymentAmount("")
      await loadData()
    } catch (err: any) {
      setCustomerPaymentError(err?.message || "Failed to record customer payment.")
    } finally {
      setIsSubmittingCustomerPayment(false)
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
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" 
            style={{ background: 'rgba(10,30,25,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsAddRouteOpen(false)
                resetForm()
              }
            }}
          >
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 15 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 15 }}
               transition={{ duration: 0.2 }}
               className="w-full max-w-5xl my-auto bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
            >
               {/* Modal Header */}
               <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#1F6F5F]/5 shrink-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#1F6F5F] flex items-center gap-2">
                     <Receipt className="w-5 h-5 text-[#2FA084]" />
                     {editingBill ? `Edit Invoice (${editingBill.invoiceNo || 'Draft'})` : 'Create Invoice Draft'}
                  </h2>
                  <button 
                     type="button"
                     onClick={() => { setIsAddRouteOpen(false); resetForm(); }}
                     className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl transition-colors cursor-pointer"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Modal Content - Scrollable Body */}
               <div className="p-6 overflow-y-auto space-y-6 flex-1">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Customer Name</label>
                       <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Walk-in Customer" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input text-sm font-medium" />
                   </div>

                   <div className="space-y-1.5">
                       <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Customer Phone</label>
                        <input type="tel" inputMode="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 9876543210 (Optional)" className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all placeholder:text-[#111111]/30 skeu-input text-sm font-medium" />
                    </div>

                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111111]/60 uppercase tracking-wide">Invoice Date</label>
                       <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-[#111111] outline-none transition-all skeu-input text-sm font-medium" />
                   </div>
                 </div>

                 {/* Items Container */}
                 <div className="border border-gray-200 rounded-xl bg-white pb-24 sm:pb-28">
                    {/* Desktop Table View (sm:block) */}
                    <div className="hidden sm:block overflow-visible">
                       <div className="min-w-[620px]">
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
                                            updateBillItem(bi.tempId, {
                                              name: e.target.value,
                                              itemId: null,
                                              showSuggestions: true
                                            });
                                          }}
                                          onFocus={() => updateBillItem(bi.tempId, 'showSuggestions', true)}
                                          onBlur={() => setTimeout(() => updateBillItem(bi.tempId, 'showSuggestions', false), 200)}
                                          placeholder="Type item name..." 
                                          className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-2 text-[#111111] text-sm outline-none transition-all font-medium" 
                                        />
                                        
                                        {/* Ad-hoc toggle slider beside description when not an inventory item */}
                                        {!bi.itemId && (
                                          <div className="relative flex items-center bg-slate-100/90 border border-slate-200/80 rounded-full p-0.5 w-[110px] h-8 shrink-0 select-none overflow-hidden" title="Categorize ad-hoc tile or sanitary item">
                                            <div 
                                              className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                                              style={{
                                                width: '32px',
                                                left: bi.adhocMode === 'tile' ? '2px' : 
                                                      bi.adhocMode === 'sanitary' ? '72px' : '37px',
                                                background: bi.adhocMode === 'tile' ? 'linear-gradient(135deg, #1F6F5F 0%, #2FA084 100%)' :
                                                            bi.adhocMode === 'sanitary' ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : '#cbd5e1',
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'tile')}
                                              className={`w-[35px] h-full text-center text-[9px] font-black z-10 transition-colors cursor-pointer ${bi.adhocMode === 'tile' ? 'text-white' : 'text-slate-500'}`}
                                            >Tile</button>
                                            <button
                                              type="button"
                                              onClick={() => updateBillItem(bi.tempId, 'adhocMode', null)}
                                              className={`w-[35px] h-full text-center text-[8px] font-black z-10 transition-colors cursor-pointer ${!bi.adhocMode ? 'text-white' : 'text-slate-400'}`}
                                            >off</button>
                                            <button
                                              type="button"
                                              onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'sanitary')}
                                              className={`w-[35px] h-full text-center text-[9px] font-black z-10 transition-colors cursor-pointer ${bi.adhocMode === 'sanitary' ? 'text-white' : 'text-slate-500'}`}
                                            >San</button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Inventory Suggestions Dropdown */}
                                      {bi.showSuggestions && (
                                        <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                                           {inventory
                                             .filter(i => {
                                               const term = (bi?.name || "").trim().toLowerCase();
                                               if (!term) return true;
                                               return (i?.name || "").trim().toLowerCase().includes(term) || 
                                                      (i?.category || "").trim().toLowerCase().includes(term) ||
                                                      (i?.type || "").trim().toLowerCase().includes(term) ||
                                                      (i?.size || "").trim().toLowerCase().includes(term);
                                             })
                                             .map(item => (
                                               <button 
                                                 key={item.id} 
                                                 type="button" 
                                                 onClick={() => selectInventoryItem(bi.tempId, item)}
                                                 className="w-full text-left px-3.5 py-2.5 hover:bg-[#1F6F5F]/5 border-b border-gray-100 last:border-0 transition-colors flex justify-between items-center group cursor-pointer"
                                               >
                                                 <div>
                                                   <div className="flex items-center gap-2">
                                                     <p className="text-sm font-bold text-[#111111] group-hover:text-[#1F6F5F] transition-colors">{item.name}</p>
                                                     <span className="text-[9px] font-black text-[#111111]/30 uppercase">{item.category}</span>
                                                   </div>
                                                   <p className="text-[10px] text-[#111111]/40 font-medium">Stock: {item.stockLevel} {item.unit}s {item.size ? `• ${item.size}` : ''} {item.type ? `• ${item.type}` : ''}</p>
                                                 </div>
                                                 <span className="text-xs font-black text-[#1F6F5F]">₹{item.price}</span>
                                               </button>
                                             ))
                                           }
                                        </div>
                                      )}
                                   </div>

                                   <div className="w-24">
                                      <select 
                                        value={bi.unit} 
                                        onChange={e => updateBillItem(bi.tempId, 'unit', e.target.value)}
                                        className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 text-[#111111] text-xs outline-none font-bold text-center cursor-pointer"
                                      >
                                         <option value="box">BOX</option>
                                         <option value="pc">PCS</option>
                                      </select>
                                   </div>

                                   <div className="w-24">
                                      <input 
                                        type="number" 
                                        inputMode="numeric"
                                        min="1" 
                                        value={bi.quantity} 
                                        onChange={e => {
                                          const val = e.target.value;
                                          updateBillItem(bi.tempId, 'quantity', val === "" ? "" : (parseInt(val) || 0));
                                        }} 
                                        className="w-full text-center bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 text-[#111111] text-sm outline-none font-bold hide-arrows" 
                                      />
                                   </div>

                                   <div className="w-32">
                                      <input 
                                        type="number" 
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0" 
                                        value={bi.price} 
                                        onChange={e => {
                                          const val = e.target.value;
                                          updateBillItem(bi.tempId, 'price', val === "" ? "" : (parseFloat(val) || 0));
                                        }} 
                                        className="w-full text-right bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 px-2 text-[#111111] text-sm outline-none font-bold hide-arrows" 
                                      />
                                   </div>

                                   <div className="w-32 text-right pr-4 py-2 font-black text-sm text-[#1F6F5F]">
                                      ₹{(Number(bi.quantity) * Number(bi.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                   </div>

                                   <div className="w-10 text-center">
                                      <button type="button" onClick={() => setBillItems(billItems.filter(i => i.tempId !== bi.tempId))} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete Row"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Mobile Card List View (sm:hidden) */}
                    <div className="sm:hidden divide-y divide-gray-100">
                       {billItems.map((bi) => (
                          <div key={bi.tempId} className="p-3.5 bg-white space-y-3 relative">
                             {/* Row 1: Full-Width Item Description Input */}
                             <div className="space-y-1" ref={el => { dropdownRefs.current[bi.tempId] = el }}>
                                <label className="text-[9px] font-bold text-[#111111]/40 uppercase block">Item Description</label>
                                <input 
                                  value={bi.name} 
                                  onChange={e => {
                                    updateBillItem(bi.tempId, {
                                      name: e.target.value,
                                      itemId: null,
                                      showSuggestions: true
                                    });
                                  }}
                                  onFocus={() => updateBillItem(bi.tempId, 'showSuggestions', true)}
                                  onBlur={() => setTimeout(() => updateBillItem(bi.tempId, 'showSuggestions', false), 200)}
                                  placeholder="Type item name..." 
                                  className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-2 text-[#111111] text-sm outline-none transition-all font-medium" 
                                />

                                {/* Mobile Suggestions Dropdown */}
                                {bi.showSuggestions && (
                                  <div className="absolute z-[100] left-3 right-3 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                     {inventory
                                       .filter(i => {
                                         const term = (bi?.name || "").trim().toLowerCase();
                                         if (!term) return true;
                                         return (i?.name || "").trim().toLowerCase().includes(term) || 
                                                (i?.category || "").trim().toLowerCase().includes(term) ||
                                                (i?.type || "").trim().toLowerCase().includes(term) ||
                                                (i?.size || "").trim().toLowerCase().includes(term);
                                       })
                                       .map(item => (
                                         <button 
                                           key={item.id} 
                                           type="button" 
                                           onClick={() => selectInventoryItem(bi.tempId, item)}
                                           className="w-full text-left p-3 hover:bg-[#1F6F5F]/5 border-b border-gray-100 last:border-0 transition-colors"
                                         >
                                           <div className="flex justify-between items-start mb-0.5">
                                             <p className="text-xs font-bold text-[#111111]">{item.name}</p>
                                             <span className="text-xs font-black text-[#1F6F5F]">₹{item.price}</span>
                                           </div>
                                           <div className="flex items-center gap-2">
                                             <span className="text-[9px] font-black text-[#111111]/30 uppercase">{item.category}</span>
                                           </div>
                                           <p className="text-[10px] text-[#111111]/40 font-medium">Stock: {item.stockLevel} {item.unit}s {item.size ? `• ${item.size}` : ''} {item.type ? `• ${item.type}` : ''}</p>
                                         </button>
                                       ))
                                     }
                                  </div>
                                )}
                             </div>

                             {/* Row 2: Category Slider + Unit Selector Beside It */}
                             <div className="flex items-end justify-between gap-3 pt-1">
                                {!bi.itemId ? (
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-[#111111]/40 uppercase block">Category Track</label>
                                    <div className="relative flex items-center bg-slate-100/90 border border-slate-200/80 rounded-full p-0.5 w-[110px] h-8 shrink-0 select-none overflow-hidden">
                                      <div 
                                        className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                                        style={{
                                          width: '32px',
                                          left: bi.adhocMode === 'tile' ? '2px' : 
                                                bi.adhocMode === 'sanitary' ? '72px' : '37px',
                                          background: bi.adhocMode === 'tile' ? 'linear-gradient(135deg, #1F6F5F 0%, #2FA084 100%)' :
                                                      bi.adhocMode === 'sanitary' ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : '#cbd5e1',
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'tile')}
                                        className={`w-[35px] h-full text-center text-[9px] font-black z-10 transition-colors ${bi.adhocMode === 'tile' ? 'text-white' : 'text-slate-500'}`}
                                      >Tile</button>
                                      <button
                                        type="button"
                                        onClick={() => updateBillItem(bi.tempId, 'adhocMode', null)}
                                        className={`w-[35px] h-full text-center text-[8px] font-black z-10 transition-colors ${!bi.adhocMode ? 'text-white' : 'text-slate-400'}`}
                                      >off</button>
                                      <button
                                        type="button"
                                        onClick={() => updateBillItem(bi.tempId, 'adhocMode', 'sanitary')}
                                        className={`w-[35px] h-full text-center text-[9px] font-black z-10 transition-colors ${bi.adhocMode === 'sanitary' ? 'text-white' : 'text-slate-500'}`}
                                      >San</button>
                                    </div>
                                  </div>
                                ) : <div />}

                                <div className="w-28 space-y-1">
                                   <label className="text-[9px] font-bold text-[#111111]/40 uppercase block">Unit</label>
                                   <select 
                                     value={bi.unit} 
                                     onChange={e => updateBillItem(bi.tempId, 'unit', e.target.value)}
                                     className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-1.5 text-[#111111] text-xs outline-none font-bold text-center cursor-pointer"
                                   >
                                      <option value="box">BOX</option>
                                      <option value="pc">PCS</option>
                                   </select>
                                </div>
                             </div>

                             {/* Row 3: Qty + Price (₹) + Delete button */}
                             <div className="grid grid-cols-12 gap-3 items-end pt-1">
                                <div className="col-span-6 space-y-1">
                                   <label className="text-[9px] font-bold text-[#111111]/40 uppercase block">QTY</label>
                                   <div className="flex items-center gap-1">
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const current = Number(bi.quantity) || 0
                                         if (current > 1) updateBillItem(bi.tempId, 'quantity', current - 1)
                                       }}
                                       className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all text-base cursor-pointer"
                                       title="Decrease 1"
                                     >
                                       -
                                     </button>
                                     <input 
                                       type="number" 
                                       inputMode="numeric"
                                       min="1" 
                                       value={bi.quantity} 
                                       onChange={e => {
                                         const val = e.target.value;
                                         updateBillItem(bi.tempId, 'quantity', val === "" ? "" : (parseInt(val) || 0));
                                       }} 
                                       className="w-full text-center bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 text-[#111111] text-sm outline-none font-bold hide-arrows" 
                                     />
                                     <button
                                       type="button"
                                       onClick={() => {
                                         const current = Number(bi.quantity) || 0
                                         updateBillItem(bi.tempId, 'quantity', current + 1)
                                       }}
                                       className="w-8 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center shrink-0 active:scale-95 transition-all text-base cursor-pointer"
                                       title="Increase 1"
                                     >
                                       +
                                     </button>
                                   </div>
                                </div>

                                <div className="col-span-4 space-y-1">
                                   <label className="text-[9px] font-bold text-[#111111]/40 uppercase block">PRICE (₹)</label>
                                   <input 
                                     type="number" 
                                     inputMode="decimal"
                                     step="0.01"
                                     min="0" 
                                     value={bi.price} 
                                     onChange={e => {
                                       const val = e.target.value;
                                       updateBillItem(bi.tempId, 'price', val === "" ? "" : (parseFloat(val) || 0));
                                     }} 
                                     className="w-full text-right bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg py-2 px-2 text-[#111111] text-sm outline-none font-bold hide-arrows" 
                                   />
                                </div>

                                <div className="col-span-2 flex justify-end">
                                   <button type="button" onClick={() => setBillItems(billItems.filter(i => i.tempId !== bi.tempId))} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer" title="Delete Row"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </div>

                             {/* Row 4: Subtotal line */}
                             <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100 text-xs">
                                <span className="font-bold text-[#111111]/40">Subtotal:</span>
                                <span className="font-black text-sm text-[#1F6F5F]">₹{(Number(bi.quantity) * Number(bi.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                    
                 {/* Add Row Button */}
                 <div className="p-4 bg-gray-50/50 border border-gray-200 border-dashed rounded-xl">
                    <button 
                      type="button" 
                      onClick={addNewRow}
                      className="flex items-center gap-2 text-[#1F6F5F] hover:text-[#2FA084] font-black text-xs uppercase tracking-widest transition-all hover:translate-x-1 cursor-pointer"
                    >
                       <Plus className="w-4 h-4" />
                       Add New Item Line
                    </button>
                 </div>

                 {validationError && (
                   <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {validationError}
                   </div>
                 )}
               </div>

               {/* Modal Footer - Fixed */}
               <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 shrink-0">
                  <div className="flex flex-wrap gap-6 items-center justify-between sm:justify-start">
                     <div>
                        <p className="text-[10px] text-[#111111]/50 uppercase tracking-widest font-bold">Total Net Amount</p>
                        <p className="text-xl sm:text-2xl font-black text-[#1F6F5F]">₹{billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}</p>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider block">Final Net Amount (₹)</label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder={billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}
                          value={finalNetAmountInput}
                          onChange={e => setFinalNetAmountInput(e.target.value)}
                          className="w-36 sm:w-40 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-1.5 text-sm font-bold outline-none text-right shadow-sm hide-arrows"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#111111]/60 uppercase tracking-wider block">Advance Received (₹)</label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder={finalNetAmountInput || billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0).toFixed(2)}
                          value={amountPaidInput}
                          onChange={e => setAmountPaidInput(e.target.value)}
                          className="w-36 sm:w-40 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 py-1.5 text-sm font-bold outline-none text-right shadow-sm hide-arrows"
                        />
                     </div>
                     {amountPaidInput && Number(amountPaidInput) < (Number(finalNetAmountInput) || billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)) && (
                        <div className="hidden sm:block">
                           <p className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Balance Due</p>
                           <p className="text-xl font-black text-orange-500">
                             ₹{((Number(finalNetAmountInput) || billItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)) - Number(amountPaidInput)).toFixed(2)}
                           </p>
                        </div>
                      )}
                  </div>
                  <div className="flex gap-3 items-center justify-end w-full sm:w-auto">
                     <button type="button" onClick={() => { setIsAddRouteOpen(false); resetForm(); }} className="px-4 py-2.5 rounded-lg text-[#111111]/60 hover:text-[#111111] font-medium transition-colors cursor-pointer text-sm">Cancel</button>
                     <button onClick={handleSaveBill} disabled={!customerName || billItems.length === 0 || isSubmitting} className="flex-1 sm:flex-none text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm text-center" style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', border: '1px solid rgba(0,0,0,0.12)' }}>
                        {isSubmitting ? 'Saving...' : (editingBill ? 'Update & Sync Stock' : 'Finalize & Deduct Stock')}
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Register */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 6px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)' }}>
        <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(180deg, rgba(31,111,95,0.04) 0%, rgba(31,111,95,0.02) 100%)' }}>
           <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 pr-4 sm:border-r border-[#1F6F5F]/10">
               <Receipt className="w-5 h-5 text-[#2FA084]" />
               <h2 className="text-lg font-bold text-[#1F6F5F]">Invoices</h2>
             </div>
             
             {/* Slider Tab Filter */}
             <div className="relative flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-max">
                <div 
                  className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out"
                  style={{
                    width: activeTab === 'All' ? '100px' : '110px',
                    left: activeTab === 'All' ? '4px' : '104px',
                    background: '#1F6F5F',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("All")}
                  className={`relative z-10 w-[100px] py-1.5 text-xs font-bold transition-colors cursor-pointer ${activeTab === 'All' ? 'text-white' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
                >
                  All Invoices
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Pending")}
                  className={`relative z-10 w-[110px] py-1.5 text-xs font-bold transition-colors cursor-pointer ${activeTab === 'Pending' ? 'text-white' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
                >
                  Pending Bills
                </button>
             </div>
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
        
        {/* Executive Dues Exposure Deck (Only on Pending Bills Tab) */}
        {activeTab === 'Pending' && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/5 via-[#1F6F5F]/5 to-transparent border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Total Market Dues</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-700 font-tabular mt-1.5">
                  ₹{totalPendingDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Total uncollected across all accounts</p>
              </div>

              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#1F6F5F] uppercase tracking-wider">Parties with Dues</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-[#1F6F5F]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-[#1F6F5F] font-tabular mt-1.5">
                  {customerGroups.length} <span className="text-xs font-bold text-gray-500">Parties</span>
                </p>
                <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Contractors, builders & customers</p>
              </div>

              <div className="bg-white/95 backdrop-blur rounded-2xl p-4 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Total Unpaid Invoices</span>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-gray-800 font-tabular mt-1.5">
                  {totalPendingBillsCount} <span className="text-xs font-bold text-gray-500">Invoices</span>
                </p>
                <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Across {customerGroups.length} customer accounts</p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Mode:</span>
                <div className="inline-flex p-0.5 bg-white border border-gray-200 rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setPendingViewMode("customer")}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${pendingViewMode === 'customer' ? 'bg-[#1F6F5F] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    By Customer (Combined)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingViewMode("bills")}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${pendingViewMode === 'bills' ? 'bg-[#1F6F5F] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    By Invoices (Single)
                  </button>
                </div>
              </div>

              <p className="text-[11px] font-medium text-gray-500">
                {pendingViewMode === 'customer' 
                  ? 'Combining multiple bills per customer into single balance accounts' 
                  : 'Showing all individual unpaid invoice rows'}
              </p>
            </div>
          </div>
        )}

        {!(activeTab === 'Pending' && pendingViewMode === 'customer') && (
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 text-[11px] font-black text-[#111111] uppercase tracking-widest" style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)' }}>
          <div className="col-span-2">Invoice No</div>
          <div className={activeTab === 'Pending' ? "col-span-2" : "col-span-3"}>Customer Details</div>
          <div className={activeTab === 'Pending' ? "col-span-2 text-center" : "col-span-3 text-center"}>Total Amount</div>
          {activeTab === 'Pending' && <div className="col-span-2 text-center">Balance Due</div>}
          <div className="col-span-2 text-center">Receipt</div>
          <div className="col-span-2 text-center">Actions</div>
        </div>
        )}

        <div className="divide-y divide-gray-300 border-t border-b border-gray-300">
          {activeTab === 'Pending' && pendingViewMode === 'customer' ? (
            <div className="divide-y divide-gray-200">
              {(() => {
                const filteredGroups = customerGroups.filter(g => {
                  if (!billSearch.trim()) return true
                  const q = billSearch.toLowerCase().trim()
                  return g.customerName.toLowerCase().includes(q) || 
                         (g.customerPhone && g.customerPhone.includes(q)) ||
                         g.bills.some(b => b.invoiceNo && b.invoiceNo.toLowerCase().includes(q))
                })

                if (loading) {
                  return <div className="p-10 text-center text-[#111111]/40 font-medium">Fetching customer accounts...</div>
                }

                if (customerGroups.length === 0) {
                  return (
                    <div className="p-16 text-center text-[#111111]/40">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-bold text-base text-[#111111]/80">No Pending Customer Dues!</p>
                      <p className="text-xs text-gray-500 mt-1">All sales and contractor invoices have been fully paid.</p>
                    </div>
                  )
                }

                if (filteredGroups.length === 0) {
                  return <div className="p-16 text-center text-[#111111]/40 font-medium italic">No customer accounts match your search.</div>
                }

                return filteredGroups.map((g, i) => (
                  <FadeIn key={g.customerName} delay={i * 0.02}>
                    <div className="p-4 sm:p-5 hover:bg-gray-50/70 transition-colors">
                      {/* Main Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[#1F6F5F]/10 text-[#1F6F5F] border border-[#2FA084]/20 flex items-center justify-center font-black text-sm shrink-0 uppercase shadow-xs">
                            {g.customerName.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-[#111111] truncate">{g.customerName}</h3>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                                {g.bills.length} {g.bills.length === 1 ? 'Bill' : 'Bills'} Pending
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium flex-wrap">
                              {g.customerPhone ? (
                                <a href={`tel:${g.customerPhone}`} className="inline-flex items-center gap-1 text-[#1F6F5F] font-bold hover:underline">
                                  <Phone className="w-3 h-3" /> {g.customerPhone}
                                </a>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">No phone</span>
                              )}
                              <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                                <Clock className="w-3 h-3 text-gray-400" /> Oldest: {getDaysAgo(g.oldestDate)} ({formatDate(g.oldestDate)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Financials & Primary Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Total Balance Due</p>
                            <p className="text-lg sm:text-xl font-black text-amber-700 font-tabular leading-tight">
                              ₹{g.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              Invoiced: ₹{g.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerPaymentModal(g)
                                setCustomerPaymentAmount(String(g.totalDue))
                                setCustomerPaymentError("")
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-black text-white active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                              title="Settle balance across all bills (FIFO)"
                            >
                              <Wallet className="w-3.5 h-3.5" /> Settle Dues
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCustomers(prev => ({
                                  ...prev,
                                  [g.customerName]: !prev[g.customerName]
                                }))
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="Toggle bill breakdown"
                            >
                              <span>Invoices ({g.bills.length})</span>
                              {expandedCustomers[g.customerName] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Bills Breakdown Accordion */}
                      {expandedCustomers[g.customerName] && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 bg-gray-50/80 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 px-2">
                            <span>Individual Unpaid Invoices for {g.customerName}</span>
                            <span>Oldest to Newest</span>
                          </div>
                          <div className="divide-y divide-gray-200/80 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                            {g.bills.map(bill => {
                              const finalAmt = bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount
                              return (
                                <div key={bill.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#1F6F5F] flex items-center justify-center font-bold text-xs shrink-0">
                                      <Receipt className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-[#1F6F5F]">{bill.invoiceNo || 'Draft'}</span>
                                        <span className="text-[10px] text-gray-400 font-semibold">{formatDate(bill.createdAt)} ({getDaysAgo(bill.createdAt)})</span>
                                      </div>
                                      <p className="text-[11px] text-gray-500 font-medium">
                                        Total: ₹{finalAmt.toFixed(2)} • Paid: ₹{(bill.amountPaid || 0).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                    <div className="text-left sm:text-right">
                                      <span className="text-[9px] font-black uppercase text-amber-700 block">Due</span>
                                      <span className="text-sm font-black text-amber-700 font-tabular">₹{bill.balanceDue.toFixed(2)}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedBillForView(bill)}
                                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPaymentModalBill(bill)
                                          setPaymentAmountInput(String(bill.balanceDue))
                                          setPaymentError("")
                                        }}
                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors border border-amber-200 cursor-pointer"
                                      >
                                        + Pay
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </FadeIn>
                ))
              })()}
            </div>
          ) : (() => {
            const filteredBills = bills.filter(b => {
              const matchesSearch = b.customerName.toLowerCase().includes(billSearch.toLowerCase()) || (b.invoiceNo && b.invoiceNo.toLowerCase().includes(billSearch.toLowerCase()))
              const matchesDate = !dateFilter || new Date(b.createdAt).toISOString().substring(0, 10) === dateFilter
              const matchesTab = activeTab === 'All' || (activeTab === 'Pending' && (b.balanceDue || 0) > 0)
              return matchesSearch && matchesDate && matchesTab
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
                    {/* Desktop Row */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#EEEEEE]/40 transition-colors group">
                      <div className="col-span-2">
                        <p className="font-black text-[#1F6F5F] text-xs tracking-tighter">{bill.invoiceNo}</p>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-[#111111]/30">#{bill.id.slice(0, 4)}</p>
                      </div>

                      <div className={activeTab === 'Pending' ? "col-span-2" : "col-span-3"}>
                        <p className="font-bold text-[#111111] truncate">{bill.customerName}</p>
                        {bill.customerPhone && (
                          <p className="text-[10px] text-[#111111]/60 font-semibold">{bill.customerPhone}</p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider font-bold text-[#111111]/40 mt-0.5">
                          {formatDate(bill.createdAt)} • {new Date(bill.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>

                      <div className={activeTab === 'Pending' ? "col-span-2 text-center" : "col-span-3 text-center"}>
                          <p className="font-black text-sm text-[#1F6F5F]">
                            ₹{(bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount).toFixed(2)}
                          </p>
                          <div className="mt-1 flex justify-center">
                            {bill.balanceDue > 0 ? (
                              bill.amountPaid > 0 ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  PARTIAL (Due ₹{bill.balanceDue.toFixed(2)})
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                  UNPAID
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                PAID
                              </span>
                            )}
                          </div>
                      </div>

                      {activeTab === 'Pending' && (
                        <div className="col-span-2 text-center flex flex-col items-center justify-center">
                          {bill.balanceDue > 0 ? (
                            <p className="font-black text-sm text-amber-600">
                              ₹{bill.balanceDue.toFixed(2)}
                            </p>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">PAID</span>
                          )}
                        </div>
                      )}

                      <div className="col-span-2 text-center flex justify-center items-center gap-1.5">
                        <button 
                            onClick={() => setSelectedBillForView(bill)} 
                            className="px-2.5 py-1.5 bg-[#2FA084]/10 hover:bg-[#2FA084]/20 text-[#1F6F5F] text-xs font-bold rounded-lg transition-colors border border-[#2FA084]/20 whitespace-nowrap cursor-pointer shadow-sm"
                        >
                            View
                        </button>
                        <button 
                            onClick={() => handleWhatsAppShare(bill)} 
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors border border-emerald-200 cursor-pointer shadow-sm"
                            title="Send invoice via WhatsApp"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {bill.balanceDue > 0 && (
                          <button 
                              onClick={() => { setPaymentModalBill(bill); setPaymentAmountInput(""); setPaymentError(""); }} 
                              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors border border-amber-200 whitespace-nowrap cursor-pointer shadow-sm flex items-center gap-1"
                              title="Record Advance Payment"
                          >
                              + Pay
                          </button>
                        )}
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

                    {/* Mobile Card */}
                    <div className="md:hidden p-4 hover:bg-gray-50/50 transition-colors space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#1F6F5F] text-sm">{bill.invoiceNo}</span>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#111111]/30">#{bill.id.slice(0, 4)}</span>
                          </div>
                          <p className="font-bold text-[#111111] text-sm mt-0.5">{bill.customerName}</p>
                          {bill.customerPhone && (
                            <p className="text-xs text-[#111111]/60 font-semibold">{bill.customerPhone}</p>
                          )}
                          <p className="text-[10px] text-[#111111]/40 font-semibold mt-0.5">
                            {formatDate(bill.createdAt)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-black text-base text-[#1F6F5F]">
                            ₹{(bill.finalNetAmount !== null && bill.finalNetAmount !== undefined ? bill.finalNetAmount : bill.totalAmount).toFixed(2)}
                          </p>
                          <div className="mt-1 flex flex-col items-end gap-0.5">
                            {bill.balanceDue > 0 ? (
                              bill.amountPaid > 0 ? (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Due: ₹{bill.balanceDue.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  UNPAID
                                </span>
                              )
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                PAID
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setSelectedBillForView(bill)} 
                            className="px-3 py-1.5 bg-[#2FA084]/10 text-[#1F6F5F] text-xs font-bold rounded-lg transition-colors border border-[#2FA084]/20"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleWhatsAppShare(bill)}
                            className="p-2 bg-emerald-50 text-emerald-700 rounded-lg transition-colors border border-emerald-200 flex items-center justify-center cursor-pointer"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          {bill.balanceDue > 0 && (
                            <button 
                              onClick={() => { setPaymentModalBill(bill); setPaymentAmountInput(""); setPaymentError(""); }}
                              className="px-2.5 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg transition-colors border border-amber-200"
                            >
                              + Pay
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditBill(bill)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#1F6F5F] bg-gray-100 rounded-lg"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => requestDeleteBill(bill.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Del
                          </button>
                        </div>
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

      {/* Admin gate for deleting/editing invoices */}
      <SecurityGate 
        isOpen={isSecurityGateOpen} 
        onClose={() => { setIsSecurityGateOpen(false); setPendingDeleteId(null); setPendingEditBill(null); setSecurityAction(null); }} 
        onSuccess={handleSecuritySuccess} 
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
                      
                      {/* Advance Payments Breakdown */}
                      {(() => {
                        const payments = selectedBillForView.payments || [];
                        const hasPayments = payments.length > 0;
                        const initialAmount = selectedBillForView.amountPaid || 0;

                        if (hasPayments || initialAmount > 0) {
                          return (
                            <div className="my-2.5 pt-2 border-t border-dashed border-gray-300 space-y-1">
                              <p className="text-[9px] font-black uppercase text-[#111111]/40 tracking-wider mb-1">Advance Payments Breakdown</p>
                              
                              {hasPayments ? (
                                payments.map((p: any, idx: number) => (
                                  <div key={p.id || idx} className="flex justify-between items-center text-[11px] text-[#111111]/80">
                                    <span>Advance Paid {idx + 1} ({formatDate(p.createdAt)})</span>
                                    <span className="font-bold text-[#1F6F5F]">₹{p.amount.toFixed(2)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-between items-center text-[11px] text-[#111111]/80">
                                  <span>Advance Paid 1 ({formatDate(selectedBillForView.createdAt)})</span>
                                  <span className="font-bold text-[#1F6F5F]">₹{initialAmount.toFixed(2)}</span>
                                </div>
                              )}

                              <div className="flex justify-between items-center font-bold text-xs pt-1.5 border-t border-gray-100">
                                <span className="uppercase text-[#111111]/60">Total Advance Paid</span>
                                <span className="text-[#1F6F5F]">₹{initialAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {selectedBillForView.balanceDue > 0 ? (
                        <div className="flex justify-between items-center text-orange-600 font-bold mt-2 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100">
                          <span className="uppercase tracking-wider text-xs">Balance Due</span>
                          <span className="text-sm">₹{selectedBillForView.balanceDue.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="text-center font-bold text-xs text-green-700 bg-green-50 py-1.5 rounded-lg mt-2 border border-green-100">
                          FULL PAYMENT COMPLETED
                        </div>
                      )}
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
              <div className="flex gap-2 justify-between items-center pt-4 border-t border-gray-100 mt-4 no-print">
                {selectedBillForView.balanceDue > 0 ? (
                  <button 
                    onClick={() => { setPaymentModalBill(selectedBillForView); setPaymentAmountInput(""); setPaymentError(""); }}
                    className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Pay Advance
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleWhatsAppShare(selectedBillForView)} 
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
                    title="Send invoice via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center gap-1.5 bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button 
                    onClick={() => setSelectedBillForView(null)} 
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#111111]/60 hover:text-[#111111] text-xs font-bold rounded-lg transition-colors border border-gray-200 shadow-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Advance Payment Modal */}
      <AnimatePresence>
        {paymentModalBill && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#2FA084]" /> Record Advance Payment
                </h3>
                <button onClick={() => setPaymentModalBill(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#111111]/50 font-medium">Customer:</span>
                  <span className="font-bold text-[#111111]">{paymentModalBill.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#111111]/50 font-medium">Invoice No:</span>
                  <span className="font-bold text-[#1F6F5F]">{paymentModalBill.invoiceNo}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-orange-600 font-bold">Current Balance Due:</span>
                  <span className="font-black text-orange-600">₹{paymentModalBill.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider">New Advance Amount Received (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={paymentModalBill.balanceDue}
                  autoFocus
                  placeholder={`Max ₹${paymentModalBill.balanceDue.toFixed(2)}`}
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-bold text-[#111111] outline-none focus:border-[#2FA084] hide-arrows"
                />
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {paymentError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setPaymentModalBill(null)} 
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecordPayment}
                  disabled={isSubmittingPayment || !paymentAmountInput || Number(paymentAmountInput) <= 0}
                  className="px-5 py-2.5 text-xs font-black text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                >
                  {isSubmittingPayment ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Customer Settle Dues Modal */}
      <AnimatePresence>
        {customerPaymentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white border border-gray-200 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#2FA084]" /> Settle Customer Dues
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{customerPaymentModal.customerName}</p>
                </div>
                <button onClick={() => setCustomerPaymentModal(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Customer Account:</span>
                  <span className="font-bold text-gray-900">{customerPaymentModal.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Pending Invoices:</span>
                  <span className="font-bold text-[#1F6F5F]">{customerPaymentModal.bills.length} Invoices</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200">
                  <span className="text-amber-900 font-bold">Total Combined Balance Due:</span>
                  <span className="font-black text-base text-amber-700 font-tabular">₹{customerPaymentModal.totalDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 font-medium">
                💡 Payment will automatically settle the customer's oldest pending bills first (FIFO).
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider">Amount Received (₹)</label>
                  <button
                    type="button"
                    onClick={() => setCustomerPaymentAmount(String(customerPaymentModal.totalDue))}
                    className="text-[10px] font-black text-[#1F6F5F] hover:underline"
                  >
                    Full Balance (₹{customerPaymentModal.totalDue.toFixed(2)})
                  </button>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="1"
                  max={customerPaymentModal.totalDue}
                  autoFocus
                  placeholder={`Max ₹${customerPaymentModal.totalDue.toFixed(2)}`}
                  value={customerPaymentAmount}
                  onChange={e => setCustomerPaymentAmount(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#2FA084] rounded-xl px-4 py-2.5 text-base font-black outline-none shadow-xs"
                />
              </div>

              {customerPaymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {customerPaymentError}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCustomerPaymentModal(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomerPayment}
                  disabled={isSubmittingCustomerPayment || !customerPaymentAmount || parseFloat(customerPaymentAmount) <= 0}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                >
                  {isSubmittingCustomerPayment ? 'Processing...' : 'Confirm & Settle Dues'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

