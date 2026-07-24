// Dashboard color-by-series for the Gallery's Command Center.
// Values are locked exactly per FINAL_CREATIVE_DIRECTION.md section 3
// ("Dashboard color-by-series") — do not invent new colors here.

/** Commit-recency magnitude ramp, least → most recent. */
export const MAGNITUDE_RAMP = [
  "#1B2333",
  "#26314A",
  "#3B4A6B",
  "#5C7080",
  "#8FA3B0",
] as const;

/** The single most-recent cell is allowed to break the ramp with the accent. */
export const MAGNITUDE_HIGHLIGHT = "var(--accent-primary)";

/** Language identity — fixed, never re-cycled. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#5B7FA6",
  JavaScript: "#D9B14C",
  Python: "#6FA688",
  CSS: "#8F6FA6",
  "Three.js": "#8F6FA6",
  HTML: "#8F6FA6",
};

export const LANGUAGE_OTHER_COLOR = "#8FA3B0";

export function colorForLanguage(language: string | null | undefined): string {
  if (!language) return LANGUAGE_OTHER_COLOR;
  return LANGUAGE_COLORS[language] ?? LANGUAGE_OTHER_COLOR;
}

/** Status — always paired with an icon/label, never color alone. */
export const STATUS_COLORS = {
  shipped: "#4FAE73",
  building: "#DF6C4F",
  idle: "#5C6B7A",
} as const;

export type RepoStatus = keyof typeof STATUS_COLORS;

/**
 * Heuristic status derivation from `pushedAt` recency — this repo data has no
 * explicit "shipped/building" field, so we infer a status band from how
 * recently it was pushed to. Tuned for a solo dev's typical push cadence.
 */
export function statusForPushedAt(pushedAt: string, now: number): RepoStatus {
  const ageDays = (now - Date.parse(pushedAt)) / (1000 * 60 * 60 * 24);
  if (ageDays <= 3) return "building";
  if (ageDays <= 30) return "shipped";
  return "idle";
}

export const STATUS_LABELS: Record<RepoStatus, string> = {
  shipped: "Shipped",
  building: "Building",
  idle: "Idle",
};
