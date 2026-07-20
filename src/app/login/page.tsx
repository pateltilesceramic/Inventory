"use client"
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    await new Promise(r => setTimeout(r, 500))

    const success = login(username, password)
    if (!success) {
      setError('Invalid username or password. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0D1F1C]">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#1F6F5F]/30 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#2FA084]/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#6FCF97]/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative z-10 w-full max-w-md mx-4`}
        style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
      >
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-float"
            style={{
              background: 'linear-gradient(145deg, #2FA084 0%, #1F6F5F 60%, #174f43 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.30) inset, 0 -2px 0 rgba(0,0,0,0.25) inset, 0 20px 60px rgba(31,111,95,0.55), 0 8px 20px rgba(0,0,0,0.30)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            {/* Highlight shimmer on logo */}
            <div className="absolute top-1.5 left-3 w-10 h-3 rounded-full bg-white/20 blur-sm pointer-events-none" />
            <span className="text-3xl font-black text-white drop-shadow-lg relative z-10">P</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Patel Tiles & Ceramic</h1>
            <p className="text-sm text-white/40 mt-1 font-medium uppercase tracking-widest">Management System</p>
          </motion.div>
        </div>

        {/* Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.20), 0 1px 0 rgba(255,255,255,0.12) inset'
          }}
        >
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
          {/* Inner glass highlight */}
          <div className="absolute top-0 left-0 right-0 h-24 rounded-t-3xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)'
          }} />

          <div className="mb-6 relative z-10">
            <h2 className="text-lg font-bold text-white">Welcome back</h2>
            <p className="text-sm text-white/45 mt-1">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Username */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-white/35 mb-2 block">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="Enter your username"
                  className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm font-medium outline-none transition-all placeholder:text-white/20"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.20) inset, 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(47,160,132,0.60)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.20) inset, 0 0 0 3px rgba(111,207,151,0.20), 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.20) inset, 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-white/35 mb-2 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl pl-11 pr-12 py-3.5 text-white text-sm font-medium outline-none transition-all placeholder:text-white/20"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.20) inset, 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(47,160,132,0.60)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.20) inset, 0 0 0 3px rgba(111,207,151,0.20), 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.20) inset, 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl px-4 py-3 text-xs font-bold text-red-300 uppercase tracking-wide"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit — Skeuomorphic press button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading || !username || !password}
              className="w-full text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, #2FA084 0%, #1F6F5F 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.28) inset, 0 -2px 0 rgba(0,0,0,0.22) inset, 0 6px 20px rgba(31,111,95,0.45), 0 2px 6px rgba(0,0,0,0.20)',
                border: '1px solid rgba(0,0,0,0.15)'
              }}
              onMouseDown={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(1px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,0.22) inset, 0 1px 0 rgba(255,255,255,0.12) inset'
              }}
              onMouseUp={e => {
                (e.currentTarget as HTMLElement).style.transform = ''
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 0 rgba(255,255,255,0.28) inset, 0 -2px 0 rgba(0,0,0,0.22) inset, 0 6px 20px rgba(31,111,95,0.45), 0 2px 6px rgba(0,0,0,0.20)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-white/18 text-xs mt-6 font-medium">
          © 2025 Patel Tiles & Ceramic. All rights reserved.
        </p>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
