'use client'

import React, { useRef } from 'react'

/**
 * Effet magnétique subtil sur les CTA : attire légèrement le bouton vers le curseur au survol.
 */
export function Magnetic({ children, strength = 0.22, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * strength
    const y = (e.clientY - r.top - r.height / 2) * strength
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = 'translate3d(0, 0, 0)'
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)', willChange: 'transform' }}
    >
      {children}
    </div>
  )
}
