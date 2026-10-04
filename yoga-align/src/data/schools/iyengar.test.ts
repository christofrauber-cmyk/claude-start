import { describe, it, expect } from 'vitest';
import { IYENGAR } from './iyengar';
import { POSES, CORE_POSE_IDS } from '../poses';
import { evaluatePose } from '../../core/engine';
import { isKnownRef, LANDMARK_INDEX } from '../../core/landmarks';
import type { FrameContext, PoseFrame, Rule } from '../../core/types';

const allRules: { poseId: string; rule: Rule }[] = Object.entries(IYENGAR.rules).flatMap(([poseId, rs]) =>
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

describe('IYENGAR rule set structure', () => {
  it('has rules for every pose', () => {
    for (const id of CORE_POSE_IDS) expect(IYENGAR.rules[id]?.length ?? 0, id).toBeGreaterThanOrEqual(3);
  });

  it('has no rules for unknown poses', () => {
    const ids = new Set(POSES.map((p) => p.id));
    for (const id of Object.keys(IYENGAR.rules)) expect(ids.has(id), id).toBe(true);
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
    const sided = new Map(POSES.map((p) => [p.id, p.sided]));
    for (const { poseId, rule } of allRules) {
      if (sided.get(poseId)) continue;
      for (const ref of refsOf(rule)) expect(/^(lead_|trail_)/.test(ref), `${rule.id}: ${ref}`).toBe(false);
    }
  });

  it('has cues, label, why and weight on every rule', () => {
    for (const { rule } of allRules) {
      expect(rule.label.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueBelow.length, rule.id).toBeGreaterThan(0);
      expect(rule.cueAbove.length, rule.id).toBeGreaterThan(0);
      expect(rule.why?.length ?? 0, rule.id).toBeGreaterThan(0);
      expect([1, 2, 3], rule.id).toContain(rule.weight);
    }
  });
});

// ---------- synthetic frames (pixel coordinates in a 1000x1000 image, y points down) ----------

function frame(points: Record<string, [number, number]>): PoseFrame {
  const f: PoseFrame = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  for (const [name, [x, y]] of Object.entries(points)) {
    const i = LANDMARK_INDEX[name];
    if (i === undefined) throw new Error(name);
    f[i] = { x: x / 1000, y: y / 1000, z: 0, visibility: 1 };
  }
  return f;
}

describe('IYENGAR sanity with synthetic ideal frames', () => {
  it('Tadasana front: no major findings', () => {
    const f = frame({
      nose: [500, 200], left_ear: [535, 190], right_ear: [465, 190],
      left_shoulder: [570, 300], right_shoulder: [430, 300],
      left_elbow: [575, 425], right_elbow: [425, 425], left_wrist: [575, 550], right_wrist: [425, 550],
      left_hip: [550, 550], right_hip: [450, 550], left_knee: [550, 750], right_knee: [450, 750],
      left_ankle: [550, 950], right_ankle: [450, 950],
    });
    const ctx: FrameContext = { width: 1000, height: 1000 };
    const results = evaluatePose(f, IYENGAR.rules.tadasana, 'front', ctx);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.status, r.rule.id).toBe('ok');
  });

  it('Tadasana side: no major findings', () => {
    const x = 500;
    const f = frame({
      nose: [x + 20, 200], left_ear: [x, 190], right_ear: [x, 190],
      left_shoulder: [x, 300], right_shoulder: [x, 300], left_hip: [x, 550], right_hip: [x, 550],
      left_knee: [x, 750], right_knee: [x, 750], left_ankle: [x, 950], right_ankle: [x, 950],
      left_wrist: [x, 550], right_wrist: [x, 550],
    });
    const ctx: FrameContext = { width: 1000, height: 1000, matFront: 'right' };
    const results = evaluatePose(f, IYENGAR.rules.tadasana, 'side', ctx);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.status, r.rule.id).not.toBe('major');
  });

  it('Warrior II (right) side: no major findings', () => {
    // Mat front is on the image right; right leg is the bent front leg.
    const f = frame({
      nose: [560, 200], left_ear: [500, 190], right_ear: [500, 190],
      left_shoulder: [460, 300], right_shoulder: [540, 300],
      left_elbow: [310, 300], right_elbow: [690, 300], left_wrist: [160, 300], right_wrist: [840, 300],
      left_hip: [470, 550], right_hip: [530, 550],
      right_knee: [780, 550], right_ankle: [780, 800],
      left_knee: [253.5, 675], left_ankle: [37, 800],
    });
    const ctx: FrameContext = { width: 1000, height: 1000, matFront: 'right', side: 'right' };
    const results = evaluatePose(f, IYENGAR.rules.virabhadrasana_2, 'side', ctx);
    expect(results.length).toBeGreaterThanOrEqual(5);
    for (const r of results) expect(r.status, r.rule.id).not.toBe('major');
    for (const r of results) expect(r.status, r.rule.id).not.toBe('unmeasurable');
  });

  it('Warrior II detects a collapsed front knee (knee angle too small)', () => {
    const f = frame({
      left_shoulder: [460, 300], right_shoulder: [540, 300], left_wrist: [160, 300], right_wrist: [840, 300],
      left_hip: [470, 550], right_hip: [530, 550],
      right_knee: [700, 650], right_ankle: [780, 800], // straighter than 90 deg
      left_knee: [253.5, 675], left_ankle: [37, 800],
    });
    const ctx: FrameContext = { width: 1000, height: 1000, matFront: 'right', side: 'right' };
    const res = evaluatePose(f, IYENGAR.rules.virabhadrasana_2, 'side', ctx);
    expect(res.find((r) => r.rule.id === 'virabhadrasana_2.front_knee_angle')?.status).toBe('major');
  });
});
