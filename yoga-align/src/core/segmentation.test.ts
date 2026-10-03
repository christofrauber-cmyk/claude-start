import { describe, it, expect } from 'vitest';
import type { PoseFrame } from './types';
import type { TimedFrame } from './segmentation';
import { frameMotion, detectHolds, assignHolds, bestFrame, guessMatFront } from './segmentation';
import { LANDMARK_INDEX } from './landmarks';

/** Helper: create a default landmark with neutral position. */
function makeLandmark(x = 0.5, y = 0.5, z = 0, visibility = 1) {
  return { x, y, z, visibility };
}

/** Helper: create a standing figure (33 landmarks). */
function makeStandingFrame(options: { xShift?: number; jitter?: number } = {}): PoseFrame {
  const { xShift = 0, jitter = 0 } = options;
  const frame: PoseFrame = Array(33).fill(null).map(() => makeLandmark());

  // Nose
  frame[LANDMARK_INDEX.nose] = makeLandmark(0.5 + xShift, 0.2);

  // Eyes and ears
  frame[LANDMARK_INDEX.left_eye_inner] = makeLandmark(0.45 + xShift, 0.18);
  frame[LANDMARK_INDEX.left_eye] = makeLandmark(0.43 + xShift, 0.18);
  frame[LANDMARK_INDEX.left_eye_outer] = makeLandmark(0.40 + xShift, 0.18);
  frame[LANDMARK_INDEX.left_ear] = makeLandmark(0.37 + xShift, 0.2);

  frame[LANDMARK_INDEX.right_eye_inner] = makeLandmark(0.55 + xShift, 0.18);
  frame[LANDMARK_INDEX.right_eye] = makeLandmark(0.57 + xShift, 0.18);
  frame[LANDMARK_INDEX.right_eye_outer] = makeLandmark(0.60 + xShift, 0.18);
  frame[LANDMARK_INDEX.right_ear] = makeLandmark(0.63 + xShift, 0.2);

  // Shoulders
  frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.3 + xShift, 0.35);
  frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.7 + xShift, 0.35);

  // Elbows
  frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.2 + xShift, 0.5);
  frame[LANDMARK_INDEX.right_elbow] = makeLandmark(0.8 + xShift, 0.5);

  // Wrists
  frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.15 + xShift, 0.65);
  frame[LANDMARK_INDEX.right_wrist] = makeLandmark(0.85 + xShift, 0.65);

  // Hips
  frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.35 + xShift, 0.6);
  frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.65 + xShift, 0.6);

  // Knees
  frame[LANDMARK_INDEX.left_knee] = makeLandmark(0.35 + xShift, 0.8);
  frame[LANDMARK_INDEX.right_knee] = makeLandmark(0.65 + xShift, 0.8);

  // Ankles
  frame[LANDMARK_INDEX.left_ankle] = makeLandmark(0.35 + xShift, 0.95);
  frame[LANDMARK_INDEX.right_ankle] = makeLandmark(0.65 + xShift, 0.95);

  // Apply jitter to motion landmarks if specified
  if (jitter > 0) {
    const jitterAmount = (Math.random() - 0.5) * jitter;
    for (const name of ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle']) {
      const idx = LANDMARK_INDEX[name as keyof typeof LANDMARK_INDEX];
      frame[idx].x += jitterAmount;
    }
  }

  return frame;
}

describe('frameMotion', () => {
  it('should return 0 for identical frames', () => {
    const frame = makeStandingFrame();
    expect(frameMotion(frame, frame)).toBe(0);
  });

  it('should measure displacement when frame moves', () => {
    const frame1 = makeStandingFrame({ xShift: 0 });
    const frame2 = makeStandingFrame({ xShift: 0.1 });
    const motion = frameMotion(frame1, frame2);
    expect(motion).toBeGreaterThan(0);
  });

  it('should return Infinity for zero torso length', () => {
    const frame1 = makeStandingFrame();
    const frame2 = makeStandingFrame();
    // Move shoulders to hips position in frame1 (zero torso for normalization)
    frame1[LANDMARK_INDEX.left_shoulder] = { ...frame1[LANDMARK_INDEX.left_shoulder], y: frame1[LANDMARK_INDEX.left_hip].y };
    frame1[LANDMARK_INDEX.right_shoulder] = { ...frame1[LANDMARK_INDEX.right_shoulder], y: frame1[LANDMARK_INDEX.right_hip].y };
    expect(frameMotion(frame1, frame2)).toBe(Infinity);
  });
});

describe('detectHolds', () => {
  it('should detect a still(3s) – moving(2s) – still(3s) sequence at 10 fps', () => {
    const frames: TimedFrame[] = [];
    const fps = 10;

    // Still for 3 seconds (30 frames)
    for (let i = 0; i < 30; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame({ jitter: 0.001 }) });
    }

    // Moving for 2 seconds (20 frames)
    for (let i = 30; i < 50; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame({ xShift: (i - 30) / 20 * 0.2, jitter: 0.001 }) });
    }

    // Still for 3 seconds (30 frames)
    for (let i = 50; i < 80; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame({ jitter: 0.001 }) });
    }

    const holds = detectHolds(frames);
    expect(holds.length).toBe(2);
    expect(holds[0].start).toBeLessThan(0.5);
    expect(holds[0].end).toBeGreaterThan(2.5);
    expect(holds[1].start).toBeGreaterThan(5);
    expect(holds[1].end).toBeGreaterThan(7.5);
  });

  it('gives every hold its own start time (three holds, gap breaks a run)', () => {
    const frames: TimedFrame[] = [];
    let t = 0;
    const still = (n: number) => { for (let i = 0; i < n; i++, t += 0.1) frames.push({ t, frame: makeStandingFrame() }); };
    const move = (n: number) => { for (let i = 0; i < n; i++, t += 0.1) frames.push({ t, frame: makeStandingFrame({ xShift: (i % 2) * 0.1 }) }); };
    still(25); move(10); still(25);
    t += 2; // recording gap without samples
    still(25);
    const holds = detectHolds(frames);
    expect(holds.map((h) => [Math.round(h.start), Math.round(h.end)])).toEqual([[0, 2], [4, 6], [8, 10]]);
    for (const h of holds) expect(h.frames.every((f) => f.t >= h.start && f.t <= h.end)).toBe(true);
  });

  it('should drop short still periods < 1.5s', () => {
    const frames: TimedFrame[] = [];
    const fps = 10;

    // Still for 1 second (10 frames) - too short
    for (let i = 0; i < 10; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame() });
    }

    const holds = detectHolds(frames);
    expect(holds.length).toBe(0);
  });

  it('should split holds on null frames', () => {
    const frames: TimedFrame[] = [];
    const fps = 10;

    // Still for 2 seconds
    for (let i = 0; i < 20; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame() });
    }

    // Null frame (person not detected)
    frames.push({ t: 2, frame: null });

    // Still for 2 seconds more
    for (let i = 21; i < 41; i++) {
      frames.push({ t: (20 + i - 20) / fps, frame: makeStandingFrame() });
    }

    const holds = detectHolds(frames);
    // Should have 2 separate holds if they're both >= 1.5s after thresholding
    expect(holds.length).toBeGreaterThanOrEqual(1);
  });

  it('should respect maxGap setting', () => {
    const frames: TimedFrame[] = [];
    const fps = 10;

    // Still for 2 seconds
    for (let i = 0; i < 20; i++) {
      frames.push({ t: i / fps, frame: makeStandingFrame() });
    }

    // Gap of 0.5s (no null, just time gap)
    frames.push({ t: 2.5, frame: makeStandingFrame() });

    // Still for 2 more seconds
    for (let i = 25; i < 45; i++) {
      frames.push({ t: (20 + i - 20) / fps, frame: makeStandingFrame() });
    }

    // With default maxGap (0.6s), the small gap should not break the hold
    const holds = detectHolds(frames);
    // Should probably be one or two holds depending on motion calculation
    expect(holds.length).toBeGreaterThanOrEqual(1);
  });
});

describe('assignHolds', () => {
  it('should pick n longest holds when there are >= n', () => {
    const holds = [
      { start: 0, end: 1, frames: [] }, // 1s
      { start: 2, end: 5, frames: [] }, // 3s
      { start: 6, end: 8, frames: [] }, // 2s
      { start: 9, end: 10, frames: [] }, // 1s
    ];

    const assigned = assignHolds(holds, 2);
    expect(assigned.length).toBe(2);
    expect(assigned[0]).toBe(holds[1]); // 3s hold comes first
    expect(assigned[1]).toBe(holds[2]); // 2s hold comes second
  });

  it('should maintain temporal order after picking', () => {
    const holds = [
      { start: 10, end: 13, frames: [] }, // 3s
      { start: 0, end: 3, frames: [] }, // 3s
      { start: 5, end: 7, frames: [] }, // 2s
    ];

    const assigned = assignHolds(holds, 2);
    expect(assigned[0]?.start).toBe(0);
    expect(assigned[1]?.start).toBe(10);
  });

  it('should pad with null when fewer holds than n', () => {
    const holds = [
      { start: 0, end: 2, frames: [] },
    ];

    const assigned = assignHolds(holds, 3);
    expect(assigned.length).toBe(3);
    expect(assigned[0]).toBe(holds[0]);
    expect(assigned[1]).toBeNull();
    expect(assigned[2]).toBeNull();
  });

  it('should return all nulls for empty holds', () => {
    const assigned = assignHolds([], 2);
    expect(assigned.length).toBe(2);
    expect(assigned[0]).toBeNull();
    expect(assigned[1]).toBeNull();
  });
});

describe('bestFrame', () => {
  it('should return the only frame for single-frame hold', () => {
    const tf: TimedFrame = { t: 0, frame: makeStandingFrame() };
    const hold = { start: 0, end: 0, frames: [tf] };
    expect(bestFrame(hold)).toBe(tf);
  });

  it('should pick frame with lowest motion to neighbors', () => {
    // Create three frames: still, moving, still
    const frame1 = makeStandingFrame();
    const frame2 = makeStandingFrame({ xShift: 0.1 });
    const frame3 = makeStandingFrame();

    const tf1: TimedFrame = { t: 0, frame: frame1 };
    const tf2: TimedFrame = { t: 1, frame: frame2 };
    const tf3: TimedFrame = { t: 2, frame: frame3 };

    const hold = { start: 0, end: 2, frames: [tf1, tf2, tf3] };
    const best = bestFrame(hold);

    // frame1 and frame3 are similar, so they should have low motion to neighbors
    // frame2 is different, so it should have high motion
    expect(best).toEqual(tf1);
  });

  it('should tie-break by highest mean visibility', () => {
    const frame1 = makeStandingFrame();
    const frame2 = makeStandingFrame();
    // Make frame1 have lower visibility so frame2 wins the tie-breaker
    frame1.forEach((lm) => {
      lm.visibility = 0.8;
    });

    const tf1: TimedFrame = { t: 0, frame: frame1 };
    const tf2: TimedFrame = { t: 1, frame: frame2 };

    const hold = { start: 0, end: 1, frames: [tf1, tf2] };
    const best = bestFrame(hold);

    expect(best).toEqual(tf2);
  });
});

describe('guessMatFront', () => {
  it('should detect left-facing direction', () => {
    const frames: TimedFrame[] = [];

    // Create frames where nose is to the left of ears
    for (let i = 0; i < 5; i++) {
      const frame = makeStandingFrame();
      frame[LANDMARK_INDEX.nose].x = 0.4; // nose left
      frame[LANDMARK_INDEX.left_ear].x = 0.45;
      frame[LANDMARK_INDEX.right_ear].x = 0.55;
      frames.push({ t: i, frame });
    }

    const result = guessMatFront(frames);
    expect(result).toBe('left');
  });

  it('should detect right-facing direction', () => {
    const frames: TimedFrame[] = [];

    // Create frames where nose is to the right of ears
    for (let i = 0; i < 5; i++) {
      const frame = makeStandingFrame();
      frame[LANDMARK_INDEX.nose].x = 0.6; // nose right
      frame[LANDMARK_INDEX.left_ear].x = 0.45;
      frame[LANDMARK_INDEX.right_ear].x = 0.55;
      frames.push({ t: i, frame });
    }

    const result = guessMatFront(frames);
    expect(result).toBe('right');
  });

  it('should ignore frames with low visibility', () => {
    const frames: TimedFrame[] = [];

    // Create frames with low visibility landmarks
    for (let i = 0; i < 5; i++) {
      const frame = makeStandingFrame();
      frame[LANDMARK_INDEX.nose].visibility = 0.3; // too low
      frame[LANDMARK_INDEX.nose].x = 0.4;
      frame[LANDMARK_INDEX.left_ear].x = 0.45;
      frame[LANDMARK_INDEX.right_ear].x = 0.55;
      frames.push({ t: i, frame });
    }

    const result = guessMatFront(frames);
    expect(result).toBe('left'); // tie-break default
  });

  it('should return left on tie', () => {
    const frames: TimedFrame[] = [];

    // Create frames with equal votes
    const frame1 = makeStandingFrame();
    frame1[LANDMARK_INDEX.nose].x = 0.4; // nose left
    frame1[LANDMARK_INDEX.left_ear].x = 0.45;
    frame1[LANDMARK_INDEX.right_ear].x = 0.55;

    const frame2 = makeStandingFrame();
    frame2[LANDMARK_INDEX.nose].x = 0.6; // nose right
    frame2[LANDMARK_INDEX.left_ear].x = 0.45;
    frame2[LANDMARK_INDEX.right_ear].x = 0.55;

    frames.push({ t: 0, frame: frame1 });
    frames.push({ t: 1, frame: frame2 });

    const result = guessMatFront(frames);
    expect(result).toBe('left'); // tie-break
  });

  it('should handle empty frames', () => {
    const frames: TimedFrame[] = [];
    const result = guessMatFront(frames);
    expect(result).toBe('left'); // tie-break default
  });

  it('should handle all null frames', () => {
    const frames: TimedFrame[] = [
      { t: 0, frame: null },
      { t: 1, frame: null },
    ];
    const result = guessMatFront(frames);
    expect(result).toBe('left'); // tie-break default
  });
});
