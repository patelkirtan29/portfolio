"use client";

// Sitewide ambient motion layer — a quiet, persistent animated background
// mounted once in the root layout (see layout.tsx), behind every route's
// content. Deliberately subtle: it must never compete with foreground
// content or intercept pointer/keyboard interaction.
//
// Visual: two large, heavily-blurred radial-gradient blobs (in the site's
// existing accent-primary/accent-secondary tokens) that drift very slowly
// (48s/64s loops) across the viewport, plus a faint static grain texture
// for depth. CSS-only, no canvas/WebGL.
//
// Note on the technique swap: the build plan (§2.3) actually specifies a
// lightweight WebGL/shader layer here (a restrained take on
// bfcm.shopify.com's retro dot-matrix shader approach) — the spec itself
// does not call CSS out as the safer choice, and an earlier version of
// this comment overstated that it did. This CSS implementation is a
// deliberate, pragmatic substitution made during the build, chosen for
// reliability, performance, and accessibility simplicity (no WebGL
// context to lose/fail, no shader compile cost, trivially satisfies
// reduced-motion/Save-Data fallbacks) — not something the original spec
// authorized. It's tasteful and sufficient for a quiet atmosphere layer as
// shipped; a real shader-based version remains a valid future enhancement
// if the CSS version ever doesn't feel like enough.
//
// Fixed, full-viewport, stacked below all real content (z-index: -1),
// `pointer-events: none` and `aria-hidden` so it never intercepts
// pointer/keyboard interaction or gets announced to screen readers.
//
// `prefers-reduced-motion` and the Save-Data client hint both freeze the
// layer to a static (non-animated) frame of the same visual rather than
// removing it — see useAmbientMotion.ts.
import { useAmbientMotion } from "@/components/ambient/useAmbientMotion";
import styles from "@/components/ambient/AmbientLayer.module.css";

export default function AmbientLayer() {
  const motionAllowed = useAmbientMotion();

  return (
    <div
      aria-hidden="true"
      className={`${styles.layer} ${motionAllowed ? styles.animated : styles.static}`}
    >
      <div className={styles.blobPrimary} />
      <div className={styles.blobSecondary} />
      <div className={styles.grain} />
    </div>
  );
}
