import { getPoint, MIN_VISIBILITY } from './landmarks';
import type { FrameContext, Measure, PoseFrame, Pt, Rule, RuleResult, Status, View, Visual } from './types';

const DEG = 180 / Math.PI;

interface V { x: number; y: number }

const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const len = (v: V) => Math.hypot(v.x, v.y);
const sgn = (n: number) => (n < 0 ? -1 : 1);

/** Pixel space ↔ normalized space. Angles must be measured in pixels. */
const toPx = (p: Pt, c: FrameContext): V => ({ x: p.x * c.width, y: p.y * c.height });
const toNorm = (v: V, c: FrameContext): Pt => ({ x: v.x / c.width, y: v.y / c.height });

export const defaultMargin = (m: Measure) => (m.kind === 'offset' ? 0.08 : 8);

export function measureRefs(m: Measure): string[] {
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

function clamp(v: number, [lo, hi]: [number, number]) {
  return Math.min(hi, Math.max(lo, v));
}

interface Computed { value: number; visual: (ideal: number) => Visual }

function compute(m: Measure, ctx: FrameContext, pt: (ref: string) => V): Computed | null {
  switch (m.kind) {
    case 'angle': {
      const a = pt(m.a), b = pt(m.b), c = pt(m.c);
      const u = sub(a, b), v = sub(c, b);
      if (len(u) === 0 || len(v) === 0) return null;
      const signed = Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y);
      const value = Math.abs(signed) * DEG;
      return {
        value,
        visual: (ideal) => {
          // Rotate b→a by the ideal angle toward the side c is on, keep |b→c|.
          const ua = { x: u.x / len(u), y: u.y / len(u) };
          const th = sgn(signed) * ideal / DEG;
          const dir = { x: ua.x * Math.cos(th) - ua.y * Math.sin(th), y: ua.x * Math.sin(th) + ua.y * Math.cos(th) };
          const idealC = { x: b.x + dir.x * len(v), y: b.y + dir.y * len(v) };
          return { type: 'angle', a: toNorm(a, ctx), b: toNorm(b, ctx), c: toNorm(c, ctx), idealC: toNorm(idealC, ctx), value };
        },
      };
    }
    case 'tilt': {
      const from = pt(m.from), to = pt(m.to);
      const v = sub(to, from);
      const L = len(v);
      if (L === 0) return null;
      const vertical = m.axis === 'vertical';
      const value = (vertical ? Math.atan2(Math.abs(v.x), Math.abs(v.y)) : Math.atan2(Math.abs(v.y), Math.abs(v.x))) * DEG;
      return {
        value,
        visual: (ideal) => {
          const th = ideal / DEG;
          const sx = sgn(v.x), sy = sgn(v.y);
          const d = vertical ? { x: sx * Math.sin(th), y: sy * Math.cos(th) } : { x: sx * Math.cos(th), y: sy * Math.sin(th) };
          const idealTo = { x: from.x + d.x * L, y: from.y + d.y * L };
          return { type: 'segment', from: toNorm(from, ctx), to: toNorm(to, ctx), idealTo: toNorm(idealTo, ctx), value };
        },
      };
    }
    case 'offset': {
      const a = pt(m.a), b = pt(m.b);
      const torso = len(sub(pt('mid_shoulder'), pt('mid_hip')));
      if (torso === 0) return null;
      const axis = m.axis;
      const d = a[axis] - b[axis];
      let dirSign: number;
      const toward = m.toward ?? (axis === 'y' ? 'up' : undefined);
      if (toward === 'up') dirSign = -1;
      else if (toward === 'down') dirSign = 1;
      else if (toward === 'forward' || toward === 'backward') {
        if (!ctx.matFront) return null;
        dirSign = (ctx.matFront === 'left' ? -1 : 1) * (toward === 'forward' ? 1 : -1);
      } else if (toward) dirSign = sgn(pt(toward)[axis] - b[axis]);
      else dirSign = 1;
      const signedValue = (d * dirSign) / torso;
      const value = m.abs ? Math.abs(signedValue) : signedValue;
      return {
        value,
        visual: (ideal) => {
          // Move a along the axis so that the measured value becomes `ideal`.
          const idealSigned = m.abs ? ideal * sgn(signedValue) : ideal;
          const shift = (idealSigned - signedValue) * torso * dirSign;
          const idealA = { ...a, [axis]: a[axis] + shift };
          return { type: 'offset', a: toNorm(a, ctx), b: toNorm(b, ctx), idealA: toNorm(idealA, ctx), value };
        },
      };
    }
  }
}

export function evaluateRule(frame: PoseFrame, rule: Rule, ctx: FrameContext): RuleResult {
  const refs = [...measureRefs(rule.measure), ...(rule.measure.kind === 'offset' ? ['mid_shoulder', 'mid_hip'] : [])];
  const pts = new Map<string, V>();
  for (const ref of refs) {
    const r = getPoint(frame, ref, ctx);
    if (!r || r.visibility < MIN_VISIBILITY) return { rule, status: 'unmeasurable' };
    pts.set(ref, toPx(r.p, ctx));
  }
  const computed = compute(rule.measure, ctx, (ref) => pts.get(ref)!);
  if (!computed) return { rule, status: 'unmeasurable' };

  const { value } = computed;
  const [lo, hi] = rule.range;
  const deviation = value < lo ? lo - value : value > hi ? value - hi : 0;
  const margin = rule.margin ?? defaultMargin(rule.measure);
  const status: Status = deviation === 0 ? 'ok' : deviation <= margin ? 'minor' : 'major';
  const cue = status === 'ok' ? undefined : value < lo ? rule.cueBelow : rule.cueAbove;
  return { rule, status, value, deviation, cue, visual: computed.visual(clamp(value, rule.range)) };
}

const STATUS_ORDER: Record<Status, number> = { major: 0, minor: 1, ok: 2, unmeasurable: 3 };

/** Evaluates all rules for one view, most important problems first. */
export function evaluatePose(frame: PoseFrame, rules: Rule[], view: View, ctx: FrameContext): RuleResult[] {
  return rules
    .filter((r) => r.view === view)
    .map((r) => evaluateRule(frame, r, ctx))
    .sort((x, y) => STATUS_ORDER[x.status] - STATUS_ORDER[y.status] || (y.rule.weight ?? 2) - (x.rule.weight ?? 2) || (y.deviation ?? 0) - (x.deviation ?? 0));
}

/** 0..100: share of measurable rules that are fine, weighted; minor counts half. */
export function poseScore(results: RuleResult[]): number | null {
  let total = 0, got = 0;
  for (const r of results) {
    if (r.status === 'unmeasurable') continue;
    const w = r.rule.weight ?? 2;
    total += w;
    got += r.status === 'ok' ? w : r.status === 'minor' ? w / 2 : 0;
  }
  return total === 0 ? null : Math.round((got / total) * 100);
}

/** Per-landmark median over several frames: robust against jitter while holding a pose. */
export function medianFrame(frames: PoseFrame[]): PoseFrame {
  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return frames[0].map((_, i) => ({
    x: med(frames.map((f) => f[i].x)),
    y: med(frames.map((f) => f[i].y)),
    z: med(frames.map((f) => f[i].z)),
    visibility: med(frames.map((f) => f[i].visibility)),
  }));
}
