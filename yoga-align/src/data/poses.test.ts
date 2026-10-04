import { describe, it, expect } from 'vitest';
import { POSES, POSE_BY_ID, CORE_POSE_IDS } from './poses';

const norm = (s: string) => s.toLowerCase().trim();

describe('POSES catalogue', () => {
  it('has exactly 100 poses with unique ids, core poses first', () => {
    expect(POSES.length).toBe(100);
    expect(new Set(POSES.map((p) => p.id)).size).toBe(100);
    expect(CORE_POSE_IDS.length).toBe(21);
    expect(POSES.slice(0, 21).map((p) => p.id)).toEqual(CORE_POSE_IDS);
    expect(Object.keys(POSE_BY_ID).length).toBe(100);
  });

  it('has complete metadata', () => {
    for (const p of POSES) {
      expect(p.nameDe, p.id).toBeTruthy();
      expect(p.nameEn, p.id).toBeTruthy();
      expect(p.sanskrit, p.id).toBeTruthy();
      expect(p.bestViews.length, p.id).toBeGreaterThan(0);
      expect((p.aliases ?? []).length, p.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('has no ambiguous aliases or names', () => {
    const owner = new Map<string, string>();
    const claim = (key: string, id: string, what: string) => {
      const k = norm(key);
      const prev = owner.get(k);
      expect(prev === undefined || prev === id, `${what} "${k}" of ${id} also belongs to ${prev}`).toBe(true);
      owner.set(k, id);
    };
    for (const p of POSES) {
      claim(p.sanskrit, p.id, 'sanskrit');
      claim(p.nameDe, p.id, 'nameDe');
      claim(p.nameEn, p.id, 'nameEn');
      for (const a of p.aliases ?? []) claim(a, p.id, 'alias');
    }
  });

  it('uses sideCue only on sided poses', () => {
    for (const p of POSES) if (p.sideCue) expect(p.sided, p.id).toBe(true);
  });

  it('has valid shape ranges', () => {
    for (const p of POSES) for (const [k, r] of Object.entries(p.shape ?? {})) expect(r![0] <= r![1], `${p.id}.${k}`).toBe(true);
  });
});
