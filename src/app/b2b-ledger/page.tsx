"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getB2BParties, createB2BParty, deleteB2BParty, createB2BEntry, getLatestB2BEntries } from "@/lib/actions"
import { PaginationControls } from "@/components/common/PaginationControls"
import { numberToWordsIN } from "@/lib/utils"
import { Search, Plus, Briefcase, ArrowUpRight, ArrowDownRight, FileText, ChevronRight, X, IndianRupee, History, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function B2BLedgerPage() {
  const [parties, setParties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Modals
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false)
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyEntries, setHistoryEntries] = useState<any[]>([])
  const [partySearchText, setPartySearchText] = useState("")
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false)

  // Forms
  const [partyName, setPartyName] = useState("")
  const [isSavingParty, setIsSavingParty] = useState(false)

  const [entryData, setEntryData] = useState({
    partyId: "",
    date: new Date().toISOString().slice(0, 10),
    narration: "",
    debit: "",
    credit: ""
  })
  const [isSavingEntry, setIsSavingEntry] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await getB2BParties()
    setParties(data || [])
    if (data && data.length > 0 && !entryData.partyId) {
      setEntryData(prev => ({ ...prev, partyId: data[0].id }))
      setPartySearchText(data[0].name)
    }
    setLoading(false)
  }

  const handleDeleteParty = async (party: any) => {
    if (!confirm(`Are you sure you want to delete "${party.name}"? This will permanently remove the partner and all associated ledger entries.`)) return
    try {
      const res = await deleteB2BParty(party.id)
      if (res && !res.success) {
        alert(res.error)
      } else {
        await loadData()
      }
    } catch (err: any) {
      alert("Error deleting party: " + (err.message || "Unknown error"))
    }
  }

  const handleOpenHistory = async () => {
    const data = await getLatestB2BEntries()
    setHistoryEntries(data || [])
    setIsHistoryOpen(true)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyName.trim()) return
    setIsSavingParty(true)
    try {
      const res = await createB2BParty(partyName)
      if (res && !res.success) {
        alert(res.error)
      } else if (res && res.success) {
        setPartyName("")
        setIsAddPartyOpen(false)
        await loadData()
      }
    } catch (err: any) {
      alert("Error adding party: " + (err.message || "Unknown error"))
    } finally {
      setIsSavingParty(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryData.partyId || !entryData.narration.trim()) return
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
    setIsSavingEntry(true)
    try {
      await createB2BEntry({
        partyId: entryData.partyId,
        date: entryData.date,
        narration: entryData.narration,
        debit: entryData.debit ? parseFloat(entryData.debit) : 0,
        credit: entryData.credit ? parseFloat(entryData.credit) : 0
      })
      setEntryData({
        partyId: parties.length > 0 ? parties[0].id : "",
        date: new Date().toISOString().slice(0, 10),
        narration: "",
        debit: "",
        credit: ""
      })
      if (parties.length > 0) setPartySearchText(parties[0].name)
      setIsAddEntryOpen(false)
      await loadData()
    } catch (err: any) {
      alert("Error creating entry: " + (err.message || "Unknown error"))
    } finally {
      setIsSavingEntry(false)
    }
  }

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full pb-20 max-w-6xl mx-auto space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="typo-h1 flex items-center gap-2.5">
            <Briefcase className="w-8 h-8 text-[#2FA084]" /> B2B Partners Ledger
          </h1>
          <p className="typo-body text-[#111111]/60 mt-1">Track receivables, contractor accounts, and mutual business trade transactions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111111]/30" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search partner name..."
              className="w-full bg-white border border-gray-200 focus:border-[#2FA084] focus:ring-4 focus:ring-[#6FCF97]/20 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm skeu-input"
            />
          </div>

          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-2 bg-white text-[#111111] px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            <History className="w-4 h-4 text-[#1F6F5F]" /> History
          </button>

          <button
            onClick={() => setIsAddPartyOpen(true)}
            className="flex items-center gap-2 bg-white text-[#111111] px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#1F6F5F]" /> Add a Party
          </button>

          <button
            onClick={() => {
              if (parties.length === 0) {
                alert("Please add at least one party first.")
                setIsAddPartyOpen(true)
                return
              }
              setIsAddEntryOpen(true)
            }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-md"
            style={{ 
              background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)', 
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 4px 14px rgba(31,111,95,0.30)', 
              border: '1px solid rgba(0,0,0,0.12)' 
            }}
          >
            <Plus className="w-4 h-4" /> Create an Entry
          </button>
        </div>
      </div>

      {/* Add Party Modal */}
      <AnimatePresence>
        {isAddPartyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2FA084]" /> Add B2B Partner
                </h3>
                <button onClick={() => setIsAddPartyOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddParty} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Partner / Business Name</label>
                  <input
                    required
                    placeholder="e.g. Sri Sai Builders & Contractors"
                    value={partyName}
                    onChange={e => setPartyName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddPartyOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSavingParty}
                    className="px-5 py-2 text-sm font-black text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    {isSavingParty ? "Saving..." : "Save Party"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Entry Modal */}
      <AnimatePresence>
        {isAddEntryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2FA084]" /> Record B2B Ledger Entry
                </h3>
                <button onClick={() => setIsAddEntryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Select Partner (Type or Select)</label>
                    <div className="relative">
                      <input
                        required
                        placeholder="Type or click arrow to select..."
                        value={partySearchText}
                        onChange={e => {
                          setPartySearchText(e.target.value)
                          setIsPartyDropdownOpen(true)
                          const match = parties.find(p => p.name.toLowerCase() === e.target.value.trim().toLowerCase())
                          if (match) {
                            setEntryData({ ...entryData, partyId: match.id })
                          } else {
                            setEntryData({ ...entryData, partyId: "" })
                          }
                        }}
                        onFocus={() => setIsPartyDropdownOpen(true)}
                        className="w-full rounded-xl border border-gray-200 pl-3 pr-10 py-2.5 text-sm font-semibold text-[#111111] outline-none focus:border-[#2FA084] skeu-input"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isPartyDropdownOpen ? 'rotate-90' : 'rotate-0'}`} />
                      </button>
                    </div>
                    {isPartyDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl divide-y divide-gray-100">
                        {parties.filter(p => p.name.toLowerCase().includes(partySearchText.toLowerCase())).length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">No matching partners</div>
                        ) : (
                          parties.filter(p => p.name.toLowerCase().includes(partySearchText.toLowerCase())).map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setEntryData({ ...entryData, partyId: p.id })
                                setPartySearchText(p.name)
                                setIsPartyDropdownOpen(false)
                              }}
                              className={`p-2.5 text-sm font-semibold cursor-pointer hover:bg-[#2FA084]/10 transition-colors ${entryData.partyId === p.id ? 'bg-[#2FA084]/15 text-[#1F6F5F]' : 'text-[#333333]'}`}
                            >
                              {p.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111]/70 uppercase tracking-wider mb-1.5">Narration / Descriptive Info</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Tile Sale Delivery #INV-102 or Payment Received via Cheque"
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
                    <p className="text-[10px] text-gray-500 mt-1">Sale bill / amount partner owes</p>
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
                    <p className="text-[10px] text-gray-500 mt-1">Payment received / mutual material purchase</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAddEntryOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={isSavingEntry}
                    className="px-5 py-2 text-sm font-black text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)' }}
                  >
                    {isSavingEntry ? "Saving..." : "Save Entry"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 6px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)' }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm font-black text-[#111111] uppercase tracking-wider border-b border-gray-300" style={{ background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)' }}>
                <th className="py-4 px-6 w-[8%]">S.No.</th>
                <th className="py-4 px-6 w-[34%]">Party Name</th>
                <th className="py-4 px-6 text-left w-[18%]">Total Debit (Dr)</th>
                <th className="py-4 px-6 text-left w-[18%]">Total Credit (Cr)</th>
                <th className="py-4 px-6 text-left w-[14%]">Latest Balance</th>
                <th className="py-4 px-6 text-left w-[8%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[#111111]/40 font-medium">Loading B2B ledger...</td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[#111111]/40">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-base text-[#111111]/70">No B2B parties found</p>
                    <p className="text-xs mt-1">Click &quot;+ Add a Partner&quot; to start maintaining your B2B ledger.</p>
                  </td>
                </tr>
              ) : (
                (() => {
                  const itemsPerPage = 50
                  const paginatedParties = filteredParties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  return paginatedParties.map((party, index) => (
                    <tr key={party.id} className="hover:bg-white/80 transition-all text-sm group">
                      <td className="py-4 px-6 font-normal text-gray-500 text-sm">#{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="py-4 px-6 font-medium text-[#111111] text-sm break-words text-wrap max-w-xs">{party.name}</td>
                      <td className="py-4 px-6 font-medium text-green-700 text-sm text-left whitespace-nowrap">
                        {party.totalDebit > 0 ? `₹${party.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-4 px-6 font-medium text-red-700 text-sm text-left whitespace-nowrap">
                        {party.totalCredit > 0 ? `₹${party.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-4 px-6 text-left whitespace-nowrap text-sm">
                        <div className="flex items-center justify-start gap-2">
                          <span className="font-medium text-sm text-[#111111]">
                            ₹{party.latestBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                            party.balanceType === 'Dr' ? 'bg-green-100 text-green-800' :
                            party.balanceType === 'Cr' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {party.balanceType}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-left whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/b2b-ledger/${party.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1F6F5F] bg-[#2FA084]/10 hover:bg-[#2FA084]/20 border border-[#2FA084]/30 transition-all"
                            title="View Partner Ledger & Entries"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteParty(party)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Party"
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
          {loading ? (
            <div className="p-12 text-center text-[#111111]/40 font-medium">Loading B2B ledger...</div>
          ) : filteredParties.length === 0 ? (
            <div className="p-12 text-center text-[#111111]/40">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-base text-[#111111]/70">No B2B partners found</p>
            </div>
          ) : (
            (() => {
              const itemsPerPage = 50
              const paginatedParties = filteredParties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              return paginatedParties.map((party, index) => (
                <div key={party.id} className="p-5 hover:bg-white/80 transition-all text-sm space-y-3">
                  <div className="flex items-center justify-between font-black text-[#333333] text-base">
                    <span>{party.name}</span>
                    <span className="text-xs text-gray-400 font-bold">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                    <div className="font-bold text-green-700">
                      <span className="text-gray-400 font-normal block">Total Dr:</span>
                      ₹{party.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="font-bold text-red-700 text-right">
                      <span className="text-gray-400 font-normal block">Total Cr:</span>
                      ₹{party.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-normal">Balance:</span>
                      <span className="font-black text-sm text-[#111111]">
                        ₹{party.latestBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        party.balanceType === 'Dr' ? 'bg-green-100 text-green-800' :
                        party.balanceType === 'Cr' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {party.balanceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/b2b-ledger/${party.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1F6F5F] bg-[#2FA084]/10 hover:bg-[#2FA084]/20 border border-[#2FA084]/30 transition-all"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteParty(party)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                        title="Delete Party"
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
          totalPages={Math.ceil(filteredParties.length / 50)}
          totalItems={filteredParties.length}
          itemsPerPage={50}
          onPageChange={setCurrentPage}
          itemName="B2B partners"
        />
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,30,25,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl p-6 rounded-2xl bg-white border border-gray-200 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1F6F5F] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#2FA084]" /> Recent Entries (Last 7)
                </h3>
                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="overflow-x-auto max-h-[60vh] pr-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[#111111]/40 uppercase tracking-widest font-black">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Partner</th>
                      <th className="py-2.5">Narration</th>
                      <th className="py-2.5 text-right">Debit (Dr)</th>
                      <th className="py-2.5 text-right">Credit (Cr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historyEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 italic">No entries made yet.</td>
                      </tr>
                    ) : (
                      historyEntries.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 font-medium text-slate-500">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                          <td className="py-2.5 font-bold text-slate-700">{e.party?.name}</td>
                          <td className="py-2.5 text-slate-600 max-w-[200px] truncate" title={e.narration}>{e.narration}</td>
                          <td className="py-2.5 text-right font-black text-green-700">
                            {e.debit > 0 ? `₹${e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-2.5 text-right font-black text-red-700">
                            {e.credit > 0 ? `₹${e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
