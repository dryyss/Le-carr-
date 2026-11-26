'use client'

import { useEffect, useRef } from 'react'

/**
 * Curseur géométrique sur mesure inspiré du logo Le Carré :
 * - un losange/carré central ultra réactif
 * - un cadre carré suiveur aux coins rouges avec inertie fluide
 * - une aura lumineuse rouge très subtile qui suit la souris
 * - label contextuel (« VOIR », « AJOUTER », « PLAY ») via data-cursor-label
 * Actif uniquement sur ordinateur (pointeur fin) et respecte prefers-reduced-motion.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const auraRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduced) return

    const dot = dotRef.current
    const frame = frameRef.current
    const label = labelRef.current
    const aura = auraRef.current
    if (!dot || !frame || !label || !aura) return

    let mx = -200
    let my = -200
    let fx = -200
    let fy = -200
    let ax = -200
    let ay = -200
    let active = false
    let hovering = false
    let pressing = false
    let hasLabel = false
    let raf = 0

    const setHoverState = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null
      const labeled = el?.closest<HTMLElement>('[data-cursor-label]')
      const interactive = el?.closest('a, button, summary, label, [role="button"], [data-cursor]')
      const isTextInput = el?.closest('input, textarea, select')

      if (isTextInput) {
        hovering = false
        hasLabel = false
        label.textContent = ''
        frame.style.opacity = '0.25'
        dot.style.opacity = '0'
        return
      }

      dot.style.opacity = active ? '1' : '0'
      frame.style.opacity = active ? '1' : '0'

      if (labeled?.dataset.cursorLabel) {
        hovering = true
        hasLabel = true
        label.textContent = labeled.dataset.cursorLabel
      } else {
        hasLabel = false
        label.textContent = ''
        hovering = Boolean(interactive)
      }
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!active) {
        active = true
        fx = mx
        fy = my
        ax = mx
        ay = my
        document.documentElement.classList.add('has-custom-cursor')
        dot.style.opacity = '1'
        frame.style.opacity = '1'
        aura.style.opacity = '1'
      }
      setHoverState(e.target)
    }

    const onDown = () => {
      pressing = true
    }
    const onUp = () => {
      pressing = false
    }
    const onLeave = () => {
      active = false
      dot.style.opacity = '0'
      frame.style.opacity = '0'
      aura.style.opacity = '0'
    }

    const loop = () => {
      const vx = mx - fx
      const vy = my - fy
      fx += vx * 0.18
      fy += vy * 0.18
      ax += (mx - ax) * 0.08
      ay += (my - ay) * 0.08

      const speed = Math.min(Math.hypot(vx, vy), 30)
      const angle = hovering ? 0 : 45 + Math.max(-14, Math.min(14, vx * 0.45))
      const frameScale = pressing ? 0.78 : hasLabel ? 1.85 : hovering ? 1.38 : 1 + speed * 0.006

      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) rotate(${hovering ? 0 : 45}deg) scale(${pressing ? 0.7 : hasLabel ? 0 : 1})`
      frame.style.transform = `translate3d(${fx}px, ${fy}px, 0) translate(-50%, -50%) rotate(${hasLabel ? 0 : angle * 0.2}deg) scale(${frameScale})`
      frame.dataset.hover = hovering ? '1' : '0'
      frame.dataset.labeled = hasLabel ? '1' : '0'
      aura.style.transform = `translate3d(${ax}px, ${ay}px, 0) translate(-50%, -50%)`

      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      {/* Halo ambiant discret qui suit le déplacement de la souris */}
      <div
        ref={auraRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-10 size-[440px] rounded-full opacity-0 transition-opacity duration-500 max-md:hidden"
        style={{
          background: 'radial-gradient(circle, rgba(179,38,43,0.12) 0%, rgba(245,245,245,0.03) 38%, transparent 68%)',
          willChange: 'transform',
        }}
      />

      {/* Cadre géométrique suiveur aux coins rouges (signature Le Carré) */}
      <div
        ref={frameRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-90 flex size-9 items-center justify-center opacity-0 transition-[opacity,background-color,border-color] duration-200 max-md:hidden data-[hover=1]:bg-brand-red/12 data-[labeled=1]:bg-background/90 data-[labeled=1]:backdrop-blur-sm"
        style={{ willChange: 'transform' }}
      >
        {/* 4 coins rappelant le logo Le Carré */}
        <span className="absolute left-0 top-0 size-2.5 border-l-2 border-t-2 border-foreground/80" />
        <span className="absolute right-0 top-0 size-2.5 border-r-2 border-t-2 border-brand-red" />
        <span className="absolute bottom-0 left-0 size-2.5 border-b-2 border-l-2 border-brand-red" />
        <span className="absolute bottom-0 right-0 size-2.5 border-b-2 border-r-2 border-foreground/80" />
        <span
          ref={labelRef}
          className="font-display text-[6.5px] font-medium uppercase tracking-[0.2em] text-foreground"
        />
      </div>

      {/* Point central losange précis */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-90 size-1.5 bg-foreground opacity-0 shadow-[0_0_8px_rgba(179,38,43,0.9)] transition-opacity duration-150 max-md:hidden"
        style={{ willChange: 'transform' }}
      />
    </>
  )
}
