import { describe, it, expect } from 'vitest';
import { RULES_EXTRA_1 } from './iyengar-extra-1';
import { POSE_BY_ID } from '../poses';
import { isKnownRef } from '../../core/landmarks';
import type { Rule } from '../../core/types';

const IDS = [
  'parsvottanasana', 'prasarita_padottanasana', 'parivrtta_trikonasana', 'parivrtta_parsvakonasana', 'skandasana',
  'utthita_hasta_padangusthasana', 'garudasana', 'natarajasana', 'malasana', 'utkata_konasana',
  'viparita_virabhadrasana', 'urdhva_prasarita_eka_padasana', 'ardha_baddha_padmottanasana', 'parighasana',
  'padangusthasana', 'padahastasana', 'upavistha_konasana',
];

const all: { poseId: string; rule: Rule }[] = Object.entries(RULES_EXTRA_1).flatMap(([poseId, rs]) =>
  rs.map((rule) => ({ poseId, rule })),
);

function refsOf(rule: Rule): string[] {
  const m = rule.measure;
  switch (m.kind) {
    case 'angle': return [m.a, m.b, m.c];
    case 'tilt': return [m.from, m.to];
    case 'offset': {
      const refs = [m.a, m.b];
      if (m.toward && !['up', 'down', 'forward', 'backward'].includes(m.toward)) refs.push(m.toward);
      return refs;
    }
  }
}

describe('RULES_EXTRA_1 structure', () => {
  it('covers exactly my poses with at least 2 rules each', () => {
    expect(Object.keys(RULES_EXTRA_1).sort()).toEqual([...IDS].sort());
    for (const id of IDS) expect(RULES_EXTRA_1[id]?.length ?? 0, id).toBeGreaterThanOrEqual(2);
  });

  it('only refers to known poses', () => {
    for (const id of Object.keys(RULES_EXTRA_1)) expect(POSE_BY_ID[id], id).toBeDefined();
  });

  it('has unique rule ids prefixed with the pose id', () => {
    const seen = new Set<string>();
    for (const { poseId, rule } of all) {
      expect(seen.has(rule.id), rule.id).toBe(false);
      seen.add(rule.id);
      expect(rule.id.startsWith(poseId + '.'), rule.id).toBe(true);
    }
  });

  it('uses only valid joint refs', () => {
    for (const { rule } of all) for (const ref of refsOf(rule)) expect(isKnownRef(ref), `${rule.id}: ${ref}`).toBe(true);
  });

  it('has sane ranges', () => {
    for (const { rule } of all) {
      const [lo, hi] = rule.range;
      expect(lo <= hi, rule.id).toBe(true);
      if (rule.measure.kind === 'angle') { expect(lo).toBeGreaterThanOrEqual(0); expect(hi).toBeLessThanOrEqual(180); }
      if (rule.measure.kind === 'tilt') { expect(lo).toBeGreaterThanOrEqual(0); expect(hi).toBeLessThanOrEqual(90); }
    }
  });

  it('uses forward/backward only in side view', () => {
    for (const { rule } of all) {
      const m = rule.measure;
      if (m.kind === 'offset' && (m.toward === 'forward' || m.toward === 'backward')) expect(rule.view, rule.id).toBe('side');
    }
  });

  it('uses lead_/trail_ only in sided poses', () => {
    for (const { poseId, rule } of all) {
      if (POSE_BY_ID[poseId]?.sided) continue;
      for (const ref of refsOf(rule)) expect(/^(lead_|trail_)/.test(ref), `${rule.id}: ${ref}`).toBe(false);
    }
  });

  it('has label, cues, why and weight on every rule', () => {
    for (const { rule } of all) {
      expect(rule.label.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueBelow.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueAbove.length, rule.id).toBeGreaterThan(0);
      expect(rule.why?.length ?? 0, rule.id).toBeGreaterThan(0);
      expect([1, 2, 3], rule.id).toContain(rule.weight);
    }
  });
});
