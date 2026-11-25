import type { MenuItem } from '@/payload-types'

const LABELS: Record<NonNullable<MenuItem['tags']>[number], string> = {
  nouveau: 'Nouveau',
  signature: 'Signature',
  sans_alcool: 'Sans alcool',
  vegetarien: 'Végétarien',
  alcool: 'Alcool',
}

export function MenuTags({ tags }: { tags: MenuItem['tags'] }) {
  if (!tags?.length) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className={`rounded-sm border px-1.5 py-0.5 text-[11px] uppercase tracking-wider ${
            t === 'signature' || t === 'nouveau' ? 'border-accent/60 text-accent' : 'border-border text-muted-foreground'
          }`}
        >
          {LABELS[t]}
        </span>
      ))}
    </span>
  )
}
