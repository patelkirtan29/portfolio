import { describe, expect, it } from 'vitest';
import { CELL_COUNT, TEXTURE_SIZE, createCellCloud, cellTarget, clampCellIndex, sliceToWorld, markerWeights, chooseSimulationMode } from './immunoModel';

describe('ImmunoNet illustrative cell model', () => {
  it('reproduces the same cells without exposing its cached targets to mutation', () => {
    const first = createCellCloud();
    const second = createCellCloud();
    expect(CELL_COUNT).toBe(TEXTURE_SIZE * TEXTURE_SIZE);
    expect(first.raw.length).toBe(30000);
    expect(first.aligned).toEqual(second.aligned);
    expect(first.raw).toEqual(second.raw);
    expect(first.clusters).toEqual(second.clusters);
    first.raw.fill(99); first.aligned.fill(99); first.clusters.fill(99);
    expect(createCellCloud()).toEqual(second);
  });

  it('keeps every target finite and in the interactive world, with distinct raw and aligned states', () => {
    const cloud = createCellCloud();
    const seen = new Set<number>();
    let displaced = 0;
    for (let i = 0; i < CELL_COUNT; i++) {
      seen.add(cloud.clusters[i]!);
      for (let axis = 0; axis < 3; axis++) {
        const aligned = cloud.aligned[i * 3 + axis]!;
        const raw = cloud.raw[i * 3 + axis]!;
        expect(Number.isFinite(aligned) && Number.isFinite(raw)).toBe(true);
        expect(Math.abs(aligned)).toBeLessThanOrEqual([3.5, 2, 1.4][axis]!);
        expect(Math.abs(raw)).toBeLessThanOrEqual([4.5, 2.8, 1.8][axis]!);
        if (raw !== aligned) displaced++;
      }
    }
    expect(seen).toEqual(new Set([0, 1, 2, 3, 4, 5]));
    expect(displaced).toBeGreaterThan(25000);
    for (const i of [0, 125, 9999]) {
      expect(cellTarget(i, true)).toEqual(Array.from(cloud.aligned.slice(i * 3, i * 3 + 3)));
      expect(cellTarget(i, false)).toEqual(Array.from(cloud.raw.slice(i * 3, i * 3 + 3)));
    }
  });

  it.each([[-4, 0], [NaN, 0], [-Infinity, 0], [Infinity, 9999], [10000, 9999], [42.9, 42]])('clamps cell index %s to %s', (input, expected) => {
    expect(clampCellIndex(input)).toBe(expected);
    expect(cellTarget(input, true)).toEqual(cellTarget(expected, true));
  });

  it.each([[-1, -4], [0, -4], [50, 0], [100, 4], [101, 4], [NaN, -4]])('maps slice %s into world coordinate %s', (input, expected) => {
    expect(sliceToWorld(input)).toBe(expected);
  });

  it('returns four normalized, descending marker illustrations with state-specific ranking', () => {
    const signatures = new Set<string>();
    for (let i = 0; i < CELL_COUNT; i += 137) {
      const weights = markerWeights(i);
      expect(weights.map(item => item.gene).sort()).toEqual(['CD8A', 'CD8B', 'CCR7', 'FOXP3'].sort());
      expect(weights.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1, 12);
      expect(weights.every((item, index) => item.weight > 0 && (!index || weights[index - 1]!.weight >= item.weight))).toBe(true);
      signatures.add(weights[0]!.gene);
    }
    expect(signatures).toEqual(new Set(['CCR7', 'CD8A', 'FOXP3']));
    expect(markerWeights(-10)).toEqual(markerWeights(0));
  });

  it.each([
    [{ software: false, floatRenderable: true, halfFloatRenderable: true }, 'float-fbo'],
    [{ software: false, floatRenderable: false, halfFloatRenderable: true }, 'half-float-fbo'],
    [{ software: false, floatRenderable: false, halfFloatRenderable: false }, 'instanced-spring'],
    [{ software: true, floatRenderable: true, halfFloatRenderable: true }, 'instanced-spring'],
  ] as const)('selects a supported simulation path for %j', (probe, expected) => {
    expect(chooseSimulationMode(probe)).toBe(expected);
  });
});
