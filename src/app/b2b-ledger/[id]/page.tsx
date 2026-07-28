"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { getB2BPartyById, createB2BEntry, deleteB2BEntry, updateB2BParty, updateB2BEntry } from "@/lib/actions"
import { numberToWordsIN } from "@/lib/utils"
import { SecurityGate } from "@/components/SecurityGate"
import { PaginationControls } from "@/components/common/PaginationControls"
import { ArrowLeft, Plus, Trash2, Briefcase, Calendar, FileText, IndianRupee, X, Edit2, Printer } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function B2BPartyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [party, setParty] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printFromDate, setPrintFromDate] = useState("")
  const [printToDate, setPrintToDate] = useState("")
  const [entryData, setEntryData] = useState({
    date: new Date().toISOString().slice(0, 10),
    narration: "",
    debit: "",
    credit: ""
  })
  const [isSaving, setIsSaving] = useState(false)

  // SecurityGate & Edit States
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [pendingSecurityAction, setPendingSecurityAction] = useState<(() => Promise<void>) | null>(null)

  const [isEditPartyOpen, setIsEditPartyOpen] = useState(false)
  const [editPartyName, setEditPartyName] = useState("")

  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  const [editEntryData, setEditEntryData] = useState({
    date: "",
    narration: "",
    debit: "",
    credit: ""
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const triggerSecurity = (action: () => Promise<void>) => {
    setPendingSecurityAction(() => action)
    setIsSecurityOpen(true)
  }

  const loadData = async () => {
    setLoading(true)
    const data = await getB2BPartyById(id)
    setParty(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryData.narration.trim()) return
    const debitVal = entryData.debit ? parseFloat(entryData.debit) : 0
    const creditVal = entryData.credit ? parseFloat(entryData.credit) : 0
    if (debitVal > 0 && creditVal > 0) {
      alert("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
      return
    }
    if (debitVal <= 0 && creditVal <= 0) {
      alert("Please enter either a Debit or Credit amount greater than 0.")
      return
    }
    setIsSaving(true)
    try {
      await createB2BEntry({
        partyId: id,
        date: entryData.date,
        narration: entryData.narration,
        debit: entryData.debit ? parseFloat(entryData.debit) : 0,
        credit: entryData.credit ? parseFloat(entryData.credit) : 0
      })
      setEntryData({
        date: new Date().toISOString().slice(0, 10),
        narration: "",
        debit: "",
        credit: ""
      })
      setIsAddOpen(false)
      setCurrentPage(1)
      await loadData()
    } catch (err: any) {
      alert("Error adding entry: " + (err.message || "Unknown error"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPartyName.trim()) return
    triggerSecurity(async () => {
      setIsUpdating(true)
      try {
        await updateB2BParty(id, editPartyName)
        setIsEditPartyOpen(false)
        await loadData()
      } catch (err: any) {
        alert("Error updating party: " + (err.message || "Unknown error"))
      } finally {
        setIsUpdating(false)
      }
    })
  }

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry || !editEntryData.narration.trim()) return
    const debitVal = editEntryData.debit ? parseFloat(editEntryData.debit) : 0
    const creditVal = editEntryData.credit ? parseFloat(editEntryData.credit) : 0
    if (debitVal > 0 && creditVal > 0) {
      alert("You cannot enter both Credit and Debit in a single entry. Please create a separate entry or one more entry.")
      return
    }
    if (debitVal <= 0 && creditVal <= 0) {
      alert("Please enter either a Debit or Credit amount greater than 0.")
      return
    }
    triggerSecurity(async () => {
      setIsUpdating(true)
      try {
        await updateB2BEntry(editingEntry.id, id, {
          date: editEntryData.date,
          narration: editEntryData.narration,
          debit: editEntryData.debit ? parseFloat(editEntryData.debit) : 0,
          credit: editEntryData.credit ? parseFloat(editEntryData.credit) : 0
        })
        setEditingEntry(null)
        await loadData()
      } catch (err: any) {
        alert("Error updating entry: " + (err.message || "Unknown error"))
      } finally {
        setIsUpdating(false)
      }
    })
  }

  const handleDelete = (entryId: string) => {
    if (!confirm("Are you sure you want to delete this ledger entry?")) return
    triggerSecurity(async () => {
      await deleteB2BEntry(entryId, id)
      await loadData()
    })
  }

  function formatDate(dateStr: string | Date) {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getPrintedEntries = () => {
    if (!party || !party.entries) return { entries: [], openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 }
    
    let entries = party.entries
    let openingBalance = 0

    if (printFromDate) {
      const from = new Date(printFromDate)
      from.setHours(0, 0, 0, 0)
      const priorEntries = entries.filter((e: any) => new Date(e.date) < from)
      if (priorEntries.length > 0) {
        openingBalance = priorEntries[priorEntries.length - 1].runningBalance
      }
      entries = entries.filter((e: any) => new Date(e.date) >= from)
    }

    if (printToDate) {
      const to = new Date(printToDate)
      to.setHours(23, 59, 59, 999)
      entries = entries.filter((e: any) => new Date(e.date) <= to)
    }

    const totalDebit = entries.reduce((acc: number, e: any) => acc + (e.debit || 0), 0)
    const totalCredit = entries.reduce((acc: number, e: any) => acc + (e.credit || 0), 0)
    const closingBalance = entries.length > 0 ? entries[entries.length - 1].runningBalance : openingBalance

    return { entries, openingBalance, totalDebit, totalCredit, closingBalance }
  }
  const printedData = getPrintedEntries()

  if (loading) {
    return (
      <div className="w-full py-20 text-center text-[#111111]/40 font-medium max-w-6xl mx-auto">
        Loading B2B statement...
      </div>
    )
  }

  if (!party) {
    return (
      <div className="w-full py-20 text-center max-w-6xl mx-auto space-y-4">
        <p className="font-bold text-lg text-gray-600">Partner not found.</p>
        <Link href="/b2b-ledger" className="text-[#1F6F5F] font-bold hover:underline">
          &larr; Back to B2B Partners Ledger
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full pb-20 max-w-6xl mx-auto space-y-8">
      {/* Top Nav & Header */}
      <div>
        <Link href="/b2b-ledger" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F6F5F] hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to B2B Partners Ledger
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#2FA084]/10 flex items-center justify-center text-[#2FA084]">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="typo-h2">{party.name}</h1>
                  <button
                    onClick={() => {
                      setEditPartyName(party.name)
                      setIsEditPartyOpen(true)
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#1F6F5F] rounded-lg transition-colors cursor-pointer"
                    title="Edit Partner Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="typo-body text-gray-500 mt-0.5">B2B Partner / Wholesale Account Statement</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Current Balance</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-[#111111]">
                  ₹{party.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  party.balanceType === 'Dr' ? 'bg-green-100 text-green-800' :
                  party.balanceType === 'Cr' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {party.balanceType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-2 bg-white text-[#111111] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-[#2FA084]" /> Print Ledger
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md"
                style={{ 
                  background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', 
                  boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', 
                  border: '1px solid rgba(0,0,0,0.12)' 
                }}
              >
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2FA084]" /> Add Entry for {party.name}
                </h3>
                <button onClick={() => setIsAddOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    required
                    type="date"
                    value={entryData.date}
                    onChange={e => setEntryData({ ...entryData, date: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Narration / Descriptive Info</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Tile Sale Delivery #INV-102 or Cheque Payment Received"
                    value={entryData.narration}
                    onChange={e => setEntryData({ ...entryData, narration: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex flex-col mb-1.5">
                      <label className="text-xs font-bold text-green-700 uppercase tracking-wider">Debit (Dr) ₹</label>
                      {entryData.debit && Number(entryData.debit) > 0 && (
                        <span className="text-[11px] font-extrabold text-green-800 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 mt-0.5">
                          {numberToWordsIN(entryData.debit)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={entryData.debit}
                      onChange={e => setEntryData({ ...entryData, debit: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-green-700 outline-none focus:border-green-600 skeu-input"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Sale Bill // Maal Vaicho // Apde Payment Kariye</p>
                  </div>
                  <div>
                    <div className="flex flex-col mb-1.5">
                      <label className="text-xs font-bold text-red-700 uppercase tracking-wider">Credit (Cr) ₹</label>
                      {entryData.credit && Number(entryData.credit) > 0 && (
                        <span className="text-[11px] font-extrabold text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 mt-0.5">
                          {numberToWordsIN(entryData.credit)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={entryData.credit}
                      onChange={e => setEntryData({ ...entryData, credit: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-red-700 outline-none focus:border-red-600 skeu-input"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Material Purchase Kairu Apde // Payment apde Recieve Kairu.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-sm font-black text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    {isSaving ? "Saving..." : "Save Entry"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ledger Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 6px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)' }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-black text-[#111111] uppercase tracking-wider border-b border-gray-300" style={{ background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)' }}>
                <th className="py-4 px-6 text-left w-[8%]">S.No.</th>
                <th className="py-4 px-6 text-left w-[14%]">Date</th>
                <th className="py-4 px-6 text-left w-[30%]">Narration / Description</th>
                <th className="py-4 px-6 text-left w-[14%]">Debit (Dr) ₹</th>
                <th className="py-4 px-6 text-left w-[14%]">Credit (Cr) ₹</th>
                <th className="py-4 px-6 text-left w-[12%]">Balance ₹</th>
                <th className="py-4 px-6 text-left w-[8%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {party.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#111111]/40">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-base text-[#111111]/70">No transactions recorded yet</p>
                    <p className="text-xs mt-1">Click &quot;Add Entry&quot; to log your first sale or payment.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const itemsPerPage = 15
                  const reversedEntries = [...party.entries].reverse()
                  const paginatedEntries = reversedEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  return paginatedEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-white/80 transition-all text-sm group">
                      <td className="py-4 px-6 text-left font-normal text-gray-500 text-sm">#{entry.serialNo}</td>
                      <td className="py-4 px-6 text-left font-medium text-[#111111] text-sm whitespace-nowrap">{formatDate(entry.date)}</td>
                      <td className="py-4 px-6 text-left font-medium text-[#111111] text-sm break-words whitespace-pre-wrap max-w-xs">{entry.narration}</td>
                      <td className="py-4 px-6 text-left font-medium text-green-700 text-sm whitespace-nowrap">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-left font-medium text-red-700 text-sm whitespace-nowrap">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-left whitespace-nowrap text-sm">
                        <div className="flex items-center justify-start gap-2">
                          <span className="font-medium text-sm text-[#111111]">
                            ₹{entry.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                            entry.balanceType === 'Dr' ? 'bg-green-100 text-green-800' :
                            entry.balanceType === 'Cr' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {entry.balanceType}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-left whitespace-nowrap">
                        <div className="flex items-center justify-start gap-1">
                          <button
                            onClick={() => {
                              setEditingEntry(entry)
                              setEditEntryData({
                                date: new Date(entry.date).toISOString().slice(0, 10),
                                narration: entry.narration,
                                debit: entry.debit ? entry.debit.toString() : "",
                                credit: entry.credit ? entry.credit.toString() : ""
                              })
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#1F6F5F] rounded-lg transition-colors cursor-pointer"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-gray-200 border-t border-gray-200">
          {party.entries.length === 0 ? (
            <div className="p-12 text-center text-[#111111]/40">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-base text-[#111111]/70">No transactions recorded yet</p>
            </div>
          ) : (
            (() => {
              const itemsPerPage = 15
              const reversedEntries = [...party.entries].reverse()
              const paginatedEntries = reversedEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              return paginatedEntries.map((entry: any) => (
                <div key={entry.id} className="p-5 hover:bg-white/80 transition-all text-sm space-y-3">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    <span>{formatDate(entry.date)}</span>
                    <span className="text-xs text-gray-400 font-black">#{entry.serialNo}</span>
                  </div>
                  <div className="font-semibold text-[#333333] break-words whitespace-pre-wrap text-base">
                    {entry.narration}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                    <div className="font-bold text-green-700 text-left">
                      <span className="text-gray-400 font-normal block">Debit:</span>
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </div>
                    <div className="font-bold text-red-700 text-left">
                      <span className="text-gray-400 font-normal block">Credit:</span>
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-normal">Balance:</span>
                      <span className="font-black text-sm text-[#111111]">
                        ₹{entry.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        entry.balanceType === 'Dr' ? 'bg-green-100 text-green-800' :
                        entry.balanceType === 'Cr' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {entry.balanceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingEntry(entry)
                          setEditEntryData({
                            date: new Date(entry.date).toISOString().slice(0, 10),
                            narration: entry.narration,
                            debit: entry.debit ? entry.debit.toString() : "",
                            credit: entry.credit ? entry.credit.toString() : ""
                          })
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#1F6F5F] rounded-lg transition-colors cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            })()
          )}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(party.entries.length / 15)}
          totalItems={party.entries.length}
          itemsPerPage={15}
          onPageChange={setCurrentPage}
          itemName="entries"
        />
      </div>

      {/* Edit Party Modal */}
      <AnimatePresence>
        {isEditPartyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#2FA084]" /> Edit Partner Name
                </h3>
                <button onClick={() => setIsEditPartyOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdateParty} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Partner Name</label>
                  <input
                    required
                    value={editPartyName}
                    onChange={e => setEditPartyName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditPartyOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 text-sm font-black text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Entry Modal */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#2FA084]" /> Edit Ledger Entry
                </h3>
                <button onClick={() => setEditingEntry(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdateEntry} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    required
                    type="date"
                    value={editEntryData.date}
                    onChange={e => setEditEntryData({ ...editEntryData, date: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Narration / Descriptive Info</label>
                  <textarea
                    required
                    rows={3}
                    value={editEntryData.narration}
                    onChange={e => setEditEntryData({ ...editEntryData, narration: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex flex-col mb-1.5">
                      <label className="text-xs font-bold text-green-700 uppercase tracking-wider">Debit (Dr) ₹</label>
                      {editEntryData.debit && Number(editEntryData.debit) > 0 && (
                        <span className="text-[11px] font-extrabold text-green-800 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 mt-0.5">
                          {numberToWordsIN(editEntryData.debit)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={editEntryData.debit}
                      onChange={e => setEditEntryData({ ...editEntryData, debit: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-green-700 outline-none focus:border-green-600 skeu-input"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Sale Bill // Maal Vaicho // Apde Payment Kariye</p>
                  </div>
                  <div>
                    <div className="flex flex-col mb-1.5">
                      <label className="text-xs font-bold text-red-700 uppercase tracking-wider">Credit (Cr) ₹</label>
                      {editEntryData.credit && Number(editEntryData.credit) > 0 && (
                        <span className="text-[11px] font-extrabold text-red-800 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 mt-0.5">
                          {numberToWordsIN(editEntryData.credit)}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={editEntryData.credit}
                      onChange={e => setEditEntryData({ ...editEntryData, credit: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-red-700 outline-none focus:border-red-600 skeu-input"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Material Purchase Kairu Apde // Payment apde Recieve Kairu.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingEntry(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 text-sm font-black text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Date Range Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(47,160,132,0.1) 0%, rgba(255,255,255,0) 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2FA084]/15 flex items-center justify-center text-[#2FA084]">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#111111] text-lg">Print Ledger Statement</h3>
                    <p className="text-xs text-gray-500 font-medium">Select date range for {party?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={printFromDate}
                      onChange={(e) => setPrintFromDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#2FA084]/20 focus:border-[#2FA084]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={printToDate}
                      onChange={(e) => setPrintToDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#2FA084]/20 focus:border-[#2FA084]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500 font-bold">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintFromDate("")
                      setPrintToDate("")
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg transition-colors"
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date()
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
                      const today = now.toISOString().slice(0, 10)
                      setPrintFromDate(firstDay)
                      setPrintToDate(today)
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-lg transition-colors"
                  >
                    This Month
                  </button>
                </div>

                <div className="bg-[#2FA084]/10 border border-[#2FA084]/20 rounded-2xl p-4 text-xs text-[#1F6F5F] font-semibold flex justify-between items-center">
                  <span>Entries to Print:</span>
                  <span className="font-black text-sm">{printedData.entries.length} transactions</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrintModalOpen(false)
                      setTimeout(() => window.print(), 150)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    <Printer className="w-4 h-4" /> Print Statement
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Area - Compact & Table Header on top of each page */}
      {party && (
        <div id="print-ledger-area" className="hidden print:block text-black bg-white p-0 m-0">
          <style jsx global>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm 10mm 10mm 10mm;
              }
              body * {
                visibility: hidden;
              }
              #print-ledger-area, #print-ledger-area * {
                visibility: visible !important;
              }
              #print-ledger-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                background: #ffffff;
                color: #000000;
              }
              #print-ledger-area table {
                width: 100%;
                border-collapse: collapse;
              }
              #print-ledger-area thead {
                display: table-header-group;
              }
              #print-ledger-area tfoot {
                display: table-footer-group;
              }
              #print-ledger-area tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              #print-ledger-area th, #print-ledger-area td {
                padding: 4px 6px !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
              }
            }
          `}</style>

          {/* Print Header */}
          <div className="border-b-2 border-black pb-3 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wide">{party.name}</h1>
                <p className="text-xs font-bold text-gray-600 mt-0.5">B2B Partner Account Statement</p>
              </div>
              <div className="text-right text-xs">
                <p><span className="font-bold">Printed On:</span> {formatDate(new Date())}</p>
                <p className="mt-0.5"><span className="font-bold">Period:</span> {
                  printFromDate || printToDate 
                    ? `${printFromDate ? formatDate(printFromDate) : 'Start'} to ${printToDate ? formatDate(printToDate) : 'Today'}`
                    : 'All Time'
                }</p>
              </div>
            </div>
          </div>

          {/* Compact Statement Table */}
          <table className="w-full border border-black text-left">
            <thead>
              <tr className="bg-gray-200 border-b border-black font-black text-black">
                <th className="border-r border-black w-12 text-center">S.No</th>
                <th className="border-r border-black w-24">Date</th>
                <th className="border-r border-black">Narration / Description</th>
                <th className="border-r border-black w-28 text-right">Debit (₹)</th>
                <th className="border-r border-black w-28 text-right">Credit (₹)</th>
                <th className="w-32 text-right">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row if printFromDate is set */}
              {printFromDate && (
                <tr className="border-b border-gray-400 bg-gray-50 font-bold">
                  <td className="border-r border-black text-center">-</td>
                  <td className="border-r border-black">{formatDate(printFromDate)}</td>
                  <td className="border-r border-black">Opening Balance</td>
                  <td className="border-r border-black text-right">-</td>
                  <td className="border-r border-black text-right">-</td>
                  <td className="text-right font-black">
                    {printedData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {printedData.entries.map((entry: any) => (
                <tr key={entry.id} className="border-b border-gray-300">
                  <td className="border-r border-gray-300 text-center font-bold">{entry.serialNo}</td>
                  <td className="border-r border-gray-300 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="border-r border-gray-300 whitespace-pre-wrap break-words">{entry.narration}</td>
                  <td className="border-r border-gray-300 text-right font-semibold">
                    {entry.debit > 0 ? entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="border-r border-gray-300 text-right font-semibold">
                    {entry.credit > 0 ? entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="text-right font-bold">
                    {entry.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {printedData.entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500 italic">
                    No transactions found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black bg-gray-100 font-black">
                <td colSpan={3} className="border-r border-black text-right uppercase pr-3">
                  Total / Closing Summary
                </td>
                <td className="border-r border-black text-right text-green-900">
                  {printedData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="border-r border-black text-right text-red-900">
                  {printedData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right">
                  {printedData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <SecurityGate
        isOpen={isSecurityOpen}
        onClose={() => {
          setIsSecurityOpen(false)
          setPendingSecurityAction(null)
        }}
        onSuccess={() => {
          if (pendingSecurityAction) {
            pendingSecurityAction()
          }
          setIsSecurityOpen(false)
          setPendingSecurityAction(null)
        }}
      />
    </div>
  )
}
