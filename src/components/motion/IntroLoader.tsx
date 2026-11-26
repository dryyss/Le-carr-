'use client'

import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'lc-intro-seen'

function strokeStyle(len: number, delay: number, dur = 0.7): CSSProperties {
  return {
    '--dash-len': len,
    '--dash-delay': `${delay}s`,
    '--dash-dur': `${dur}s`,
  } as CSSProperties
}

/**
 * Écran d'arrivée cinématique : le logo Le Carré se trace trait par trait,
 * lueur rouge feutrée, puis ouverture en double rideau vers le site.
 * Joué une fois par session (et rejouable via l'événement « lc:replay-intro »).
 */
export function IntroLoader() {
  const [stage, setStage] = useState<'idle' | 'playing' | 'exiting' | 'done'>('idle')

  const start = useCallback(() => {
    setStage('playing')
  }, [])

  const skip = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // navigation privée
    }
    setStage('done')
  }, [])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let seen = false
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      seen = false
    }

    const frame = requestAnimationFrame(() => {
      if (reduced || seen) {
        setStage('done')
      } else {
        setStage('playing')
      }
    })

    const onReplay = () => start()
    window.addEventListener('lc:replay-intro', onReplay)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('lc:replay-intro', onReplay)
    }
  }, [start])

  useEffect(() => {
    if (stage !== 'playing') return
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    const exitTimer = setTimeout(() => setStage('exiting'), 1550)
    const doneTimer = setTimeout(() => {
      setStage('done')
    }, 2250)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [stage, skip])

  if (stage === 'idle' || stage === 'done') return null

  const exiting = stage === 'exiting'

  return (
    <div
      role="status"
      aria-label="Chargement de Le Carré"
      onClick={skip}
      className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden select-none"
      style={{ pointerEvents: exiting ? 'none' : 'auto' }}
    >
      {/* Rideau haut */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-background transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{ transform: exiting ? 'translateY(-102%)' : 'translateY(0)' }}
      />
      {/* Rideau bas */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-background transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{ transform: exiting ? 'translateY(102%)' : 'translateY(0)' }}
      />
      {/* Ligne de coupe rouge centrale lors de l'ouverture */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px bg-brand-red/70 transition-all duration-700"
        style={{
          opacity: exiting ? 0 : 0.35,
          transform: exiting ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />

      {/* Contenu central : halo rouge + logo SVG tracé en direct */}
      <div
        className="relative z-10 flex flex-col items-center gap-7 transition-all duration-500 ease-out"
        style={{
          opacity: exiting ? 0 : 1,
          transform: exiting ? 'scale(0.92)' : 'scale(1)',
        }}
      >
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="animate-glow absolute -inset-12 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(179,38,43,0.45) 0%, transparent 68%)' }}
          />
          <svg viewBox="0 0 400 400" className="relative size-40 sm:size-48" fill="none" aria-hidden>
            {/* Silhouette discrète présente dès l'instant 0 pendant le tracé */}
            <g opacity="0.16" strokeWidth="9" strokeLinecap="square">
              <path d="M30 200V30h170" stroke="currentColor" />
              <path d="M200 30h170v215" stroke="var(--brand-red)" />
              <path d="M30 200v170h170" stroke="var(--brand-red)" />
              <path d="M200 370h170V245" stroke="currentColor" />
            </g>
            <g strokeWidth="9" strokeLinecap="square">
              <path d="M30 200V30h170" stroke="currentColor" className="logo-draw" style={strokeStyle(360, 0.05, 0.55)} />
              <path d="M200 30h170v215" stroke="var(--brand-red)" className="logo-draw" style={strokeStyle(400, 0.16, 0.6)} />
              <path d="M30 200v170h170" stroke="var(--brand-red)" className="logo-draw" style={strokeStyle(360, 0.24, 0.55)} />
              <path d="M200 370h170V245" stroke="currentColor" className="logo-draw" style={strokeStyle(320, 0.34, 0.5)} />
            </g>
            <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
              {/* C */}
              <path d="M172 92a56 56 0 1 0 0 76" className="logo-draw" style={strokeStyle(280, 0.46, 0.55)} />
              {/* A */}
              <path d="M218 182 268 70l50 112M237 142h62" className="logo-draw" style={strokeStyle(340, 0.56, 0.55)} />
              {/* Я */}
              <path d="M152 334V224h-34a29 29 0 0 0 0 58h34M130 282l-46 52" className="logo-draw" style={strokeStyle(360, 0.66, 0.55)} />
              {/* R */}
              <path d="M160 334V224h34a29 29 0 0 1 0 58h-34M182 282l46 52" className="logo-draw" style={strokeStyle(360, 0.74, 0.55)} />
              {/* É */}
              <path d="M318 224h-52v110h52M266 279h46M282 208l20-20" className="logo-draw" style={strokeStyle(320, 0.82, 0.5)} />
            </g>
          </svg>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-xs uppercase tracking-[0.45em] text-foreground/85 animate-reveal" style={{ animationDelay: '0.35s' }}>
            Restaurant Lounge
          </p>
          <div className="h-[2px] w-40 overflow-hidden bg-border/80">
            <div className="animate-loader-bar h-full w-full bg-brand-red" />
          </div>
          <span className="text-[11px] tracking-[0.2em] text-muted-foreground/70 uppercase">Saint-Brice-sous-Forêt</span>
        </div>
      </div>
    </div>
  )
}
