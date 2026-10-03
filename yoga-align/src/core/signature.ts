import { getPoint, LANDMARK_INDEX, MIN_VISIBILITY } from './landmarks';
import type { FrameContext, PoseFrame } from './types';

/**
 * Coarse, camera-independent shape of a pose, built only from heights
 * (image y), which every horizontal camera sees. Used to recognise which
 * pose a hold shows, not to judge alignment.
 */
export interface ShapeFeatures {
  /** (shoulder y − hip y) / body size: < 0 shoulders above hips, > 0 below. */
  trunkDrop: number;
  /** (ankle y − hip y) / body size: ≈0.5 standing, ≈0 sitting. */
  hipHeight: number;
  /** (nose y − wrist y) / body size: > 0 hands above the head. */
  armsUp: number;
  /** |left ankle y − right ankle y| / body size. */
  footLift: number;
  /** (ankle y − wrist y) / body size: ≈0 hands at foot level. */
  handHeight: number;
}

const KEY = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_wrist', 'right_wrist', 'nose'];

export function shapeFeatures(frame: PoseFrame, ctx: FrameContext): ShapeFeatures | null {
  const aspect = ctx.width / ctx.height;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const k of KEY) {
    const l = frame[LANDMARK_INDEX[k]];
    if (!l || l.visibility < MIN_VISIBILITY) continue;
    minX = Math.min(minX, l.x * aspect); maxX = Math.max(maxX, l.x * aspect);
    minY = Math.min(minY, l.y); maxY = Math.max(maxY, l.y);
  }
  const size = Math.max(maxX - minX, maxY - minY);
  // Heights are taken even from low-visibility points: MediaPipe still
  // places hidden joints plausibly, and a coarse shape is all we need here.
  const y = (ref: string) => getPoint(frame, ref, ctx)?.p.y;
  const ys = ['mid_shoulder', 'mid_hip', 'mid_ankle', 'nose', 'mid_wrist', 'left_ankle', 'right_ankle'].map(y);
  if (!(size > 0) || ys.some((v) => v === undefined)) return null;
  const [sh, hip, ank, nose, wr, la, ra] = ys as number[];
  return {
    trunkDrop: (sh - hip) / size,
    hipHeight: (ank - hip) / size,
    armsUp: (nose - wr) / size,
    footLift: Math.abs(la - ra) / size,
    handHeight: (ank - wr) / size,
  };
}

/** Expected ranges per feature; a pose lists only the features that define it. */
export type ShapeSignature = Partial<Record<keyof ShapeFeatures, [number, number]>>;

/** 0..1: share of the signature's features inside their range (soft edges). */
export function shapeFit(f: ShapeFeatures, sig: ShapeSignature): number {
  const keys = Object.keys(sig) as (keyof ShapeFeatures)[];
  if (keys.length === 0) return 0.5;
  const SOFT = 0.1;
  let sum = 0;
  for (const k of keys) {
    const [lo, hi] = sig[k]!;
    const v = f[k];
    const out = v < lo ? lo - v : v > hi ? v - hi : 0;
    sum += Math.max(0, 1 - out / SOFT);
  }
  return sum / keys.length;
}
