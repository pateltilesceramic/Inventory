"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  itemName?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 50,
  onPageChange,
  itemName = "records"
}: PaginationControlsProps) {
  if (totalItems === 0 || totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-gray-100 bg-white/60 rounded-b-xl text-xs">
      <div className="text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-800">{startItem}</span> to{" "}
        <span className="font-bold text-slate-800">{endItem}</span> of{" "}
        <span className="font-bold text-slate-800">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="px-3 py-1.5 font-bold text-[#1F6F5F] bg-[#2FA084]/10 rounded-lg border border-[#2FA084]/20">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
