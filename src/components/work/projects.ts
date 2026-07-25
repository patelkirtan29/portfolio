// Merge layer between live GitHub data (src/lib/github.ts) and the Work
// page's "human outcome before technical detail" design concept.
//
// GitHub can tell us *what* a repo is (language, stars, last push) but not
// *why* it mattered to a person — that's real, written case-study content
// that only exists for a couple of flagship projects. So this module merges
// the two: repos with a curated entry in FLAGSHIP_OVERRIDES render as a full
// case study (problem, human story/outcome, approach, outcome, optional
// before/after diff); every other repo renders as a simpler live-data card
// built entirely from what the GitHub API actually returned.
import type { GitHubRepoSummary } from "@/lib/github";

export type DiffLine = {
  type: "add" | "remove" | "context";
  text: string;
};

export type ProjectDiff = {
  /** One-line human-outcome sentence shown before the diff itself. */
  caption: string;
  before: DiffLine[];
  after: DiffLine[];
};

/** Curated case-study content for a repo that gets the flagship treatment. */
type FlagshipOverride = {
  /** Technical face: one-line problem statement. */
  oneLiner: string;
  stack: string[];
  /** Human-story face: why it mattered, what was learned. */
  humanStory: string;
  /** Plain-English human-outcome line, shown before any technical detail. */
  humanOutcome: string;
  approach: string;
  outcome: string;
  /** Flagship projects can additionally get the before/after diff reveal. */
  diff?: ProjectDiff;
};

export type FlagshipProject = FlagshipOverride & {
  kind: "flagship";
  slug: string;
  name: string;
  htmlUrl: string;
  stargazersCount: number;
  updatedAt: string;
  pushedAt: string;
};

/** A repo with no curated narrative — rendered from live GitHub data only. */
export type LiveProject = {
  kind: "live";
  slug: string;
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
  pushedAt: string;
};

export type Project = FlagshipProject | LiveProject;

// ---------------------------------------------------------------------------
// FLAGSHIP_OVERRIDES
//
// Keyed by the real GitHub repo name (case-sensitive, exact match). Picking
// which real repos deserve the flagship case-study treatment isn't something
// GitHub's API can tell us, so this is a judgment call made without
// firsthand knowledge of which projects the account owner is proudest of.
//
// Current picks — "nndl-immunonet" and "vocd_faers" — were chosen by a
// simple "most recently active, non-coursework, non-meta" heuristic over
// the real repo list (all repos currently have 0 stars, so recency + rough
// substance was the only real signal available):
//   - excluded `portfolio` itself (it's this site — a weird thing to feature
//     as its own case study)
//   - excluded the CSCI_*/DATS_* coursework repos (homework, not projects)
//   - excluded old, undocumented toy repos (app, Crud_Operation,
//     instagram-clone) with no description and years-old activity
//   - left with NNDL-Immunonet and VOCD_FAERS as the two most recently
//     pushed, substantive-looking personal projects
//
// The content below is intentionally left as TODOs rather than invented
// prose — fabricating a "why it mattered" story or a before/after diff for
// a real repo would just be lying about it. RECONSIDER THIS: swap in real
// case-study writing for these two (or point the map at two different
// repos entirely) once the account owner has reviewed their real project
// list.
const FLAGSHIP_OVERRIDES: Record<string, FlagshipOverride> = {
  "NNDL-Immunonet": {
    oneLiner: "TODO — replace with the real problem this project solved.",
    stack: ["Python", "Jupyter Notebook"],
    humanStory:
      "TODO — replace with the real story of why this project mattered, in the account owner's own words.",
    humanOutcome: "TODO — replace with a real, plain-English human-outcome line.",
    approach: "TODO — replace with a real description of the technical approach taken.",
    outcome: "TODO — replace with a real, measurable (or honestly qualitative) outcome.",
  },
  VOCD_FAERS: {
    oneLiner: "TODO — replace with the real problem this project solved.",
    stack: ["Python"],
    humanStory:
      "TODO — replace with the real story of why this project mattered, in the account owner's own words.",
    humanOutcome: "TODO — replace with a real, plain-English human-outcome line.",
    approach: "TODO — replace with a real description of the technical approach taken.",
    outcome: "TODO — replace with a real, measurable (or honestly qualitative) outcome.",
  },
};

/** Turn a GitHub repo name into a URL-safe, lowercase slug. */
export function slugify(repoName: string): string {
  return repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Merge live GitHub repo data with any curated flagship overrides, in
 * flagship-first order (flagship case studies lead the grid, the rest
 * follow in the already most-recently-pushed-first order from the API).
 */
export function buildProjects(repos: GitHubRepoSummary[]): Project[] {
  const flagship: FlagshipProject[] = [];
  const live: LiveProject[] = [];

  for (const repo of repos) {
    const override = FLAGSHIP_OVERRIDES[repo.name];
    const shared = {
      slug: slugify(repo.name),
      name: repo.name,
      htmlUrl: repo.htmlUrl,
      stargazersCount: repo.stargazersCount,
      updatedAt: repo.updatedAt,
      pushedAt: repo.pushedAt,
    };

    if (override) {
      flagship.push({ kind: "flagship", ...shared, ...override });
    } else {
      live.push({
        kind: "live",
        ...shared,
        description: repo.description,
        language: repo.language,
      });
    }
  }

  return [...flagship, ...live];
}
