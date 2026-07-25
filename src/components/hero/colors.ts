// Warm paper-craft palette — derived from the site's existing design
// tokens (see src/app/globals.css, CREATIVE_DIRECTION_V2.md §3) per the
// Canva hero-concept spec's explicit rule: "no new hues introduced, this
// is the existing token set staged in 3D."
//
// Values are fixed hex rather than read from CSS custom properties at
// runtime — three.js materials need concrete colors up front, and this
// diorama is meant to read as warm cream paper regardless of the site's
// light/dark toggle. The <Canvas> itself clears to a transparent
// background (see DeskCanvas.tsx), so the page's actual --background
// still shows through around the objects.
export const palette = {
  // Desk slab — "cream desk surface." Matches the light-mode --surface
  // token (#efe9dc) directly.
  desk: "#efe9dc",

  // Mug + one book spine — "desaturate the site's coral accent by ~15%
  // and use it as the warm highlight color." Derived from
  // --accent-primary (dark-mode value #df6c4f), desaturated/muted.
  coralHighlight: "#c9795f",

  // Plant leaves — "warm olive-green." Matches --accent-secondary
  // (dark-mode value #93a08a) directly, plus a slightly darker in-family
  // shade for the underside/shadow leaf.
  olive: "#93a08a",
  oliveDark: "#748069",

  // Lamp shade — "muted terracotta." Same coral family as the accent
  // token, pulled further toward brown/neutral so it doesn't collide
  // visually with the mug's coral highlight.
  terracotta: "#b3775a",

  // Books — "muted warm-neutral tones."
  bookA: "#a68a71",
  bookB: "#8d7660",

  // Sticky note — a lighter tint kept within the cream/neutral family
  // (per the "no new hues" rule) rather than introducing a separate
  // yellow hue.
  stickyNote: "#f5e7c4",

  // Shared warm-dark outline — "not pure black — a darkened desaturated
  // coral-brown," used for every object's screen-space outline.
  outline: "#3c2a22",

  // Laptop screen + cursor.
  screen: "#f2e6cf",
  cursor: "#3c2a22",

  // Lamp point light — warm ~2700K.
  lampLight: "#ffb877",
} as const;
