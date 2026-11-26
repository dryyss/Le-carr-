'use client'

import { ArrowRight, Film, Pause, Play, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const REELS = [
  {
    id: 'ambiance',
    label: 'L’ambiance',
    title: 'Lumière tamisée, banquettes profondes et soirées jusqu’à 2h',
    src: '/videos/le-carre-ambiance.mp4',
    poster: '/images/site/hero-lounge.jpg',
    tag: 'Lounge · 7j/7',
  },
  {
    id: 'cuisine',
    label: 'Cuisine & Bar',
    title: 'Burgers gourmets, pâtes crémeuses, mocktails glacés et desserts maison',
    src: '/videos/le-carre-cuisine.mp4',
    poster: '/images/menu/menu-burgers.jpg',
    tag: 'Fait minute',
  },
] as const

export function VideoShowcase() {
  const [activeId, setActiveId] = useState<(typeof REELS)[number]['id']>('ambiance')
  const [playing, setPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const active = REELS.find((r) => r.id === activeId) ?? REELS[0]

  function switchReel(id: (typeof REELS)[number]['id']) {
    setActiveId(id)
    setPlaying(true)
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <section id="experience" className="mx-auto max-w-6xl px-5 py-20" aria-labelledby="video-titre">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="kicker mb-3 flex items-center gap-2">
            <Film className="size-3.5 text-brand-red" aria-hidden /> Immersion
          </p>
          <h2 id="video-titre" className="text-4xl sm:text-5xl">
            Vivez l’atmosphère du Carré
          </h2>
        </div>

        {/* Sélecteur de bobine vidéo */}
        <div className="inline-flex rounded-full border border-border bg-card p-1" role="tablist" aria-label="Vidéos de présentation">
          {REELS.map((reel) => (
            <button
              key={reel.id}
              type="button"
              role="tab"
              aria-selected={activeId === reel.id}
              onClick={() => switchReel(reel.id)}
              className={cn(
                'rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition-all',
                activeId === reel.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {reel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reveal frame group relative overflow-hidden border border-border bg-card">
        <div
          onClick={togglePlay}
          data-cursor-label={playing ? 'PAUSE' : 'PLAY'}
          className="relative aspect-video w-full cursor-pointer overflow-hidden bg-black sm:aspect-21/10"
        >
          <video
            key={active.src}
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster={active.poster}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          >
            <source src={active.src} type="video/mp4" />
          </video>

          {/* Voile de lisibilité */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />

          {/* Badge live en haut à gauche */}
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-background/70 px-3.5 py-1.5 text-xs uppercase tracking-[0.22em] backdrop-blur-md">
            <span className={cn('size-2 rounded-full bg-brand-red', playing && 'animate-pulse')} />
            {active.tag}
          </div>

          {/* Bouton Play/Pause visible au centre si pause, discret en bas à droite sinon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
            className={cn(
              'absolute inline-flex items-center justify-center rounded-full border border-white/30 bg-background/70 text-foreground backdrop-blur-md transition-all hover:scale-105 hover:border-brand-red hover:bg-brand-red/80',
              playing ? 'bottom-5 right-5 size-11' : 'left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2',
            )}
          >
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-6" />}
          </button>

          {/* Légende bas gauche */}
          <div className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4 pr-14">
            <div className="max-w-xl">
              <p className="font-display text-xl text-foreground sm:text-3xl">{active.title}</p>
            </div>
          </div>
        </div>

        {/* Bandeau d'actions + repères */}
        <div className="grid divide-y divide-border border-t border-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { k: '7j / 7', v: 'De 18h à 2h du matin' },
            { k: '40+ plats', v: 'Burgers, pâtes, mocktails & desserts' },
            { k: 'QR à table', v: 'Commande en 2 clics au bar' },
          ].map((stat) => (
            <div key={stat.k} className="p-5">
              <p className="font-display text-2xl text-foreground">{stat.k}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.v}</p>
            </div>
          ))}
          <div className="flex items-center justify-center p-5">
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/carte">
                <Sparkles className="size-4 text-accent" /> Explorer la carte <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
