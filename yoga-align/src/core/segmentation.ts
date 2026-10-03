import type { PoseFrame } from './types';
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
  motionThreshold?: number; // default 0.25
  minDuration?: number; // default 1.5 seconds
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
 * Mean Euclidean displacement of key landmarks, normalized by torso length.
 * Returns Infinity if torso length is ~0.
 */
export function frameMotion(a: PoseFrame, b: PoseFrame): number {
  // Compute torso length: distance between midpoint of shoulders and midpoint of hips
  const aMidShoulder = {
    x: (a[LANDMARK_INDEX.left_shoulder].x + a[LANDMARK_INDEX.right_shoulder].x) / 2,
    y: (a[LANDMARK_INDEX.left_shoulder].y + a[LANDMARK_INDEX.right_shoulder].y) / 2,
  };
  const aMidHip = {
    x: (a[LANDMARK_INDEX.left_hip].x + a[LANDMARK_INDEX.right_hip].x) / 2,
    y: (a[LANDMARK_INDEX.left_hip].y + a[LANDMARK_INDEX.right_hip].y) / 2,
  };
  const torsoLength = Math.hypot(aMidHip.x - aMidShoulder.x, aMidHip.y - aMidShoulder.y);
  if (torsoLength === 0) return Infinity;

  let totalDisplacement = 0;
  for (const name of MOTION_LANDMARKS) {
    const idx = LANDMARK_INDEX[name];
    const dx = b[idx].x - a[idx].x;
    const dy = b[idx].y - a[idx].y;
    totalDisplacement += Math.hypot(dx, dy);
  }

  return totalDisplacement / MOTION_LANDMARKS.length / torsoLength;
}

/**
 * Detect holds: periods of low motion.
 * - Compute motion per second between consecutive non-null frames.
 * - Smooth with centered moving average of 3 samples.
 * - Mark "still" if smoothed motion < motionThreshold.
 * - Consecutive still samples form runs; null frames or gaps > maxGap break them.
 * - Keep runs with duration >= minDuration.
 */
export function detectHolds(frames: TimedFrame[], opts: HoldOptions = {}): Hold[] {
  const motionThreshold = opts.motionThreshold ?? 0.25;
  const minDuration = opts.minDuration ?? 1.5;
  const maxGap = opts.maxGap ?? 0.6;

  // One motion sample per pair of consecutive frames; a null frame or a long
  // gap marks the pair as "broken" (never still).
  interface Sample { from: TimedFrame; to: TimedFrame; motion: number; broken: boolean }
  const samples: Sample[] = [];
  for (let i = 1; i < frames.length; i++) {
    const from = frames[i - 1], to = frames[i];
    const dt = to.t - from.t;
    const broken = !from.frame || !to.frame || dt <= 0 || dt > maxGap;
    const motion = broken ? Infinity : frameMotion(from.frame!, to.frame!) / dt;
    samples.push({ from, to, motion, broken });
  }

  // Centered moving average over 3 samples, not crossing broken samples.
  const still = samples.map((s, i) => {
    if (s.broken) return false;
    const vals = [s.motion];
    if (i > 0 && !samples[i - 1].broken) vals.push(samples[i - 1].motion);
    if (i < samples.length - 1 && !samples[i + 1].broken) vals.push(samples[i + 1].motion);
    return vals.reduce((a, b) => a + b, 0) / vals.length < motionThreshold;
  });

  const holds: Hold[] = [];
  let runStart = -1;
  const close = (endIdx: number) => {
    const runFrames = [samples[runStart].from, ...samples.slice(runStart, endIdx + 1).map((s) => s.to)];
    const start = runFrames[0].t, end = runFrames[runFrames.length - 1].t;
    if (end - start >= minDuration) holds.push({ start, end, frames: runFrames });
    runStart = -1;
  };
  for (let i = 0; i < samples.length; i++) {
    if (still[i] && runStart === -1) runStart = i;
    else if (!still[i] && runStart !== -1) close(i - 1);
  }
  if (runStart !== -1) close(samples.length - 1);
  return holds;
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
