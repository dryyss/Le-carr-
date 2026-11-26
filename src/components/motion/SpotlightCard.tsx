'use client'

import React, { useRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * Carte interactive : suit la position de la souris pour projeter un halo rouge/verre
 * subtil et un léger soulèvement au survol.
 */
export function SpotlightCard({
  children,
  className,
  cursorLabel,
}: {
  children: React.ReactNode
  className?: string
  cursorLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      data-cursor-label={cursorLabel}
      className={cn(
        'spotlight-card transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-foreground/35',
        className,
      )}
    >
      {children}
    </div>
  )
}
