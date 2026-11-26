'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export type GalleryPhoto = {
  id: string
  url: string
  alt: string
  caption?: string
}

export function GalleryLightbox({ photos }: { photos: GalleryPhoto[] }) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (selected === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowRight') setSelected((i) => (i === null ? null : (i + 1) % photos.length))
      if (e.key === 'ArrowLeft') setSelected((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, photos.length])

  const active = selected !== null ? photos[selected] : null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelected(idx)}
            data-cursor-label="VOIR"
            className={`reveal group relative overflow-hidden border border-border/60 bg-card text-left ${
              idx % 5 === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes={idx % 5 === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {photo.caption && (
              <span className="pointer-events-none absolute bottom-3 left-3 translate-y-2 font-display text-sm tracking-wider text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {photo.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {active && selected !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-80 flex items-center justify-center bg-background/92 p-4 backdrop-blur-md"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setSelected(null)}
            className="absolute right-5 top-5 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground"
          >
            <X className="size-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected((selected - 1 + photos.length) % photos.length)
                }}
                className="absolute left-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected((selected + 1) % photos.length)
                }}
                className="absolute right-4 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}

          <figure onClick={(e) => e.stopPropagation()} className="relative max-h-[85vh] w-full max-w-4xl">
            <div className="relative aspect-16/10 w-full overflow-hidden border border-border bg-black">
              <Image src={active.url} alt={active.alt} fill sizes="90vw" className="object-contain" />
            </div>
            <figcaption className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{active.caption ?? active.alt}</span>
              <span className="tabular-nums">
                {selected + 1} / {photos.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  )
}
