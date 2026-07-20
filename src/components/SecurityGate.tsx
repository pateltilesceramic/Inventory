"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, X } from "lucide-react"

export function SecurityGate({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
        onClose()
        setPassword("")
      } else {
        setError("Incorrect master password")
      }
    } catch (e) {
      setError("Verification failed")
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop — heavy blur */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0"
            style={{
              background: 'rgba(10,30,25,0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={onClose}
          />

          {/* Glass Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 350 }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(245, 248, 247, 0.90)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.60)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.90) inset'
            }}
          >
            {/* Top shimmer */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-6 flex items-center gap-4 relative" style={{
              background: 'linear-gradient(180deg, rgba(31,111,95,0.06) 0%, rgba(31,111,95,0.02) 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}>
              {/* 3D Raised Lock Icon */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 relative" style={{
                background: 'linear-gradient(145deg, #e84444 0%, #c53030 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 -2px 0 rgba(0,0,0,0.20) inset, 0 6px 18px rgba(197,48,48,0.40), 0 2px 6px rgba(0,0,0,0.20)',
                border: '1px solid rgba(0,0,0,0.12)'
              }}>
                {/* Highlight glint */}
                <div className="absolute top-1.5 left-2.5 w-5 h-2 rounded-full bg-white/30 blur-[2px] pointer-events-none" />
                <Lock className="w-5 h-5 drop-shadow-sm relative z-10" />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#111111]">Security Gate</h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#111111]/40 mt-0.5">Admin Access Required</p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[#111111]/35 hover:text-[#111111] transition-colors"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0f2f1 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 6px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.10)'
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm font-medium text-[#111111]/65 mb-5 leading-relaxed">
                The action you are attempting modifies irreversible inventory data. Please enter the master password to continue.
              </p>
              
              <div className="space-y-4">
                {/* Inset-well password input */}
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Master Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && password && handleSubmit(e as any)}
                  className="w-full rounded-xl px-4 py-3.5 text-[#111111] font-medium placeholder:text-[#111111]/25 transition-all outline-none skeu-input"
                />
                {error && <p className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {error}
                </p>}
                
                {/* Skeu primary button */}
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !password}
                  className="w-full text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.28) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 6px 18px rgba(31,111,95,0.35), 0 2px 5px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.12)'
                  }}
                  onMouseDown={e => {
                    if (!loading && password) {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(1px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.18) inset, 0 1px 0 rgba(255,255,255,0.10) inset'
                    }
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLElement).style.transform = ''
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.28) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 6px 18px rgba(31,111,95,0.35), 0 2px 5px rgba(0,0,0,0.15)'
                  }}
                >
                  {loading ? 'Verifying Identity...' : 'Unlock Action'}
                </button>
              </div>
            </div>

            {/* Bottom shadow bevel */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/08 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
