export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="mb-2 text-5xl">{title}</h1>
      <p className="mb-10 text-sm text-muted-foreground">Mise à jour : {updated}</p>
      <div className="space-y-4 leading-relaxed text-foreground/90 [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  )
}
