// Shape-selection logic for the Work grid's 3D "toy" trinkets.
//
// Each project gets a small, legible metaphor for its subject rather than an
// abstract shiny bauble (spectacle_ideas_canva.md item #2). Since `projects.ts`
// mixes curated "flagship" case studies with plain live GitHub data, this
// looks at whatever signal is actually available on each shape of project —
// name, description, language, and (for flagship only) stack/story text —
// and falls back to a generic faceted crystal when nothing matches.
import type { Project } from "./projects";

export type TrinketShape = "globe" | "gear" | "rocket" | "books" | "crystal";

// Ops/deploy signals checked first — these are usually unambiguous
// (docker, ci, infra) and would otherwise get swallowed by broader
// "tool" or "data" keyword matches.
const DEPLOY_KEYWORDS = [
  "deploy",
  "docker",
  "kubernetes",
  "k8s",
  "ci/cd",
  " ci ",
  "cicd",
  "pipeline",
  "infra",
  "ops",
  "cloud",
  "terraform",
  "aws",
  "gcp",
  "server",
];

// Library/documentation signals — packages, SDKs, docs, notes, book-like
// collections of written material.
const LIBRARY_KEYWORDS = [
  "library",
  " lib",
  "lib-",
  "docs",
  "documentation",
  "book",
  "notes",
  "sdk",
  "framework",
  "package",
  "readme",
];

// Tooling/utility signals — CLIs, scripts, generators, dev tooling.
const TOOL_KEYWORDS = [
  "tool",
  "cli",
  "util",
  "script",
  "automation",
  "generator",
  "bot",
  "extension",
  "plugin",
];

// Data/science signals — the strongest fit for a little globe: datasets,
// models, analysis, research. Also catches this portfolio's two real
// flagship repos (NNDL-Immunonet, VOCD_FAERS) via substring match on
// "immuno" / "faers" without hardcoding repo names directly.
const DATA_KEYWORDS = [
  "data",
  "dataset",
  "neural",
  "immuno",
  "faers",
  "machine learning",
  " ml ",
  "model",
  "analysis",
  "analytics",
  "network",
  " ai ",
  "science",
  "bio",
  "predict",
  "classif",
];

const DATA_LANGUAGES = new Set(["python", "jupyter notebook", "r"]);

function projectText(project: Project): string {
  const parts: string[] = [project.name];

  if (project.kind === "flagship") {
    parts.push(project.oneLiner, project.humanStory, project.approach, project.outcome, ...project.stack);
  } else {
    if (project.description) parts.push(project.description);
    if (project.language) parts.push(project.language);
  }

  // Pad with spaces so single-word keyword checks like " ai " or " ml "
  // can match at the start/end of the joined string too.
  return ` ${parts.join(" ").toLowerCase()} `;
}

function matchesAny(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

/** Pick a reasonable trinket shape for a project based on its stack/description. */
export function pickTrinketShape(project: Project): TrinketShape {
  const text = projectText(project);
  const primaryLanguage = (project.kind === "live" ? project.language : project.stack[0])?.toLowerCase();

  if (matchesAny(text, DEPLOY_KEYWORDS)) return "rocket";
  if (matchesAny(text, LIBRARY_KEYWORDS)) return "books";
  if (matchesAny(text, TOOL_KEYWORDS)) return "gear";
  if (matchesAny(text, DATA_KEYWORDS) || (primaryLanguage && DATA_LANGUAGES.has(primaryLanguage))) {
    return "globe";
  }

  return "crystal";
}
