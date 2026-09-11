import type { Metadata } from "next";
import Link from "next/link";
import RevealText from "@/components/ambient/RevealText";

// ---------------------------------------------------------------------------
// PLACEHOLDER CONTENT — flagged per CREATIVE_DIRECTION_V2.md §7.
// The prose below is written at the voice/quality bar the spec asks for
// (first-person, plainspoken, specific-over-adjective-heavy), but the
// following facts are stand-ins for a real person and MUST be replaced
// before ship:
//   - The name "Jordan Reyes" (used once, in the lede).
//   - The tenure ("eight years"), the two anecdote employers ("a logistics
//     startup" / "a mid-size fintech"), and every concrete number attached
//     to them (640ms, 190ms, 47 minutes, 6 minutes, 2:14am, 11 hours).
//   - The specific stack list, if the real person's actual tools differ.
// The *shape* of each sentence — concrete detail before adjective, human
// stakes before mechanism — is the part meant to carry forward as the
// site's voice, per the build-order note that About "sets the voice for
// everything else."
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "About (placeholder name — replace before ship)",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-3 py-6 md:px-4 md:py-8">
      <header className="mb-6">
        <p className="font-mono text-sm text-accent-primary">02 — About</p>
        <RevealText as="h1" className="mt-1 font-display text-4xl md:text-5xl">
          Jordan Reyes
        </RevealText>
      </header>

      <section className="space-y-3 font-sans text-lg leading-relaxed">
        <p>
          I&apos;m a software engineer, and for about eight years now the
          shape of my job has stayed the same even as the tools around it
          changed: someone has a problem, I turn it into a system that
          doesn&apos;t need me hovering over it, and then I go find out where
          it breaks before a user does.
        </p>
        <p>
          The work I&apos;m proudest of is rarely the part anyone notices. At
          a logistics startup, a warehouse routing tool I rebuilt took a
          dispatcher&apos;s worst morning — a driver calling in sick at
          6am — from a 47-minute manual reshuffle to a 6-minute one. Nobody
          outside that dispatch office ever saw the code. That&apos;s fine.
          The point wasn&apos;t the code; it was that a person got to leave
          for their kid&apos;s recital on time.
        </p>
      </section>

      <section className="mt-6 space-y-3 font-sans text-lg leading-relaxed">
        <RevealText as="h2" className="mb-1 font-display text-2xl">
          How I think about the work
        </RevealText>
        <p>
          I don&apos;t start from the architecture. I start from the worst
          moment someone is going to have with the thing I&apos;m building,
          and I build backwards from there. At a mid-size fintech, that
          meant sitting with a support engineer while she walked a customer
          through a stuck payment at 2:14am — not reading her ticket
          summary afterward, actually listening to the call. The fix that
          came out of it wasn&apos;t clever. It was a retry queue with a
          human-readable status, so the next 2:14am call took four minutes
          instead of twenty.
        </p>
        <p>
          The mechanism matters, but it comes second. When I do talk about
          mechanism, I try to be specific about it rather than
          impressed by it: a checkout endpoint I profiled last year dropped
          from a 640ms p95 to 190ms once I noticed it was making two
          round trips to fetch data one query could join. That sentence is
          more useful to another engineer than &quot;made it blazing
          fast,&quot; and it&apos;s also just more honest — 190ms is a
          number you can go verify.
        </p>
        <p>
          I keep a running log of bugs that took longer than an hour to
          find, with the actual root cause written in one sentence. The
          worst one on that list took 11 hours and turned out to be a
          timezone-naive timestamp comparison that only failed during
          daylight saving transitions. I reread that log before starting
          anything gnarly, mostly to remind myself that the boring
          explanation is usually the right one.
        </p>
      </section>

      <section className="mt-6 space-y-3 font-sans text-lg leading-relaxed">
        <RevealText as="h2" className="mb-1 font-display text-2xl">
          What I reach for
        </RevealText>
        <p>
          I write most things in{" "}
          <span className="font-mono text-accent-primary">TypeScript</span>{" "}
          and <span className="font-mono text-accent-primary">React</span>,
          not because they&apos;re fashionable but because a type error
          caught while I&apos;m typing is cheaper than a support ticket
          three weeks later — I&apos;d rather the compiler yell at me than
          a customer. For the same reason I reach for{" "}
          <span className="font-mono text-accent-primary">Postgres</span>{" "}
          over a document store by default: most of the data I work with
          has real relationships in it, and I&apos;d rather enforce that
          at the schema level than reconstruct it in application code
          after something drifts.
        </p>
        <p>
          <span className="font-mono text-accent-primary">Next.js</span> is
          my default for anything with a UI, mainly for one boring reason —
          I don&apos;t want to hand-roll routing, data fetching, and
          bundling decisions on every project when a well-maintained
          framework already made reasonable defaults. On the backend I
          reach for{" "}
          <span className="font-mono text-accent-primary">Node</span> when
          the team around a project is already thinking in JavaScript, and
          I&apos;ll reach past it — usually for something with a stronger
          type system at the boundary — when a service is going to sit
          under load I can&apos;t easily reproduce locally.
        </p>
        <p>
          None of this is a loyalty test. I&apos;ve shipped production code
          in languages I didn&apos;t enjoy because the team already had
          five years of institutional knowledge in it, and rewriting that
          knowledge away is a worse trade than living with a language
          I&apos;m not in love with.
        </p>
      </section>

      <section className="mt-6 space-y-3 font-sans text-lg leading-relaxed">
        <RevealText as="h2" className="mb-1 font-display text-2xl">
          Outside the editor
        </RevealText>
        <p>
          Most of what makes me better at this job doesn&apos;t look like
          this job. Debugging a flaky test suite and figuring out why a
          sourdough starter died over a weekend use the same muscle: change
          one variable, write down what actually happened, don&apos;t
          trust your memory of it a day later.
        </p>
      </section>

      <footer className="mt-8 border-t border-accent-secondary/20 pt-4">
        <p className="font-sans text-base text-foreground/80">
          If you want to talk through a problem like the ones above,{" "}
          <Link
            href="/contact"
            className="text-accent-primary underline underline-offset-4"
          >
            get in touch
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
