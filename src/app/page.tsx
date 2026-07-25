import Link from "next/link";

// Home — CREATIVE_DIRECTION_V2.md §4/§6: a status/intro moment, explicitly
// NOT a full "Now" dashboard (that's deferred). First-person, plainspoken
// voice per §7 ("specific over adjective-heavy") framing the technical
// material that the rest of the site (Work, About, the future ambient
// status strip) will show in more depth.
//
// PLACEHOLDER COPY: name/voice below are representative, not final — swap
// in the real person's name, bio specifics, and stats before ship.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-5xl flex-col justify-center gap-6 px-4 pt-16 pb-22 sm:px-6">
      {/* <HeroScene /> mounts here — see hero stream (Phase 1 scope item 1).
         Home route only (mounts/unmounts with this page, not persistent
         across routes — see AmbientLayer in layout.tsx for the sitewide
         layer). Renders above/behind this existing content per the hero
         stream's own layout; not wired up yet. */}
      <p className="font-mono text-sm text-accent-primary">00 — Home</p>

      <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
        {/* PLACEHOLDER: replace "I'm a developer" with the real name/title. */}
        Hi, I&apos;m a developer — this is my actual working material.
      </h1>

      <div className="max-w-2xl space-y-4 font-sans text-lg text-foreground/80">
        <p>
          {/* PLACEHOLDER copy — specific-over-adjective-heavy per the
             site's own writing rule; swap in a real, current fact before
             ship (e.g. "128ms TTFB," not "blazing fast"). */}
          I build things and keep the receipts: real diffs, real commit
          history, real numbers — not a highlight reel. This site is where
          I keep them.
        </p>
        <p>
          Poke around. The work is real, the words underneath it are mine.
        </p>
      </div>

      <div>
        <Link
          href="/work"
          className="group inline-flex items-baseline gap-2 border-b-2 border-accent-primary pb-0.5 font-sans text-lg text-foreground transition-colors hover:text-accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-primary"
        >
          See the work
          <span aria-hidden="true" className="font-mono text-accent-primary">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}
