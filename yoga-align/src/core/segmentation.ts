import type { PoseFrame } from './types';
import { medianFrame } from './engine';
import { LANDMARK_INDEX } from './landmarks';

export interface TimedFrame {
  t: number; // in seconds
  frame: PoseFrame | null; // null = no person detected
}

export interface Hold {
  start: number; // in seconds
  end: number; // in seconds
  frames: TimedFrame[]; // all non-null
}

export interface HoldOptions {
  motionThreshold?: number; // body sizes per second, default 0.07
  aspect?: number; // video width / height, default 1
  smoothWindow?: number; // median filter half-width in samples, default 3
  lag?: number; // compare shapes this many samples apart, default 4
  minDuration?: number; // default 1.0 seconds
  maxGap?: number; // default 0.6 seconds
}

/** Motion landmarks: shoulders, elbows, wrists, hips, knees, ankles. */
const MOTION_LANDMARKS = [
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
];

/**
 * How much the body moved between two frames, relative to body size.
 * Median displacement of the visible key joints, divided by the larger side
 * of their bounding box. The body box (not the torso length) is the scale,
 * because the torso shrinks to almost nothing when seen end-on in forward
 * bends. `aspect` = video width / height, so x and y are measured alike.
 * Returns Infinity if too few joints are visible.
 */
export function frameMotion(a: PoseFrame, b: PoseFrame, aspect = 1): number {
  const moves: number[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const name of MOTION_LANDMARKS) {
    const idx = LANDMARK_INDEX[name];
    const pa = a[idx], pb = b[idx];
    if (!pa || !pb || (pa.visibility ?? 1) < 0.5 || (pb.visibility ?? 1) < 0.5) continue;
    moves.push(Math.hypot((pb.x - pa.x) * aspect, pb.y - pa.y));
    minX = Math.min(minX, pa.x * aspect); maxX = Math.max(maxX, pa.x * aspect);
    minY = Math.min(minY, pa.y); maxY = Math.max(maxY, pa.y);
  }
  const size = Math.max(maxX - minX, maxY - minY);
  if (moves.length < 4 || !(size > 0)) return Infinity;
  moves.sort((x, y) => x - y);
  return moves[moves.length >> 1] / size;
}

/**
 * Detect holds: periods where the body stays in one shape.
 * Landmarks are first median-filtered over ±`smoothWindow` samples (removes
 * jitter of hidden joints, e.g. in forward bends), then the body shape is
 * compared `lag` samples before and after each sample (~1 s apart). Samples
 * below `motionThreshold` (body sizes per second) are still; consecutive
 * still samples form a hold. A missing person or a gap > maxGap ends a hold.
 */
export function detectHolds(frames: TimedFrame[], opts: HoldOptions = {}): Hold[] {
  const motionThreshold = opts.motionThreshold ?? 0.07;
  const minDuration = opts.minDuration ?? 1.0;
  const maxGap = opts.maxGap ?? 0.6;
  const aspect = opts.aspect ?? 1;
  const W = opts.smoothWindow ?? 3;
  const LAG = opts.lag ?? 4;
  const n = frames.length;

  const smooth = frames.map((f, i) => {
    if (!f.frame) return null;
    const win: PoseFrame[] = [];
    for (let j = Math.max(0, i - W); j <= Math.min(n - 1, i + W); j++) {
      const g = frames[j];
      if (g.frame && Math.abs(g.t - f.t) <= maxGap * (Math.abs(j - i) || 1)) win.push(g.frame);
    }
    return medianFrame(win);
  });

  const still = frames.map((f, i) => {
    if (!f.frame) return false;
    // Near the ends of the video, use the available side only.
    const ia = Math.max(0, i - LAG), ib = Math.min(n - 1, i + LAG);
    const a = smooth[ia], b = smooth[ib];
    const dt = frames[ib].t - frames[ia].t;
    if (!a || !b || dt <= 0) return false;
    return frameMotion(a, b, aspect) / dt < motionThreshold;
  });

  const holds: Hold[] = [];
  let run: TimedFrame[] = [];
  const close = () => {
    if (run.length && run[run.length - 1].t - run[0].t >= minDuration) {
      holds.push({ start: run[0].t, end: run[run.length - 1].t, frames: run });
    }
    run = [];
  };
  for (let i = 0; i < n; i++) {
    if (still[i] && run.length && frames[i].t - run[run.length - 1].t > maxGap) close();
    if (still[i]) run.push(frames[i]);
    else close();
  }
  close();
  return holds;
}

/**
 * Assign holds to sequence steps in temporal order, maximizing the total fit.
 * `fit(hold, stepIndex)` returns 0..1 (how well the hold looks like that
 * step's pose). Every step gets at most one hold, every hold at most one
 * step, and the order is kept. A matched step earns a base bonus, so steps
 * stay unmatched only when there are not enough holds.
 */
export function alignHolds(holds: Hold[], steps: number, fit: (hold: Hold, step: number) => number): (Hold | null)[] {
  const BASE = 0.5;
  const value = (h: Hold, s: number) => BASE + fit(h, s) + 0.1 * Math.min(h.end - h.start, 10) / 10;
  const m = holds.length;
  // best[i][j]: best total using the first i steps and the first j holds.
  const best: number[][] = Array.from({ length: steps + 1 }, () => new Array(m + 1).fill(0));
  const choice: (0 | 1 | 2)[][] = Array.from({ length: steps + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= steps; i++) {
    for (let j = 0; j <= m; j++) {
      let v = best[i - 1][j], c: 0 | 1 | 2 = 0; // step i unmatched
      if (j > 0 && best[i][j - 1] > v) { v = best[i][j - 1]; c = 1; } // hold j unused
      if (j > 0) {
        const w = best[i - 1][j - 1] + value(holds[j - 1], i - 1);
        if (w > v) { v = w; c = 2; }
      }
      best[i][j] = v;
      choice[i][j] = c;
    }
  }
  const out: (Hold | null)[] = new Array(steps).fill(null);
  for (let i = steps, j = m; i > 0;) {
    const c = choice[i][j];
    if (c === 2) { out[i - 1] = holds[j - 1]; i--; j--; }
    else if (c === 1) j--;
    else i--;
  }
  return out;
}

/**
 * Select n longest holds.
 * If holds.length >= n, pick the n longest and return in temporal order.
 * If fewer, return all holds in temporal order padded with null.
 */
export function assignHolds(holds: Hold[], n: number): (Hold | null)[] {
  if (holds.length === 0) {
    return Array(n).fill(null);
  }

  if (holds.length >= n) {
    // Sort by duration descending, pick top n, then restore temporal order.
    const sorted = [...holds].sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const picked = sorted.slice(0, n);
    return picked.sort((a, b) => a.start - b.start);
  } else {
    // Return all in temporal order, padded with null.
    const result: (Hold | null)[] = [...holds].sort((a, b) => a.start - b.start);
    while (result.length < n) {
      result.push(null);
    }
    return result;
  }
}

/**
 * Find the frame in the hold with the lowest motion to its neighbors.
 * Tie-break: highest mean visibility.
 * For a single frame, return it.
 */
export function bestFrame(hold: Hold): TimedFrame {
  if (hold.frames.length === 1) return hold.frames[0];

  let bestIdx = 0;
  let lowestMotion = Infinity;
  let highestVis = -1;

  for (let i = 0; i < hold.frames.length; i++) {
    let motion = 0;
    let count = 0;

    if (i > 0) {
      motion += frameMotion(hold.frames[i - 1].frame!, hold.frames[i].frame!);
      count++;
    }
    if (i < hold.frames.length - 1) {
      motion += frameMotion(hold.frames[i].frame!, hold.frames[i + 1].frame!);
      count++;
    }

    if (count > 0) motion /= count;

    // Mean visibility of this frame.
    const meanVis =
      hold.frames[i].frame!.reduce((sum, lm) => sum + (lm.visibility ?? 1), 0) /
      hold.frames[i].frame!.length;

    if (motion < lowestMotion || (motion === lowestMotion && meanVis > highestVis)) {
      bestIdx = i;
      lowestMotion = motion;
      highestVis = meanVis;
    }
  }

  return hold.frames[bestIdx];
}

/**
 * For side-view videos: compare nose x to the midpoint of the ears.
 * nose x < ears x → person faces image-left.
 * Return the majority direction ('left' if tie or no data).
 * Only count frames where nose and both ears have visibility > 0.5.
 */
export function guessMatFront(frames: TimedFrame[]): 'left' | 'right' {
  let leftCount = 0;
  let rightCount = 0;

  for (const tf of frames) {
    if (tf.frame === null) continue;

    const frame = tf.frame;
    const nose = frame[LANDMARK_INDEX.nose];
    const leftEar = frame[LANDMARK_INDEX.left_ear];
    const rightEar = frame[LANDMARK_INDEX.right_ear];

    if ((nose?.visibility ?? 1) > 0.5 && (leftEar?.visibility ?? 1) > 0.5 && (rightEar?.visibility ?? 1) > 0.5) {
      const earsX = (leftEar.x + rightEar.x) / 2;
      if (nose.x < earsX) {
        leftCount++;
      } else {
        rightCount++;
      }
    }
  }

  return leftCount >= rightCount ? 'left' : 'right';
}
