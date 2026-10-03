import { describe, expect, it } from 'vitest';
import { LANDMARK_INDEX } from './landmarks';
import { detectLeadSide } from './side';
import type { PoseFrame } from './types';

const ctx = { width: 1000, height: 1000 };

function frame(points: Record<string, [number, number]>): PoseFrame {
  const f: PoseFrame = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  for (const [name, [x, y]] of Object.entries(points)) f[LANDMARK_INDEX[name]] = { x, y, z: 0, visibility: 1 };
  return f;
}

// Warrior II seen from the side, LEFT knee bent, right leg straight.
const warrior = frame({
  left_shoulder: [0.5, 0.3], right_shoulder: [0.5, 0.3],
  left_hip: [0.5, 0.5], right_hip: [0.5, 0.5],
  left_knee: [0.3, 0.5], left_ankle: [0.3, 0.7],
  right_knee: [0.6, 0.6], right_ankle: [0.7, 0.7],
});

describe('detectLeadSide', () => {
  it('bentKnee picks the bent leg', () => {
    expect(detectLeadSide(warrior, 'bentKnee', ctx)).toBe('left');
  });
  it('straightKnee picks the straight leg', () => {
    expect(detectLeadSide(warrior, 'straightKnee', ctx)).toBe('right');
  });
  it('ankle and wrist heights', () => {
    const f = frame({
      left_shoulder: [0.5, 0.3], right_shoulder: [0.5, 0.3], left_hip: [0.5, 0.5], right_hip: [0.5, 0.5],
      left_ankle: [0.5, 0.9], right_ankle: [0.8, 0.5], left_wrist: [0.4, 0.8], right_wrist: [0.6, 0.1],
    });
    expect(detectLeadSide(f, 'lowerAnkle', ctx)).toBe('left');
    expect(detectLeadSide(f, 'higherAnkle', ctx)).toBe('right');
    expect(detectLeadSide(f, 'lowerWrist', ctx)).toBe('left');
  });
  it('returns null when both sides look alike or are hidden', () => {
    const f = frame({
      left_shoulder: [0.5, 0.3], right_shoulder: [0.5, 0.3], left_hip: [0.5, 0.5], right_hip: [0.5, 0.5],
      left_knee: [0.5, 0.7], right_knee: [0.5, 0.7], left_ankle: [0.5, 0.9], right_ankle: [0.5, 0.9],
    });
    expect(detectLeadSide(f, 'bentKnee', ctx)).toBeNull();
    f[LANDMARK_INDEX.left_knee].visibility = 0.1;
    expect(detectLeadSide(warrior.map((l, i) => (i === LANDMARK_INDEX.left_knee ? { ...l, visibility: 0.1 } : l)), 'bentKnee', ctx)).toBeNull();
  });
});
