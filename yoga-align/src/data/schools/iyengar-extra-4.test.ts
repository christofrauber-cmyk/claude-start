import { describe, it, expect } from 'vitest';
import { RULES_EXTRA_4 } from './iyengar-extra-4';
import { POSE_BY_ID } from '../poses';
import { isKnownRef } from '../../core/landmarks';
import type { Rule } from '../../core/types';

const POSE_IDS = [
  'adho_mukha_vrksasana', 'ardha_pincha_mayurasana', 'viparita_karani', 'bakasana', 'parsva_bakasana',
  'tittibhasana', 'astavakrasana', 'eka_pada_koundinyasana', 'vasisthasana', 'phalakasana', 'lolasana',
  'mayurasana', 'savasana', 'apanasana', 'supta_baddha_konasana', 'supta_padangusthasana', 'ananda_balasana',
  'supta_virasana', 'anantasana', 'urdhva_prasarita_padasana',
];

const all: { poseId: string; rule: Rule }[] = Object.entries(RULES_EXTRA_4).flatMap(([poseId, rs]) =>
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

describe('RULES_EXTRA_4', () => {
  it('covers exactly the assigned poses with at least 1 rule each', () => {
    expect(Object.keys(RULES_EXTRA_4).sort()).toEqual([...POSE_IDS].sort());
    for (const id of POSE_IDS) {
      expect(POSE_BY_ID[id], id).toBeTruthy();
      expect(RULES_EXTRA_4[id]?.length ?? 0, id).toBeGreaterThanOrEqual(1);
    }
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
      if (refsOf(rule).some((r) => r.startsWith('lead_') || r.startsWith('trail_'))) {
        const pose = POSE_BY_ID[poseId];
        expect(pose?.sided, rule.id).toBe(true);
      }
    }
  });

  it('has label, cues, why and weight on every rule', () => {
    for (const { rule } of all) {
      expect(rule.label, rule.id).toBeTruthy();
      expect(rule.cueBelow, rule.id).toBeTruthy();
      expect(rule.cueAbove, rule.id).toBeTruthy();
      expect(rule.why, rule.id).toBeTruthy();
      expect([1, 2, 3], rule.id).toContain(rule.weight);
    }
  });
});
