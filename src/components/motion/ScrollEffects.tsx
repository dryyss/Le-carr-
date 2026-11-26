'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Barre de progression de lecture ultra-fine en haut de page
 * + révélation fluide en cascade (.reveal) compatible tous navigateurs.
 */
export function ScrollEffects() {
  const barRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const bar = barRef.current
    const onScroll = () => {
      if (!bar) return
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      bar.style.transform = `scaleX(${ratio})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (!nodes.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )

    nodes.forEach((node, index) => {
      if (!node.style.transitionDelay) {
        node.style.transitionDelay = `${(index % 4) * 70}ms`
      }
      observer.observe(node)
    })

    return () => observer.disconnect()
  }, [pathname])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-linear-to-r from-brand-red via-accent to-foreground/90"
        style={{ transform: 'scaleX(0)', willChange: 'transform' }}
      />
    </div>
  )
}
