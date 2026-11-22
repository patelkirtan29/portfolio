/** Deterministic teaching geometry; these are not patient cells or a fitted UMAP. */
export const CELL_COUNT = 10_000;
export const TEXTURE_SIZE = 100;
export const CLUSTER_COLORS: string[] = ['#83a999', '#c69863', '#9a86af', '#719da9', '#b47d88', '#aaa38a'];
export const CLUSTER_NAMES = ['Naive', 'Effector', 'Exhausted', 'Th1-like', 'Treg', 'Other CD4'];
export const MARKER_GENES = ['FOXP3', 'CCR7', 'CD8A', 'CD8B'];

type CellCloud = { raw: Float32Array; aligned: Float32Array; clusters: Uint8Array };
const centers = [
  [-2.1, 0.7, 0.15], [-0.6, -0.9, -0.2], [1.1, -0.65, 0.3],
  [2.1, 0.65, -0.15], [0.55, 1.05, 0.2], [-1.5, -0.55, -0.3],
] as const;
let cachedCloud: CellCloud | undefined;

function randomUnit(seed: number): number {
  let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0xc2b2ae35);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
}

function baseCloud(): CellCloud {
  if (cachedCloud) return cachedCloud;
  const raw = new Float32Array(CELL_COUNT * 3);
  const aligned = new Float32Array(CELL_COUNT * 3);
  const clusters = new Uint8Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    // Fixed assignment preserves cell identity during domain transitions.
    const cluster = Math.min(5, Math.floor(randomUnit(i * 11 + 1) * 6));
    clusters[i] = cluster;
    const center = centers[cluster]!;
    const angle = randomUnit(i * 11 + 2) * Math.PI * 2;
    const radius = Math.sqrt(randomUnit(i * 11 + 3));
    const x = center[0] + Math.cos(angle) * radius * 0.8;
    const y = center[1] + Math.sin(angle) * radius * 0.55;
    const z = center[2] + (randomUnit(i * 11 + 4) * 2 - 1) * 0.65;
    aligned.set([x, y, z], i * 3);
    const batch = i % 3 - 1;
    raw.set([
      x * 0.72 + batch * 1.4 + Math.sin(y * 2) * 0.3,
      y * 0.7 + batch * 0.75 + Math.cos(x) * 0.25,
      z * 0.75 + batch * 0.5,
    ], i * 3);
  }
  cachedCloud = { raw, aligned, clusters };
  return cachedCloud;
}

/** Copies protect cached simulation targets from renderer-owned buffers. */
export function createCellCloud(): CellCloud {
  const cloud = baseCloud();
  return { raw: cloud.raw.slice(), aligned: cloud.aligned.slice(), clusters: cloud.clusters.slice() };
}

export function clampCellIndex(index: number): number {
  return Number.isNaN(index) ? 0 : Math.max(0, Math.min(CELL_COUNT - 1, Math.floor(index)));
}

export function cellTarget(index: number, standardized: boolean): [number, number, number] {
  const cloud = baseCloud();
  const positions = standardized ? cloud.aligned : cloud.raw;
  const offset = clampCellIndex(index) * 3;
  return [positions[offset]!, positions[offset + 1]!, positions[offset + 2]!];
}

export function sliceToWorld(value: number): number {
  return (Number.isNaN(value) ? 0 : Math.max(0, Math.min(100, value))) * 0.08 - 4;
}

/** Relative marker illustrations, not measured attention or Integrated Gradients. */
export function markerWeights(index: number): { gene: string; weight: number }[] {
  const cell = clampCellIndex(index);
  const cluster = baseCloud().clusters[cell]!;
  const profiles = [
    [0.05, 0.72, 0.13, 0.1], [0.04, 0.08, 0.49, 0.39],
    [0.06, 0.09, 0.48, 0.37], [0.12, 0.22, 0.36, 0.3],
    [0.79, 0.11, 0.06, 0.04], [0.18, 0.38, 0.25, 0.19],
  ];
  const values = profiles[cluster]!.map((value, gene) => value * (0.9 + randomUnit(cell * 7 + gene) * 0.2));
  const total = values.reduce((sum, value) => sum + value, 0);
  return MARKER_GENES.map((gene, i) => ({ gene, weight: values[i]! / total })).sort((a, b) => b.weight - a.weight);
}

export function chooseSimulationMode(probe: { software: boolean; floatRenderable: boolean; halfFloatRenderable: boolean }): 'float-fbo' | 'half-float-fbo' | 'instanced-spring' {
  if (probe.software) return 'instanced-spring';
  if (probe.floatRenderable) return 'float-fbo';
  return probe.halfFloatRenderable ? 'half-float-fbo' : 'instanced-spring';
}

/** Readouts reported by the GWU Spring 2026 course project paper. */
export const PROVENANCE = [
  { accession: 'GSE108989', label: 'Held-Out Smart-seq2', metric: '0.896', evidence: 'Source test macro-F1 on expert-annotated colorectal T-cells. Reported course-paper result; not an independent replication.' },
  { accession: 'GSE126030', label: 'Pseudo-Labeled 10x', metric: '0.439', evidence: 'Cross-technology target macro-F1 evaluated against reclustering-derived pseudo-labels, not expert ground truth. Healthy tissue differs from source cancer tissue.' },
  { accession: 'GSE99254', label: 'Lung Held-Out', metric: '0.442', evidence: 'External Smart-seq2 lung cancer validation target, evaluated against ground-truth coarse labels. Label granularity differs from the six fine source states.' },
];

export const WALKTHROUGH = [
  { title: 'Start with the technology shift', text: 'These 10,000 synthetic cells illustrate how sequencing batches can obscure shared T-cell states. Their positions are teaching geometry, not a measured embedding. Move the slicing plane through the cloud and keep one cell selected to follow its identity as preprocessing changes.', slice: 30, standardized: false, selectedCell: 125 },
  { title: 'Recover a shared frame', text: 'Turn on standardization to bring illustrative batches into a shared frame. The paper reports a +0.018 macro-F1 gain for the preprocessing bundle of independent target standardization and Fano-factor gene selection, compared with +0.013 for architectural changes. This animation does not reproduce that ablation.', slice: 58, standardized: true, selectedCell: 125 },
  { title: 'Inspect a marker signature', text: 'Select a cell to compare four illustrative marker weights. FOXP3 supports Treg identity, CCR7 supports Naive identity, and CD8A/CD8B support CD8 lineage. The paper studies attention and Integrated Gradients separately; these normalized bars are neither measured attention nor actual per-cell attribution.', slice: 65, standardized: true, selectedCell: 483 },
  { title: 'Read the evaluation boundaries', text: 'The source held-out score is 0.896; cross-technology transfer reaches 0.439 against pseudo-labels. Lung validation reaches 0.442 against coarse labels. Different technologies, tissues, and label schemes constrain comparison. This GWU course project demonstrates a transfer gap, and does not establish clinical performance.', slice: 90, standardized: true, selectedCell: 483 },
];

export const FIGURE_SLOTS: { id: string; title: string; description: string; src?: string }[] = [
  { id: 'original-umap', title: 'Original UMAP', description: 'Reserved for an exported, provenance-checked UMAP from the original experiment. The interactive cloud is synthetic teaching geometry.' },
  { id: 'original-attention', title: 'Original attention and attribution', description: 'Reserved for original gene-attention and Integrated Gradients heatmaps with labels and source captions. Illustrative marker bars are not paper measurements.' },
];
