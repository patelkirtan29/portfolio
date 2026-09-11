import { palette } from "./colors";

/**
 * `prefers-reduced-motion: reduce` fallback.
 *
 * SIMPLIFIED PLACEHOLDER — flagged honestly per the build report: the
 * Canva/Figma specs both ask for a pre-baked static illustration
 * "hand-exported from the same 3D scene" (a screenshot/render of the
 * fully-unfolded end state saved as a real image asset). Producing that
 * export requires actually running the animated scene in a browser and
 * capturing a frame, which wasn't available in this pass. This inline
 * CSS/SVG illustration is an intentionally simplified stand-in that
 * matches the same palette/composition and is a genuinely static,
 * finished-looking illustration (not a paused mid-animation frame) — it
 * should be swapped for a real exported still (or a hand-authored SVG)
 * when time allows.
 */
export function ReducedMotionFallback() {
  return (
    <div
      className="flex h-[42vh] max-h-[420px] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl"
      style={{ background: `color-mix(in srgb, ${palette.desk} 18%, transparent)` }}
    >
      <svg
        viewBox="0 0 400 220"
        className="h-full w-full max-w-xl"
        role="img"
        aria-label="Illustration of a desk with a laptop, mug, potted plant, desk lamp, books, and a sticky note"
      >
        {/* Desk slab */}
        <rect x="20" y="150" width="360" height="18" rx="6" fill={palette.desk} stroke={palette.outline} strokeWidth="2" />

        {/* Books */}
        <rect x="46" y="122" width="70" height="18" rx="3" fill={palette.bookA} stroke={palette.outline} strokeWidth="2" />
        <rect
          x="50"
          y="106"
          width="60"
          height="16"
          rx="3"
          fill={palette.coralHighlight}
          stroke={palette.outline}
          strokeWidth="2"
          transform="rotate(-3 80 114)"
        />

        {/* Laptop */}
        <rect x="150" y="128" width="86" height="10" rx="2" fill={palette.bookB} stroke={palette.outline} strokeWidth="2" />
        <rect x="150" y="68" width="86" height="60" rx="3" fill={palette.bookB} stroke={palette.outline} strokeWidth="2" />
        <rect x="158" y="76" width="70" height="44" rx="2" fill={palette.screen} />
        <rect x="166" y="94" width="4" height="12" fill={palette.cursor} />

        {/* Mug + steam */}
        <rect x="260" y="120" width="30" height="26" rx="4" fill={palette.coralHighlight} stroke={palette.outline} strokeWidth="2" />
        <path d="M290 126 q10 4 0 12" fill="none" stroke={palette.coralHighlight} strokeWidth="3" />
        <path d="M267 112 q4 -10 0 -18" fill="none" stroke={palette.desk} strokeWidth="2" opacity="0.6" />
        <path d="M279 112 q4 -10 0 -18" fill="none" stroke={palette.desk} strokeWidth="2" opacity="0.4" />

        {/* Plant */}
        <path d="M330 146 l6 -26 l6 26 Z" fill={palette.oliveDark} stroke={palette.outline} strokeWidth="1.5" />
        <path d="M340 146 l7 -30 l7 30 Z" fill={palette.olive} stroke={palette.outline} strokeWidth="1.5" />
        <path d="M350 146 l6 -24 l6 24 Z" fill={palette.oliveDark} stroke={palette.outline} strokeWidth="1.5" />
        <path d="M326 146 h30 l-4 14 h-22 Z" fill={palette.terracotta} stroke={palette.outline} strokeWidth="2" />

        {/* Lamp — base kept clear of the books' left edge (x=46) and
           inside the desk's left edge (x=20) so the two don't visually
           merge at the desk line. */}
        <rect x="22" y="146" width="18" height="6" rx="2" fill={palette.terracotta} stroke={palette.outline} strokeWidth="1.5" />
        <line x1="31" y1="146" x2="46" y2="96" stroke={palette.bookB} strokeWidth="4" strokeLinecap="round" />
        <path d="M42 88 l20 6 l-8 14 l-16 -6 Z" fill={palette.terracotta} stroke={palette.outline} strokeWidth="2" />

        {/* Sticky note — curled corner, propped askew against the laptop */}
        <g transform="translate(140 140) rotate(-8)">
          <path
            d="M0 0 h26 v26 q-8 2 -10 -8 q-2 -10 -16 -8 Z"
            fill={palette.stickyNote}
            stroke={palette.outline}
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}
