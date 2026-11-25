/**
 * Logo Le Carré redessiné en SVG (cadre aux coins rouges, « CA / ЯRÉ »).
 * Les traits clairs suivent currentColor, les coins rouges la variable --brand-red.
 */
export function Logo({ className, title = 'Le Carré' }: { className?: string; title?: string }) {
  const red = 'var(--brand-red, #b3262b)'
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={title} fill="none">
      <title>{title}</title>
      <g strokeWidth="9" strokeLinecap="square">
        <path d="M30 200V30h170" stroke="currentColor" />
        <path d="M200 30h170v215" stroke={red} />
        <path d="M30 200v170h170" stroke={red} />
        <path d="M200 370h170V245" stroke="currentColor" />
      </g>
      <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        {/* C */}
        <path d="M172 92a56 56 0 1 0 0 76" />
        {/* A */}
        <path d="M218 182 268 70l50 112M237 142h62" />
        {/* Я (R inversé) */}
        <path d="M152 334V224h-34a29 29 0 0 0 0 58h34M130 282l-46 52" />
        {/* R */}
        <path d="M160 334V224h34a29 29 0 0 1 0 58h-34M182 282l46 52" />
        {/* É */}
        <path d="M318 224h-52v110h52M266 279h46M282 208l20-20" />
      </g>
    </svg>
  )
}
