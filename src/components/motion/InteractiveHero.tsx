'use client'

import { ArrowRight, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

import { Magnetic } from './Magnetic'

export function InteractiveHero({
  kicker,
  title,
  subtitle,
  posterUrl,
  videoUrl,
  open,
  hoursLine,
}: {
  kicker: string
  title: string
  subtitle: string
  posterUrl: string
  videoUrl: string
  open: boolean
  hoursLine: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const logoWrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const sec = sectionRef.current
    if (!sec) return
    const rect = sec.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    sec.style.setProperty('--hero-mx', `${px * 100}%`)
    sec.style.setProperty('--hero-my', `${py * 100}%`)

    const logo = logoWrapRef.current
    if (logo) {
      const rx = (0.5 - py) * 14
      const ry = (px - 0.5) * 16
      const tx = (px - 0.5) * 18
      const ty = (py - 0.5) * 14
      logo.style.transform = `perspective(900px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`
    }
  }

  function onMouseLeave() {
    const logo = logoWrapRef.current
    if (logo) {
      logo.style.transform = 'perspective(900px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)'
    }
  }

  function toggleVideo() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPaused(false)
    } else {
      v.pause()
      setPaused(true)
    }
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden"
    >
      {/* Vidéo d'ambiance plein cadre en boucle */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={posterUrl}
        aria-hidden
        className="absolute inset-0 -z-20 size-full scale-[1.03] object-cover opacity-65"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Dégradé cinématique + halo dynamique qui suit la souris */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-background/75 via-background/60 to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(620px circle at var(--hero-mx, 68%) var(--hero-my, 45%), rgba(179, 38, 43, 0.24), transparent 65%)',
        }}
      />
      {/* Quadrillage discret en filigrane */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] bg-size-[72px_72px] opacity-[0.045] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-7">
          <p className="kicker animate-reveal text-accent" style={{ animationDelay: '0.1s' }}>
            {kicker}
          </p>
          <h1
            className="animate-reveal text-6xl uppercase leading-[0.92] tracking-[0.12em] sm:text-7xl lg:text-8xl"
            style={{ animationDelay: '0.2s' }}
          >
            {title}
          </h1>
          <p className="animate-reveal max-w-md text-lg text-foreground/80" style={{ animationDelay: '0.32s' }}>
            {subtitle}
          </p>
          <div className="animate-reveal flex flex-wrap gap-3" style={{ animationDelay: '0.44s' }}>
            <Magnetic>
              <Button asChild size="lg" className="shadow-[0_0_30px_rgba(179,38,43,0.28)]">
                <Link href="/reserver">
                  Réserver une table <ArrowRight />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm">
                <Link href="/commander">Commander à emporter</Link>
              </Button>
            </Magnetic>
          </div>
          <div className="animate-reveal flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground" style={{ animationDelay: '0.56s' }}>
            <p className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                {open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />}
                <span className={`relative inline-flex size-2.5 rounded-full ${open ? 'bg-success' : 'bg-muted-foreground'}`} />
              </span>
              {open ? 'Ouvert en ce moment' : 'Fermé pour le moment'} · {hoursLine}
            </p>
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={paused ? 'Relancer la vidéo d’ambiance' : 'Mettre en pause la vidéo d’ambiance'}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/50 px-3 py-1 text-xs text-foreground/80 backdrop-blur-sm transition-colors hover:border-foreground/50 hover:text-foreground"
            >
              {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
              {paused ? 'Lecture' : 'Ambiance'}
            </button>
          </div>
        </div>

        {/* Logo interactif avec parallaxe 3D à la souris */}
        <div className="flex justify-center max-md:order-first">
          <div
            ref={logoWrapRef}
            data-cursor-label="LE CARRÉ"
            onClick={() => window.dispatchEvent(new CustomEvent('lc:replay-intro'))}
            className="group relative flex cursor-pointer items-center justify-center p-4"
            style={{ transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)', willChange: 'transform' }}
            title="Rejouer l’animation d’entrée"
          >
            {/* Halo rouge pulsant derrière le logo */}
            <div
              aria-hidden
              className="animate-glow absolute -inset-6 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(179,38,43,0.4) 0%, transparent 70%)' }}
            />
            {/* Cadre extérieur rotatif subtil */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 border border-brand-red/25 transition-transform duration-700 group-hover:rotate-3 group-hover:scale-105"
            />
            <Logo className="animate-float relative w-44 drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)] sm:w-56 md:w-full md:max-w-[330px]" />
          </div>
        </div>
      </div>

      {/* Indicateur de scroll animé */}
      <a
        href="#experience"
        aria-label="Découvrir la suite"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80 transition-colors hover:text-foreground sm:flex"
      >
        <span>Découvrir</span>
        <span className="relative h-8 w-px overflow-hidden bg-border">
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-4 bg-brand-red" />
        </span>
      </a>
    </section>
  )
}
