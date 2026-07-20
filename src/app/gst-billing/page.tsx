"use client"
import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  Search, 
  FileText, 
  Users, 
  Trash2, 
  Printer, 
  Save, 
  ChevronRight,
  UserPlus,
  AlertCircle,
  Building2,
  Phone,
  LocateFixed,
  ReceiptIndianRupee,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Edit,
  X,
  MoreHorizontal,
  Percent,
  ArrowRight,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaginationControls } from '@/components/common/PaginationControls'
import { 
  getBuyers, 
  upsertBuyer, 
  deleteBuyer, 
  createTaxInvoice, 
  getTaxInvoices,
  deleteTaxInvoice,
  updateTaxInvoice,
  getTaxProducts,
  upsertTaxProduct,
  deleteTaxProduct
} from '@/lib/actions'

const GST_RATES = [5, 12, 18]
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manitoba", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

function numberToWords(num: number): string {
  if (num === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  const helper = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '')
    if (n < 100000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '')
    if (n < 10000000) return helper(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + helper(n % 100000) : '')
    return helper(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + helper(n % 10000000) : '')
  }
  
  const mainPart = Math.floor(num)
  const paisaPart = Math.round((num - mainPart) * 100)
  
  let res = helper(mainPart) + ' Rupees'
  if (paisaPart > 0) {
    res += ' and ' + helper(paisaPart) + ' Paisa'
  }
  return res + ' Only'
}

export default function GSTBillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'buyers' | 'items'>('invoices')
  const [loading, setLoading] = useState(true)
  
  // Data States
  const [buyers, setBuyers] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [taxProducts, setTaxProducts] = useState<any[]>([])

  // UI States
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [gstinValid, setGstinValid] = useState<boolean | null>(null)
  const [printingInvoice, setPrintingInvoice] = useState<any>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab])

  const handlePrint = (invoice: any) => {
    setPrintingInvoice(invoice)
    setTimeout(() => {
      window.print()
      window.addEventListener('afterprint', () => setPrintingInvoice(null), { once: true })
    }, 500)
  }

  // Form States (Invoice)
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null)
  const [buyerSearch, setBuyerSearch] = useState('')
  const [showBuyerSuggestions, setShowBuyerSuggestions] = useState(false)
  const [taxType, setTaxType] = useState<'intra' | 'inter'>('intra')
  const [globalGstRate, setGlobalGstRate] = useState(18)
  const [manualGstNumber, setManualGstNumber] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualPlaceOfSupply, setManualPlaceOfSupply] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().substring(0, 10))
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [lineItems, setLineItems] = useState<any[]>([
    { tempId: Math.random().toString(36).substr(2, 9), name: '', size: '', unit: '', hsnCode: '', qty: '', rate: '' }
  ])
  const [vehicleNo, setVehicleNo] = useState('')
  const [transport, setTransport] = useState('')
  const [lrNo, setLrNo] = useState('')

  const getNextInvoiceNo = () => {
    if (invoices.length === 0) return '001'
    const maxNo = Math.max(...invoices.map(i => parseInt(i.invoiceNo.replace(/\D/g, '')) || 0))
    const nextNo = maxNo > 0 ? maxNo + 1 : 1
    return String(nextNo).padStart(3, '0')
  }

  const loadData = async () => {
    setLoading(true)
    const [bData, iData, pData] = await Promise.all([getBuyers(), getTaxInvoices(), getTaxProducts()])
    setBuyers(bData)
    setInvoices(iData)
    setTaxProducts(pData)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Invoice Calculations
  const totalBase = lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0)
  const isInterState = taxType === 'inter'
  
  const totalTax = (totalBase * globalGstRate) / 100
  const taxBreakdown = {
    cgst: isInterState ? 0 : totalTax / 2,
    sgst: isInterState ? 0 : totalTax / 2,
    igst: isInterState ? totalTax : 0
  }

  const grandTotal = totalBase + totalTax

  // GSTIN Validation Logic
  useEffect(() => {
    const val = manualGstNumber || selectedBuyer?.gstNumber || ''
    if (!val) {
      setGstinValid(null)
      return
    }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    setGstinValid(gstRegex.test(val))
  }, [manualGstNumber, selectedBuyer])

  // Filtering Logic
  const filteredInvoices = invoices.filter(inv => 
    inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStats = filteredInvoices.reduce((acc: any, inv: any) => {
    acc.base += inv.totalBaseAmount
    acc.tax += inv.totalTaxAmount
    acc.total += inv.grandTotal
    return acc
  }, { base: 0, tax: 0, total: 0 })

  const handleSaveInvoice = async () => {
    if (!selectedBuyer && !buyerSearch) return
    const invoiceData = {
      buyerId: selectedBuyer?.id,
      buyerName: selectedBuyer?.name || buyerSearch,
      buyerGst: manualGstNumber || selectedBuyer?.gstNumber,
      buyerAddress: manualAddress || selectedBuyer?.address,
      buyerPhone: manualPhone || selectedBuyer?.phone,
      placeOfSupply: manualPlaceOfSupply || (isInterState ? 'Inter-state' : 'Telangana'),
      paymentMode,
      invoiceNo,
      date: invoiceDate,
      totalBaseAmount: totalBase,
      totalTaxAmount: totalTax,
      grandTotal,
      vehicleNo,
      transport,
      lrNo,
      items: lineItems.map(item => ({
        name: item.name,
        size: item.size,
        unit: item.unit,
        hsnCode: item.hsnCode,
        quantity: Number(item.qty) || 0,
        price: Number(item.rate) || 0,
        taxRate: globalGstRate,
        taxAmount: (Number(item.qty) * Number(item.rate) * globalGstRate) / 100
      }))
    }
    
    if (editingInvoiceId) {
      await updateTaxInvoice(editingInvoiceId, invoiceData)
    } else {
      await createTaxInvoice(invoiceData)
    }
    
    setIsInvoiceFormOpen(false)
    resetInvoiceForm()
    loadData()
  }

  const handleEditInvoice = (inv: any) => {
    setEditingInvoiceId(inv.id)
    setInvoiceNo(inv.invoiceNo)
    setInvoiceDate(new Date(inv.date).toISOString().substring(0, 10))
    setBuyerSearch(inv.buyerName)
    setManualGstNumber(inv.buyerGst || '')
    setManualPhone(inv.buyerPhone || '')
    setManualPlaceOfSupply(inv.placeOfSupply || '')
    setManualAddress(inv.buyerAddress || '')
    setTaxType(inv.placeOfSupply === 'Telangana' ? 'intra' : 'inter')
    setPaymentMode(inv.paymentMode)
    setGlobalGstRate(inv.items[0]?.taxRate || 18)
    setVehicleNo(inv.vehicleNo || '')
    setTransport(inv.transport || '')
    setLrNo(inv.lrNo || '')
    setLineItems(inv.items.map((it: any) => ({
      tempId: Math.random().toString(36).substr(2, 9),
      name: it.name || '',
      size: it.size || '',
      unit: it.unit || '',
      hsnCode: it.hsnCode || '',
      qty: it.quantity || 0,
      rate: it.price || 0
    })))
    setIsInvoiceFormOpen(true)
  }

  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteTaxInvoice(id)
      loadData()
    }
  }

  const resetInvoiceForm = () => {
    setEditingInvoiceId(null)
    setInvoiceNo(getNextInvoiceNo())
    setInvoiceDate(new Date().toISOString().substring(0, 10))
    setSelectedBuyer(null)
    setBuyerSearch('')
    setManualGstNumber('')
    setManualPhone('')
    setManualPlaceOfSupply('')
    setManualAddress('')
    setTaxType('intra')
    setGlobalGstRate(18)
    setVehicleNo('')
    setTransport('')
    setLrNo('')
    setLineItems([{ tempId: Math.random().toString(36).substr(2, 9), name: '', size: '', hsnCode: '', qty: '', rate: '' }])
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="typo-h1 flex items-center gap-3">
             <ReceiptIndianRupee className="w-7 h-7 md:w-8 md:h-8" />
             GST Billing
          </h1>
          <p className="typo-body text-[#111111]/50">Create tax invoices and manage buyer records</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto overflow-x-auto">
           <button 
             onClick={() => setActiveTab('invoices')}
             className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'invoices' ? 'bg-[#1F6F5F] text-white shadow-md' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
           >
             Tax Invoices
           </button>
           <button 
             onClick={() => setActiveTab('buyers')}
             className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'buyers' ? 'bg-[#1F6F5F] text-white shadow-md' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
           >
             Buyers
           </button>
            <button 
              onClick={() => setActiveTab('items')}
              className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'items' ? 'bg-[#1F6F5F] text-white shadow-md' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
            >
              HSN Items
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'invoices' ? (
          <motion.div 
            key="invoices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {isInvoiceFormOpen ? (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Form Header */}
                <div className="bg-[#1F6F5F] text-white p-5 md:p-8 flex justify-between items-center">
                   <div>
                      <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">Generate Tax Invoice</h2>
                      <p className="opacity-70 text-xs font-bold uppercase tracking-widest mt-1">Professional Billing Mode</p>
                   </div>
                   <button onClick={() => setIsInvoiceFormOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="p-4 md:p-8">
                   {/* Buyer Selection */}
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                      <div className="col-span-2 relative">
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Buyer Name / Search</label>
                         <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111111]/20 w-5 h-5" />
                            <input 
                              value={buyerSearch}
                              onChange={e => {
                                setBuyerSearch(e.target.value)
                                setShowBuyerSuggestions(true)
                                if (selectedBuyer) setSelectedBuyer(null)
                              }}
                              onFocus={() => setShowBuyerSuggestions(true)}
                              className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] focus:ring-4 focus:ring-[#6FCF97]/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none transition-all"
                              placeholder="Type buyer name to search or enter manually..."
                            />
                            {showBuyerSuggestions && buyerSearch.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] max-h-60 overflow-y-auto">
                                 {buyers.filter(b => b.name.toLowerCase().includes(buyerSearch.toLowerCase())).map(b => (
                                   <button 
                                     key={b.id}
                                     onClick={() => {
                                       setSelectedBuyer(b)
                                       setBuyerSearch(b.name)
                                       setManualGstNumber(b.gstNumber || '')
                                       setManualPhone(b.phone || '')
                                       setManualPlaceOfSupply('')
                                       setManualAddress(b.address || '')
                                       setTaxType(b.state === 'Telangana' ? 'intra' : 'inter')
                                       setShowBuyerSuggestions(false)
                                     }}
                                     className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                   >
                                      <div className="w-10 h-10 rounded-full bg-[#6FCF97]/10 flex items-center justify-center text-[#1F6F5F]">
                                         <Users className="w-5 h-5" />
                                      </div>
                                      <div>
                                         <p className="text-sm font-bold text-[#111111]">{b.name}</p>
                                         <p className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-wider">{b.gstNumber || 'No GSTIN'}</p>
                                      </div>
                                   </button>
                                 ))}
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div>
                            <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block flex justify-between">
                               Buyer GSTIN
                               {gstinValid !== null && (
                                 <span className={`text-[9px] font-black uppercase flex items-center gap-1 ${gstinValid ? 'text-[#2FA084]' : 'text-red-500'}`}>
                                    {gstinValid ? <><CheckCircle2 className="w-3 h-3" /> Valid Format</> : <><AlertCircle className="w-3 h-3" /> Invalid Format</>}
                                 </span>
                               )}
                            </label>
                            <input 
                              value={manualGstNumber || ""}
                              onChange={e => setManualGstNumber(e.target.value)}
                              className={`w-full bg-[#EEEEEE] border-2 rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all placeholder:opacity-30 ${gstinValid === false ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-[#2FA084]'}`}
                              placeholder="Enter manual GSTIN if any..."
                            />
                         </div>
                      </div>
                   </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
                       <div>
                          <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Invoice No</label>
                          <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                       </div>
                       <div>
                          <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Invoice Date</label>
                          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                       </div>
                       <div>
                          <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Phone Number</label>
                          <input value={manualPhone || ""} onChange={e => setManualPhone(e.target.value)} placeholder="Phone number" className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                       </div>
                       <div>
                          <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Place of Supply</label>
                          <input value={manualPlaceOfSupply || ""} onChange={e => setManualPlaceOfSupply(e.target.value)} placeholder="Place of supply" className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                       <div>
                          <label className="text-[10px] font-black text-[#111111]/30 uppercase tracking-widest mb-2 block">Vehicle Number</label>
                          <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="TS XX XX XXXX" className="w-full bg-white border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all shadow-sm" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-[#111111]/30 uppercase tracking-widest mb-2 block">Transport</label>
                          <input value={transport} onChange={e => setTransport(e.target.value)} placeholder="Transport Name" className="w-full bg-white border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all shadow-sm" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-[#111111]/30 uppercase tracking-widest mb-2 block">LR Number</label>
                          <input value={lrNo} onChange={e => setLrNo(e.target.value)} placeholder="LR XXXXX" className="w-full bg-white border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all shadow-sm" />
                       </div>
                    </div>

                   <div className="border border-gray-200 rounded-2xl overflow-hidden mb-10">
                       {/* Table Header - Desktop Only */}
                       <div className="hidden md:flex items-center px-6 py-3 bg-gray-50 text-[10px] font-black text-[#111111]/30 uppercase tracking-widest gap-4 border-b border-gray-100">
                          <div className="flex-1">Description of Goods</div>
                          <div className="w-24 text-center">Size</div>
                          <div className="w-20 text-center">Unit</div>
                          <div className="w-28 text-center">HSN/SAC</div>
                          <div className="w-20 text-center">Qty</div>
                          <div className="w-32 text-right">Rate</div>
                          <div className="w-32 text-right">Amount</div>
                          <div className="w-10"></div>
                       </div>
                       <div className="divide-y divide-gray-100">
                          {lineItems.map((item, idx) => (
                            <div key={item.tempId} className="flex flex-col md:flex-row md:items-center px-4 md:px-6 py-6 md:py-4 hover:bg-gray-50 transition-colors gap-4 relative border-b md:border-b-0 border-gray-100 last:border-b-0">
                               {/* Description - Desktop: flex-1, Mobile: Full Width */}
                               <div className="flex-1 relative group">
                                  <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block">Description of Goods</label>
                                  <input value={item.name || ""} onChange={e => {
                                    const newItems = [...lineItems]
                                    newItems[idx].name = e.target.value
                                    setLineItems(newItems)
                                  }} placeholder="Item description" className="w-full h-10 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 text-sm font-bold outline-none" />
                                  
                                  {item.name.length > 1 && taxProducts.filter(p => p.name.toLowerCase().includes(item.name.toLowerCase())).length > 0 && (
                                     <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 mt-1 max-h-48 overflow-y-auto overflow-x-hidden hidden group-focus-within:block">
                                        {taxProducts.filter(p => p.name.toLowerCase().includes(item.name.toLowerCase())).map(p => (
                                           <button 
                                             key={p.id}
                                             type="button"
                                             onClick={() => {
                                               const newItems = [...lineItems]
                                               newItems[idx].name = p.name
                                               newItems[idx].hsnCode = p.hsnCode || ''
                                               setLineItems(newItems)
                                             }}
                                             className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                                           >
                                              <p className="text-xs font-black text-[#111111]">{p.name}</p>
                                              <p className="text-[10px] text-[#2FA084] font-bold uppercase tracking-widest mt-0.5">HSN: {p.hsnCode || 'N/A'}</p>
                                           </button>
                                        ))}
                                     </div>
                                  )}
                               </div>

                               {/* Grid for secondary fields on mobile */}
                               <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-end md:items-center gap-3 md:gap-4">
                                  <div className="md:w-24">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-center">Size</label>
                                     <input value={item.size || ""} onChange={e => {
                                       const newItems = [...lineItems]
                                       newItems[idx].size = e.target.value
                                       setLineItems(newItems)
                                     }} placeholder="Size" className="w-full h-10 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 text-xs font-bold text-center" />
                                  </div>
                                  <div className="md:w-20">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-center">Unit</label>
                                     <input value={item.unit || ""} onChange={e => {
                                       const newItems = [...lineItems]
                                       newItems[idx].unit = e.target.value
                                       setLineItems(newItems)
                                     }} placeholder="Unit" className="w-full h-10 bg-white border border-gray-200 focus:border-[#2FA084] rounded-lg px-3 text-xs font-bold text-center" />
                                  </div>
                                  <div className="md:w-28">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-center">HSN/SAC</label>
                                     <input value={item.hsnCode || ""} onChange={e => {
                                       const newItems = [...lineItems]
                                       newItems[idx].hsnCode = e.target.value
                                       setLineItems(newItems)
                                     }} placeholder="HSN" className="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 text-xs font-bold text-center" />
                                  </div>
                                  <div className="md:w-20">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-center">Qty</label>
                                     <input type="number" value={item.qty || ""} onChange={e => {
                                       const newItems = [...lineItems]
                                       newItems[idx].qty = e.target.value
                                       setLineItems(newItems)
                                     }} className="w-full h-10 bg-white border border-gray-200 rounded-lg px-2 text-sm font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                  </div>
                                  <div className="md:w-32">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-right">Rate (₹)</label>
                                     <input type="number" value={item.rate || ""} onChange={e => {
                                       const newItems = [...lineItems]
                                       newItems[idx].rate = e.target.value
                                       setLineItems(newItems)
                                     }} className="w-full h-10 bg-white border border-gray-200 rounded-lg px-2 text-sm font-bold text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                  </div>
                                  <div className="md:w-32 h-10 flex flex-col md:flex-row items-end md:items-center justify-end font-black text-[#111111]">
                                     <label className="md:hidden text-[9px] font-black text-[#111111]/30 uppercase mb-1 block text-right">Amount</label>
                                     <span className="text-sm md:text-base">₹{(Number(item.qty) * Number(item.rate) || 0).toFixed(2)}</span>
                                  </div>
                               </div>

                               {/* Delete Button */}
                               <div className="absolute top-2 right-2 md:relative md:top-0 md:right-0 md:w-10 h-10 flex items-center justify-end">
                                  <button onClick={() => setLineItems(lineItems.filter(i => i.tempId !== item.tempId))} className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors bg-gray-50 md:bg-transparent">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          ))}
                       </div>
                      <div className="p-4 bg-gray-50/50">
                         <button 
                           onClick={() => setLineItems([...lineItems, { tempId: Math.random().toString(36).substr(2, 9), name: '', size: '', hsnCode: '', qty: '', rate: '' }])}
                           className="flex items-center gap-2 text-[#1F6F5F] font-black text-xs uppercase tracking-widest"
                         >
                            <Plus className="w-4 h-4" /> Add Item Line
                         </button>
                      </div>
                   </div>

                   {/* Footer Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-gray-50 -mx-4 md:-mx-8 -mb-4 md:-mb-8 p-6 md:p-10 border-t border-gray-200">
                      <div className="space-y-4">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#111111]/30 mb-1">Amount in Words</p>
                            <p className="text-xs font-black text-[#1F6F5F] italic bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                               {numberToWords(grandTotal)}
                            </p>
                         </div>
                         <div className="bg-[#111111]/5 rounded-2xl p-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 mb-3">Bank Details (TELANGANA)</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                               <div><p className="opacity-50 font-medium">Bank Name</p><p className="font-bold">HDFC BANK</p></div>
                               <div><p className="opacity-50 font-medium">Branch</p><p className="font-bold">SANGAREDDY</p></div>
                               <div><p className="opacity-50 font-medium">Account No</p><p className="font-bold">50200110984950</p></div>
                               <div><p className="opacity-50 font-medium">IFSC</p><p className="font-bold">HDFC0006716</p></div>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex-1">
                               <label className="text-[10px] font-black uppercase text-[#111111]/40 mb-1 block">Payment Mode</label>
                               <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-[#EEEEEE] border border-transparent focus:border-[#1F6F5F] rounded-xl px-3 py-2 text-xs font-bold text-[#1F6F5F] outline-none transition-all cursor-pointer">
                                  <option value="CASH">CASH</option>
                                  <option value="CREDIT">CREDIT</option>
                                  <option value="BANK TRANSFER">BANK TRANSFER</option>
                               </select>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-inner mb-4 space-y-4">
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 mb-3 block">Tax Type Selection</label>
                               <div className="flex bg-[#EEEEEE] p-1 rounded-xl">
                                  <button 
                                    onClick={() => setTaxType('intra')}
                                    className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${taxType === 'intra' ? 'bg-[#1F6F5F] text-white shadow-md' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
                                  >
                                    Intra (CGST+SGST)
                                  </button>
                                  <button 
                                    onClick={() => setTaxType('inter')}
                                    className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${taxType === 'inter' ? 'bg-[#1F6F5F] text-white shadow-md' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
                                  >
                                    Inter (IGST)
                                  </button>
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#111111]/40 mb-3 block">Global GST Percentage Selection</label>
                               <div className="flex bg-[#EEEEEE] p-1 rounded-xl">
                                  {GST_RATES.map(rate => (
                                    <button 
                                      key={rate}
                                      onClick={() => setGlobalGstRate(rate)}
                                      className={`flex-1 py-2 text-xs font-black transition-all rounded-lg ${globalGstRate === rate ? 'bg-[#1F6F5F] text-white' : 'text-[#111111]/40 hover:text-[#111111]/60'}`}
                                    >
                                      {rate}%
                                    </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="flex justify-between items-center text-sm md:text-base font-bold text-[#111111]/60">
                            <span>Total Value (Base)</span>
                            <span className="font-black text-[#111111]">₹{totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                         </div>
                         {isInterState ? (
                           <div className="flex justify-between items-center text-sm md:text-base font-bold text-[#111111]/60">
                              <span>Total IGST ({globalGstRate}%)</span>
                              <span className="font-black text-[#111111]">₹{taxBreakdown.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                           </div>
                         ) : (
                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-sm md:text-base font-bold text-[#111111]/60">
                                 <span>Total CGST ({globalGstRate/2}%)</span>
                                 <span className="font-black text-[#111111]">₹{taxBreakdown.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm md:text-base font-bold text-[#111111]/60">
                                 <span>Total SGST ({globalGstRate/2}%)</span>
                                 <span className="font-black text-[#111111]">₹{taxBreakdown.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>
                         )}
                         <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-[#111111]/40">Grand Total (Net)</span>
                            <span className="text-2xl md:text-3xl font-black text-[#1F6F5F]">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="pt-6 flex justify-end gap-4">
                            <button onClick={() => setIsInvoiceFormOpen(false)} className="px-6 py-3 text-sm font-bold text-[#111111]/40 hover:text-[#111111]">Cancel</button>
                            <button onClick={handleSaveInvoice} className="bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all flex items-center gap-2">
                               <Save className="w-5 h-5" /> SAVE INVOICE
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 {/* Monthly Stats Dashboard */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                       <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                          <ReceiptIndianRupee className="w-32 h-32 text-[#1F6F5F]" />
                       </div>
                       <p className="text-[10px] font-black uppercase text-[#111111]/40 tracking-widest mb-2">Filtered Sales (Base)</p>
                       <h3 className="text-3xl font-black text-[#1F6F5F]">₹{filteredStats.base.toLocaleString('en-IN')}</h3>
                       <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                          <ArrowUpRight className="w-3 h-3" /> Total Items Value
                       </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                       <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                          <Percent className="w-32 h-32 text-blue-600" />
                       </div>
                       <p className="text-[10px] font-black uppercase text-[#111111]/40 tracking-widest mb-2">Filtered Tax Collected</p>
                       <h3 className="text-3xl font-black text-blue-600">₹{filteredStats.tax.toLocaleString('en-IN')}</h3>
                       <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                           <Calendar className="w-3 h-3" /> Current View
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                       <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-32 h-32 text-orange-500" />
                       </div>
                       <p className="text-[10px] font-black uppercase text-[#111111]/40 tracking-widest mb-2">Filtered Total (Net)</p>
                       <h3 className="text-3xl font-black text-orange-500">₹{filteredStats.total.toLocaleString('en-IN')}</h3>
                       <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                          <FileText className="w-3 h-3" /> {filteredInvoices.length} Invoices Found
                       </div>
                    </div>
                 </div>

                 {/* Filters Bar */}
                 <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div className="relative flex-1">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <input 
                             value={searchQuery}
                             onChange={e => setSearchQuery(e.target.value)}
                             placeholder="Search invoices..." 
                             className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 md:py-4 text-sm font-bold focus:ring-2 focus:ring-[#1F6F5F]/10 outline-none"
                           />
                        </div>
                     </div>
                    <button 
                      onClick={() => {
                         resetInvoiceForm()
                         setIsInvoiceFormOpen(true)
                      }}
                      className="bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-5 md:px-8 py-3 md:py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                       <Plus className="w-5 h-5" /> <span>Generate New Invoice</span>
                    </button>
                 </div>

                 <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gray-50 border-b border-gray-200 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest">
                       <div className="col-span-1">Invoice No</div>
                       <div className="col-span-3">Buyer / Details</div>
                       <div className="col-span-2">Date</div>
                       <div className="col-span-2 text-right">Tax Total</div>
                       <div className="col-span-2 text-right text-[#1F6F5F]">Grand Total</div>
                       <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(() => {
                        const itemsPerPage = 50
                        const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
                        const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

                        if (filteredInvoices.length === 0) {
                          return (
                            <div className="p-20 text-center opacity-30">
                              <FileText className="w-12 h-12 mx-auto mb-4" />
                              <p className="font-black text-sm uppercase tracking-widest">No GST Invoices Found for this filter</p>
                            </div>
                          )
                        }

                        return (
                          <>
                            {paginatedInvoices.map(inv => (
                              <div key={inv.id}>
                                {/* Desktop Row */}
                                <div className="hidden md:grid grid-cols-12 gap-4 p-6 items-center hover:bg-gray-50 transition-colors group">
                                  <div className="col-span-1">
                                      <p className="font-black text-[#1F6F5F] uppercase tracking-tight">{inv.invoiceNo}</p>
                                  </div>
                                  <div className="col-span-3">
                                      <p className="font-black text-[#111111] uppercase">{inv.buyerName}</p>
                                      <p className="text-[9px] font-black text-[#111111]/30 uppercase tracking-widest truncate">{inv.buyerGst || 'Unregistered'}</p>
                                  </div>
                                  <div className="col-span-2 text-sm font-bold text-[#111111]/60">
                                      {new Date(inv.date).toLocaleDateString()}
                                  </div>
                                  <div className="col-span-2 text-right text-sm font-bold text-[#111111]/60">
                                      ₹{inv.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="col-span-2 text-right text-lg font-black text-[#1F6F5F]">
                                      ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="col-span-2 text-right flex justify-end gap-1">
                                      <button onClick={() => handlePrint(inv)} className="p-2 text-gray-300 hover:text-[#1F6F5F] transition-colors rounded-lg hover:bg-white hover:shadow-sm cursor-pointer"><Printer className="w-5 h-5" /></button>
                                      <button onClick={() => handleEditInvoice(inv)} className="p-2 text-gray-300 hover:text-blue-600 transition-colors rounded-lg hover:bg-white hover:shadow-sm cursor-pointer"><Edit className="w-5 h-5" /></button>
                                      <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-white hover:shadow-sm cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                                  </div>
                                </div>

                                {/* Mobile Card */}
                                <div className="md:hidden p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-black text-[#1F6F5F] text-sm uppercase">{inv.invoiceNo}</p>
                                        <span className="text-[9px] text-[#111111]/30 font-bold">{new Date(inv.date).toLocaleDateString()}</span>
                                      </div>
                                      <p className="font-black text-[#111111] uppercase text-sm truncate">{inv.buyerName}</p>
                                      <p className="text-[10px] text-[#111111]/30 font-bold truncate">{inv.buyerGst || 'Unregistered'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-black text-[#1F6F5F] text-base">₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                      <p className="text-[10px] text-[#111111]/40 font-bold">Tax: ₹{inv.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button onClick={() => handlePrint(inv)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1F6F5F] bg-[#1F6F5F]/10 rounded-xl transition-all cursor-pointer"><Printer className="w-3.5 h-3.5" /> Print</button>
                                    <button onClick={() => handleEditInvoice(inv)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl transition-all cursor-pointer"><Edit className="w-3.5 h-3.5" /> Edit</button>
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Del</button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <PaginationControls
                              currentPage={currentPage}
                              totalPages={totalPages}
                              totalItems={filteredInvoices.length}
                              itemsPerPage={itemsPerPage}
                              onPageChange={setCurrentPage}
                              itemName="GST invoices"
                            />
                          </>
                        )
                      })()}
                    </div>
                 </div>
              </div>
            )}
          </motion.div>
        ) : activeTab === 'buyers' ? (
          <motion.div 
            key="buyers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-6">
               <div className="relative w-64 md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm outline-none focus:border-[#2FA084] transition-all" 
                    placeholder="Search by buyer name or GSTIN..." 
                  />
               </div>
               <button 
                 onClick={() => { setEditingBuyer(null); setIsBuyerModalOpen(true); }}
                 className="bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all active:scale-95"
               >
                 <UserPlus className="w-5 h-5" /> Add Buyer
               </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest">Buyer Details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest text-center">GSTIN Number</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest text-center">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {buyers.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase())).map(buyer => (
                        <tr key={buyer.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-black text-[#111111]">{buyer.name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate max-w-xs">{buyer.address || 'No address saved'}</div>
                           </td>
                           <td className="px-6 py-4 text-center font-bold text-[#2FA084] text-sm">{buyer.gstNumber || 'UNREGISTERED'}</td>
                           <td className="px-6 py-4 text-center font-bold text-gray-500 text-sm">{buyer.phone || '-'}</td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => { setEditingBuyer(buyer); setIsBuyerModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#1F6F5F] transition-colors"><Edit className="w-4 h-4" /></button>
                                 <button onClick={async () => { if(confirm('Delete?')) { await deleteBuyer(buyer.id); loadData(); } }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {buyers.length === 0 && (
                        <tr>
                           <td colSpan={4} className="py-20 text-center opacity-20 italic">No registered buyers found</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="items"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-6">
               <div className="relative w-64 md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm outline-none focus:border-[#2FA084] transition-all" 
                    placeholder="Search items or HSN codes..." 
                  />
               </div>
               <button 
                 onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
                 className="bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all active:scale-95"
               >
                 <Plus className="w-5 h-5" /> Register Item
               </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest">Item Description</th>
                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest text-center">HSN / SAC Code</th>

                        <th className="px-6 py-4 text-[10px] font-black text-[#111111]/40 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {taxProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-black text-[#111111]">{product.name}</div>
                           </td>
                           <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm">{product.hsnCode || '-'}</td>

                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                 <button onClick={() => { setEditingItem(product); setIsItemModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#1F6F5F] transition-colors"><Edit className="w-4 h-4" /></button>
                                 <button onClick={async () => { if(confirm('Delete?')) { await deleteTaxProduct(product.id); loadData(); } }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {taxProducts.length === 0 && (
                        <tr>
                           <td colSpan={4} className="py-20 text-center opacity-20 italic">No registered items found</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsItemModalOpen(false)}
               className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
             >
                <div className="bg-[#1F6F5F] p-8 text-white">
                   <h2 className="text-2xl font-black uppercase tracking-tight">{editingItem?.id ? 'Edit Item Details' : 'Register New Item'}</h2>
                   <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Pre-fill HSN for faster billing</p>
                </div>
                <div className="p-8">
                   <form onSubmit={async (e) => {
                     e.preventDefault()
                     const formData = new FormData(e.currentTarget)
                     const data = {
                       id: editingItem?.id,
                       name: formData.get('name'),
                       hsnCode: formData.get('hsnCode'),
                     }
                     await upsertTaxProduct(data)
                     setIsItemModalOpen(false)
                     loadData()
                   }} className="space-y-6">
                      <div>
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Item Name / Description</label>
                         <input name="name" defaultValue={editingItem?.name} required className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                      </div>
                      <div>
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">HSN / SAC Code</label>
                         <input name="hsnCode" defaultValue={editingItem?.hsnCode} placeholder="8-digit HSN" className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                      </div>
                      <div className="flex gap-4 mt-4">
                         <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-[#111111]/40 hover:text-[#111111] transition-colors">Cancel</button>
                         <button type="submit" className="flex-[2] bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Item Information</button>
                      </div>
                   </form>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBuyerModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsBuyerModalOpen(false)}
               className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
             >
                <div className="bg-[#1F6F5F] p-8 text-white">
                   <h2 className="text-2xl font-black uppercase tracking-tight">{editingBuyer?.id ? 'Edit Buyer Details' : 'Register New Professional Buyer'}</h2>
                   <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Populate records for faster billing</p>
                </div>
                <div className="p-8">
                   <form onSubmit={async (e) => {
                     e.preventDefault()
                     const formData = new FormData(e.currentTarget)
                     const data = {
                       id: editingBuyer?.id,
                       name: formData.get('name'),
                       gstNumber: formData.get('gstNumber'),
                       phone: formData.get('phone'),
                     }
                     await upsertBuyer(data)
                     setIsBuyerModalOpen(false)
                     loadData()
                   }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-full">
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Full Name / Business Name</label>
                         <input name="name" defaultValue={editingBuyer?.name} required className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                      </div>
                      <div>
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">GSTIN Number</label>
                         <input name="gstNumber" defaultValue={editingBuyer?.gstNumber} placeholder="36XXXXXXXXXXXXX" className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                      </div>
                      <div>
                         <label className="text-xs font-black text-[#111111]/40 uppercase tracking-widest mb-2 block">Phone Number</label>
                         <input name="phone" defaultValue={editingBuyer?.phone} className="w-full bg-[#EEEEEE] border-transparent focus:border-[#2FA084] rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all" />
                      </div>
                      <div className="col-span-full flex gap-4 mt-4">
                         <button type="button" onClick={() => setIsBuyerModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-[#111111]/40 hover:text-[#111111] transition-colors">Cancel</button>
                         <button type="submit" className="flex-[2] bg-[#1F6F5F] hover:bg-[#2FA084] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Buyer Information</button>
                      </div>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional GST Invoice Template (Hidden on Screen) */}
      {printingInvoice && (
        <div id="print-area" className="hidden print:block text-black bg-white p-0 m-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
            @media print {
              @page { 
                size: A4;
                margin: 0;
              }
              body * { visibility: hidden !important; }
              #print-area, #print-area * { visibility: visible !important; }
              #print-area { 
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
              }
              .invoice-container { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                transform: scale(0.95) !important;
                transform-origin: center center !important;
              }
              .font-bill { 
                font-family: 'Patrick Hand', cursive !important; 
                font-size: 13px; 
                word-spacing: 1.5px !important;
                letter-spacing: 0.2px !important;
              }
            }
          `}} />
          
          <div className="invoice-container bg-white relative overflow-hidden" style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm', boxShadow: 'inset 0 0 0 6px #000' }}>
            <img src="/invoice_template.svg" alt="Invoice Template" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />

            <div className="absolute inset-0 z-10 font-bill text-black">
              {/* Buyer Details (Left) */}
              <div className="absolute top-[56mm] left-[32mm] text-[13px] uppercase w-[100mm] truncate leading-none">
                {printingInvoice.buyerName}
              </div>
              <div className="absolute top-[62.5mm] left-[32mm] text-[13px] w-[100mm] truncate leading-none">
                {printingInvoice.buyerPhone || ''}
              </div>
              <div className="absolute top-[67mm] left-[12mm] text-[13px] uppercase w-[126mm] leading-[7mm] line-clamp-2 whitespace-normal break-words indent-[20mm]">
                {printingInvoice.placeOfSupply || ''}
              </div>
              <div className="absolute top-[81.5mm] left-[24mm] text-[13px] uppercase w-[100mm] truncate leading-none">
                {printingInvoice.buyerGst || ''}
              </div>

              {/* Invoice Details (Right) */}
              <div className="absolute top-[55mm] left-[164mm] text-[13px] text-black w-[50mm] truncate leading-none">
                {printingInvoice.invoiceNo}
              </div>
              <div className="absolute top-[61mm] left-[164mm] text-[13px] w-[45mm] truncate leading-none">
                {new Date(printingInvoice.date).toLocaleDateString('en-IN')}
              </div>
              <div className="absolute top-[69mm] left-[163mm] text-[13px] uppercase w-[48mm] truncate leading-none">
                {printingInvoice.vehicleNo || ''}
              </div>
              <div className="absolute top-[76mm] left-[160mm] text-[13px] uppercase w-[52mm] truncate leading-none">
                {printingInvoice.transport || ''}
              </div>
              <div className="absolute top-[82.5mm] left-[160mm] text-[13px] uppercase w-[56mm] truncate leading-none">
                {printingInvoice.lrNo || ''}
              </div>

              {/* Table Items */}
              <div className="absolute top-[98mm] left-[13mm] right-[0mm]">
                <div className="flex flex-col">
                  {printingInvoice.items.map((item: any, idx: number) => (
                    <div key={item.id} className="flex items-center text-[13px] h-[6.45mm] pt-[1.5mm]">
                      <div className="w-[10.5mm] text-center -translate-x-10">{idx + 1}</div>
                      <div className="w-[79.5mm] flex items-center uppercase -translate-x-8">
                        <span className="pl-1 truncate flex-1">{item.name}</span>
                        <span className="pr-1 text-right shrink-0">{item.size || ''}</span>
                      </div>
                      <div className="w-[20.5mm] text-center translate-x-4">{item.hsnCode || '-'}</div>
                      <div className="w-[11.5mm] text-center uppercase translate-x-6">{item.unit || '-'}</div>
                      <div className="w-[11.5mm] text-center translate-x-10">{item.quantity}</div>
                      <div className="w-[24.5mm] text-left pl-2 translate-x-10">{item.price.toFixed(2)}</div>
                      <div className="w-[26mm] text-left pl-2 translate-x-8">{(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="absolute top-[212.5mm] left-[180mm] w-[40mm] text-left text-[14px]">
                {printingInvoice.totalBaseAmount.toFixed(2)}
              </div>

              <div className="absolute top-[223mm] left-[12mm] text-[12px] italic uppercase w-[115mm] leading-[7mm] line-clamp-2 whitespace-normal indent-[25mm]">
                {numberToWords(printingInvoice.grandTotal)}
              </div>
              <div className="absolute top-[237.5mm] left-[40mm] text-[13px] uppercase">
                {printingInvoice.paymentMode}
              </div>

              {/* Tax Percentages */}
              <div className="absolute top-[227.5mm] left-[150mm] w-[8mm] text-right text-[13px]">
                {(!printingInvoice.placeOfSupply?.toLowerCase().includes('inter')) && printingInvoice.items?.[0]?.taxRate ? (printingInvoice.items[0].taxRate / 2) : 0}
              </div>
              <div className="absolute top-[237mm] left-[150mm] w-[8mm] text-right text-[13px]">
                {(!printingInvoice.placeOfSupply?.toLowerCase().includes('inter')) && printingInvoice.items?.[0]?.taxRate ? (printingInvoice.items[0].taxRate / 2) : 0}
              </div>
              <div className="absolute top-[246.5mm] left-[150mm] w-[8mm] text-right text-[13px]">
                {(printingInvoice.placeOfSupply?.toLowerCase().includes('inter')) && printingInvoice.items?.[0]?.taxRate ? printingInvoice.items[0].taxRate : 0}
              </div>

              {/* Tax & Grand Total */}
              <div className="absolute top-[228mm] left-[172mm] text-[14px] w-[40mm] text-left pl-2">
                {!printingInvoice.placeOfSupply?.toLowerCase().includes('inter') ? (printingInvoice.totalTaxAmount / 2).toFixed(2) : '0.00'}
              </div>
              <div className="absolute top-[237.5mm] left-[172mm] text-[14px] w-[40mm] text-left pl-2">
                {!printingInvoice.placeOfSupply?.toLowerCase().includes('inter') ? (printingInvoice.totalTaxAmount / 2).toFixed(2) : '0.00'}
              </div>
              <div className="absolute top-[247mm] left-[172mm] text-[14px] w-[40mm] text-left pl-2">
                {printingInvoice.placeOfSupply?.toLowerCase().includes('inter') ? printingInvoice.totalTaxAmount.toFixed(2) : '0.00'}
              </div>
              <div className="absolute top-[258mm] left-[172mm] text-[16px] font-black w-[40mm] text-left pl-2 text-black">
                {printingInvoice.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
