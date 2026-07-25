// PLACEHOLDER PROJECT DATA
// Every project below is fictional placeholder content standing in for a
// real case study. Replace name/oneLiner/stack/humanStory/humanOutcome/
// approach/outcome/diff with real project details before this site ships.

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

export type Project = {
  slug: string;
  name: string;
  /** Technical face: one-line problem statement. */
  oneLiner: string;
  stack: string[];
  /** Human-story face: why it mattered, what was learned. */
  humanStory: string;
  /** Plain-English human-outcome line, shown before any technical detail. */
  humanOutcome: string;
  approach: string;
  outcome: string;
  /** Flagship projects get the before/after diff reveal on their detail page. */
  flagship?: boolean;
  diff?: ProjectDiff;
};

export const projects: Project[] = [
  {
    slug: "realtime-ops-dashboard",
    name: "Realtime Ops Dashboard (placeholder)",
    oneLiner: "Internal dashboard polled every 5s and buckled under load during incidents.",
    stack: ["TypeScript", "WebSockets", "Redis", "React"],
    humanStory:
      "On-call engineers were opening the dashboard during live incidents — the exact moment it needed to be fastest — and instead it lagged and dropped connections. Fixing this wasn't about a benchmark, it was about not making a 3am outage worse.",
    humanOutcome:
      "On-call engineers stopped losing thirty seconds of trust in the dashboard every time an incident actually happened.",
    approach:
      "Replaced the 5-second polling loop with a push-based WebSocket channel backed by a Redis pub/sub fan-out, so every connected client gets state changes the moment they happen instead of on the next poll tick.",
    outcome:
      "Median time-to-first-signal during an incident dropped from ~4s to ~180ms, and the dashboard held steady through a 10x traffic spike during a real outage.",
    flagship: true,
    diff: {
      caption:
        "Before: every client hammered the API on a fixed interval. After: the server pushes only when state actually changes.",
      before: [
        { type: "context", text: "function useOpsStatus() {" },
        { type: "remove", text: "  const [status, setStatus] = useState(null);" },
        { type: "remove", text: "  useEffect(() => {" },
        { type: "remove", text: "    const id = setInterval(() => {" },
        { type: "remove", text: "      fetch('/api/status').then(r => r.json()).then(setStatus);" },
        { type: "remove", text: "    }, 5000);" },
        { type: "remove", text: "    return () => clearInterval(id);" },
        { type: "remove", text: "  }, []);" },
        { type: "context", text: "  return status;" },
        { type: "context", text: "}" },
      ],
      after: [
        { type: "context", text: "function useOpsStatus() {" },
        { type: "add", text: "  const [status, setStatus] = useState(null);" },
        { type: "add", text: "  useEffect(() => {" },
        { type: "add", text: "    const socket = subscribe('ops:status', setStatus);" },
        { type: "add", text: "    return () => socket.close();" },
        { type: "add", text: "  }, []);" },
        { type: "context", text: "  return status;" },
        { type: "context", text: "}" },
      ],
    },
  },
  {
    slug: "cli-deploy-tool",
    name: "CLI Deploy Tool (placeholder)",
    oneLiner: "Deploys were a 12-step manual checklist copy-pasted between engineers.",
    stack: ["Go", "GitHub Actions", "Bash"],
    humanStory:
      "New team members were afraid to deploy because one wrong step in the checklist could take down staging. Turning the checklist into a single command wasn't just convenience — it was removing a source of quiet dread from people's week.",
    humanOutcome:
      "The newest engineer on the team shipped their first production deploy solo, on day two, without asking anyone for help.",
    approach:
      "Wrote a small Go CLI that encodes the checklist as an ordered, resumable pipeline with dry-run and rollback built in, then wired it into CI so the same binary runs locally and in Actions.",
    outcome:
      "Deploy time dropped from ~25 minutes of manual steps to under 3 minutes, and rollback went from 'page the one person who remembers how' to a single flag.",
    flagship: true,
    diff: {
      caption:
        "Before: a checklist comment pasted into Slack before every deploy. After: one command that does the same steps, in order, every time.",
      before: [
        { type: "remove", text: "# Deploy checklist (paste into #deploys before shipping)" },
        { type: "remove", text: "# 1. ssh into build box" },
        { type: "remove", text: "# 2. git pull && git tag vX.Y.Z" },
        { type: "remove", text: "# 3. run build.sh, watch for errors" },
        { type: "remove", text: "# 4. scp artifact to each of 4 servers" },
        { type: "remove", text: "# 5. ssh into each server, restart service" },
        { type: "remove", text: "# 6. manually curl /health on each one" },
      ],
      after: [
        { type: "add", text: "$ deploy release vX.Y.Z" },
        { type: "add", text: "  ✓ tagged vX.Y.Z" },
        { type: "add", text: "  ✓ build passed" },
        { type: "add", text: "  ✓ shipped to 4/4 servers" },
        { type: "add", text: "  ✓ health checks passed 4/4" },
        { type: "add", text: "  done in 2m41s — rollback with: deploy rollback vX.Y.Z" },
      ],
    },
  },
  {
    slug: "recipe-sharing-app",
    name: "Recipe Sharing App (placeholder)",
    oneLiner: "A small side project for a family group chat that kept losing recipes in scrollback.",
    stack: ["Next.js", "SQLite", "Tailwind CSS"],
    humanStory:
      "Recipes were living and dying in a group chat's infinite scroll — a grandmother's dish would surface once and then vanish for a year. Building a durable, searchable home for them mattered more to the family than any technical choice inside it.",
    humanOutcome:
      "A recipe that used to take ten minutes of scrolling to find now takes one search, and nobody has re-typed a lost recipe from memory since.",
    approach:
      "Built a minimal Next.js app backed by SQLite with full-text search over titles and ingredients, and a low-friction 'paste from chat' import flow so old messages could be migrated in one sitting.",
    outcome:
      "Every recipe from three years of group-chat history got migrated in an afternoon, and the family now adds new ones directly instead of dropping them back into chat.",
  },
  {
    slug: "data-pipeline-monitor",
    name: "Data Pipeline Monitor (placeholder)",
    oneLiner: "Nightly ETL failures were discovered by analysts opening stale dashboards the next morning.",
    stack: ["Python", "Airflow", "Postgres"],
    humanStory:
      "The analytics team's trust in the data eroded every time a silent pipeline failure meant a whole day of numbers was just wrong, and nobody found out until someone asked an awkward question in a meeting.",
    humanOutcome:
      "Analysts stopped finding out about bad data in a meeting, and started finding out from a Slack message the night before.",
    approach:
      "Added per-task success/failure webhooks into the existing Airflow DAGs and a lightweight monitor that diffs row counts against a trailing baseline, alerting on both hard failures and silent anomalies.",
    outcome:
      "Mean time-to-detection for a broken pipeline went from 'whenever someone notices' (often 12+ hours) to under 10 minutes.",
  },
  {
    slug: "component-library",
    name: "Internal Component Library (placeholder)",
    oneLiner: "Four product teams had four slightly different buttons, and nobody agreed on which was correct.",
    stack: ["React", "Storybook", "TypeScript"],
    humanStory:
      "Design and engineering kept relitigating the same small decisions — spacing, color, focus states — on every project, which was tiring in a way that had nothing to do with the actual product work everyone wanted to be doing.",
    humanOutcome:
      "Designers and engineers stopped arguing about button padding and started spending that time on the actual feature.",
    approach:
      "Audited existing components across all four teams, consolidated them into a single documented library with accessible defaults baked in, and shipped a codemod to migrate existing usages automatically.",
    outcome:
      "Three of four teams migrated within a month with zero manual edits, and new features now ship with consistent, accessible components by default.",
  },
];
