"use client"
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ReactNode, MouseEvent } from 'react'

export function TiltCard({ children, className = "" }: { children: ReactNode, className?: string }) {
  const x = useMotionValue(200)
  const y = useMotionValue(200)

  const rotateX = useTransform(y, [0, 400], [5, -5])
  const rotateY = useTransform(x, [0, 400], [-5, 5])

  function handleMouse(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    x.set(event.clientX - rect.left)
    y.set(event.clientY - rect.top)
  }

  function handleMouseLeave() {
    x.set(200)
    y.set(200)
  }

  return (
    <motion.div
      style={{
        perspective: 1200
      }}
      className="relative w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={handleMouse}
        onMouseLeave={handleMouseLeave}
        className={`bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-2xl transition-colors duration-300 ease-out hover:bg-white/[0.04] hover:border-white/10 ${className}`}
      >
        <div style={{ transform: "translateZ(30px)" }} className="h-full">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
