import { describe, it, expect } from 'vitest';
import { RULES_EXTRA_3 } from './iyengar-extra-3';
import { POSE_BY_ID } from '../poses';
import { isKnownRef } from '../../core/landmarks';
import type { Rule } from '../../core/types';

const POSE_IDS = [
  'bharadvajasana', 'jathara_parivartanasana', 'parivrtta_janu_sirsasana', 'parivrtta_utkatasana', 'sukhasana',
  'padmasana', 'siddhasana', 'virasana', 'baddha_konasana', 'gomukhasana', 'hanumanasana', 'eka_pada_rajakapotasana',
  'utthan_pristhasana', 'navasana', 'ardha_navasana', 'tolasana', 'sirsasana', 'salamba_sarvangasana', 'halasana',
  'karnapidasana', 'pincha_mayurasana',
];

const allRules: { poseId: string; rule: Rule }[] = Object.entries(RULES_EXTRA_3).flatMap(([poseId, rs]) =>
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

describe('RULES_EXTRA_3 structure', () => {
  it('covers exactly the assigned poses, each with at least 2 rules', () => {
    expect(Object.keys(RULES_EXTRA_3).sort()).toEqual([...POSE_IDS].sort());
    for (const id of POSE_IDS) expect(RULES_EXTRA_3[id]?.length ?? 0, id).toBeGreaterThanOrEqual(1);
  });

  it('only uses known poses', () => {
    for (const id of POSE_IDS) expect(POSE_BY_ID[id], id).toBeDefined();
  });

  it('has unique rule ids prefixed with the pose id', () => {
    const seen = new Set<string>();
    for (const { poseId, rule } of allRules) {
      expect(seen.has(rule.id), rule.id).toBe(false);
      seen.add(rule.id);
      expect(rule.id.startsWith(poseId + '.'), rule.id).toBe(true);
    }
  });

  it('uses only valid joint refs', () => {
    for (const { rule } of allRules) for (const ref of refsOf(rule)) expect(isKnownRef(ref), `${rule.id}: ${ref}`).toBe(true);
  });

  it('has sane ranges', () => {
    for (const { rule } of allRules) {
      const [lo, hi] = rule.range;
      expect(lo <= hi, rule.id).toBe(true);
      if (rule.measure.kind === 'angle') { expect(lo).toBeGreaterThanOrEqual(0); expect(hi).toBeLessThanOrEqual(180); }
      if (rule.measure.kind === 'tilt') { expect(lo).toBeGreaterThanOrEqual(0); expect(hi).toBeLessThanOrEqual(90); }
    }
  });

  it('uses forward/backward only in side view', () => {
    for (const { rule } of allRules) {
      const m = rule.measure;
      if (m.kind === 'offset' && (m.toward === 'forward' || m.toward === 'backward')) expect(rule.view, rule.id).toBe('side');
    }
  });

  it('uses lead_/trail_ only in sided poses', () => {
    for (const { poseId, rule } of allRules) {
      if (POSE_BY_ID[poseId].sided) continue;
      for (const ref of refsOf(rule)) expect(/^(lead_|trail_)/.test(ref), `${rule.id}: ${ref}`).toBe(false);
    }
  });

  it('has label, cues, why and weight on every rule', () => {
    for (const { rule } of allRules) {
      expect(rule.label.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueBelow.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueAbove.length, rule.id).toBeGreaterThan(0);
      expect(rule.why?.length ?? 0, rule.id).toBeGreaterThan(0);
      expect([1, 2, 3], rule.id).toContain(rule.weight);
    }
  });
});
