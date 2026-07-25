"use client";

// Sitewide ambient motion layer — a quiet, persistent animated background
// mounted once in the root layout (see layout.tsx), behind every route's
// content. Deliberately subtle: it must never compete with foreground
// content or intercept pointer/keyboard interaction.
//
// STUB — real implementation (Phase 1 scroll-choreography build stream)
// lands here. Intentionally inert (returns null) so it is safe to
// import/mount ahead of that work without any visual or bundle-size effect.
export default function AmbientLayer() {
  return null;
}
