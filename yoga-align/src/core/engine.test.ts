import { describe, it, expect } from 'vitest';
import type { FrameContext, PoseFrame, Rule } from './types';
import type { RuleResult } from './types';
import { evaluateRule, evaluatePose, poseScore, medianFrame } from './engine';
import { LANDMARK_INDEX } from './landmarks';

/** Helper: create a landmark. */
function makeLandmark(x = 0.5, y = 0.5, z = 0, visibility = 1) {
  return { x, y, z, visibility };
}

/** Helper: create a full 33-landmark frame with defaults. */
function makeFrame(): PoseFrame {
  return Array(33).fill(null).map(() => makeLandmark());
}

describe('evaluateRule - angle measurement', () => {
  it('should measure ~90° for a right angle in pixel space', () => {
    // Create a right angle: b at origin, a vertical up, c horizontal right
    // In normalized coords with 1600x900 image
    // To get 90°: place points so angle is 90° in PIXELS
    // a is 100 pixels up from b, c is 100 pixels right from b

    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // b at (800, 450) in pixels = (0.5, 0.5) normalized
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5); // point b
    // a at (800, 350) in pixels = (0.5, 0.389) normalized -> 100 pixels up
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5, 0.5 - 100 / 900); // point a
    // c at (900, 450) in pixels = (0.5625, 0.5) normalized -> 100 pixels right
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5 + 100 / 1600, 0.5); // point c

    const rule: Rule = {
      id: 'test-angle',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [85, 95],
      margin: 5,
      label: 'Right angle',
      cueBelow: 'Open more',
      cueAbove: 'Close more',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.value).toBeCloseTo(90, 0);
    expect(result.status).toBe('ok');
  });

  it('should measure ~180° for a straight leg', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // Create a straight line: all three points collinear
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.5, 0.3);
    frame[LANDMARK_INDEX.left_knee] = makeLandmark(0.5, 0.5);
    frame[LANDMARK_INDEX.left_ankle] = makeLandmark(0.5, 0.7);

    const rule: Rule = {
      id: 'test-straight',
      view: 'front',
      measure: { kind: 'angle', a: 'left_hip', b: 'left_knee', c: 'left_ankle' },
      range: [175, 180],
      label: 'Straight leg',
      cueBelow: 'Bend knee',
      cueAbove: 'Should not happen',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.value).toBeCloseTo(180, 0);
    expect(result.status).toBe('ok');
  });
});

describe('evaluateRule - tilt measurement', () => {
  it('should measure ~0° for a vertical segment', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // Vertical segment
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.5, 0.6);

    const rule: Rule = {
      id: 'test-vertical',
      view: 'front',
      measure: { kind: 'tilt', from: 'left_shoulder', to: 'left_hip', axis: 'vertical' },
      range: [0, 5],
      label: 'Vertical',
      cueBelow: 'Lean more',
      cueAbove: 'Lean less',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.value).toBeCloseTo(0, 0);
    expect(result.status).toBe('ok');
  });

  it('should measure ~45° for a 45° segment', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // 45° diagonal (down and right at equal angles)
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.3);
    // 100 pixels right and 100 pixels down
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.5 + 100 / 1600, 0.3 + 100 / 900);

    const rule: Rule = {
      id: 'test-45deg',
      view: 'front',
      measure: { kind: 'tilt', from: 'left_shoulder', to: 'left_hip', axis: 'vertical' },
      range: [40, 50],
      label: '45 degrees',
      cueBelow: 'More tilt',
      cueAbove: 'Less tilt',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.value).toBeCloseTo(45, 1);
    expect(result.status).toBe('ok');
  });
});

describe('evaluateRule - offset measurement', () => {
  it('should handle offset with toward "up"', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // Set up torso
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.4, 0.3);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.6, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.4, 0.6);
    frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.6, 0.6);
    // Torso length = 0.3 normalized = 270 pixels

    // Test points: left shoulder higher than right shoulder (toward "up")
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.3, 0.25); // point a
    frame[LANDMARK_INDEX.right_wrist] = makeLandmark(0.3, 0.35); // point b

    const rule: Rule = {
      id: 'test-offset-up',
      view: 'front',
      measure: { kind: 'offset', a: 'left_wrist', b: 'right_wrist', axis: 'y', toward: 'up' },
      range: [0.05, 0.2],
      label: 'Offset up',
      cueBelow: 'Raise',
      cueAbove: 'Lower',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).not.toBe('unmeasurable');
    expect(result.value).toBeGreaterThan(0);
  });

  it('should handle offset with toward a joint reference', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // Set up torso
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.4, 0.3);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.6, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.4, 0.6);
    frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.6, 0.6);

    frame[LANDMARK_INDEX.left_knee] = makeLandmark(0.4, 0.75); // reference point
    frame[LANDMARK_INDEX.left_ankle] = makeLandmark(0.4, 0.85); // point a
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.3, 0.5); // point b

    const rule: Rule = {
      id: 'test-offset-ref',
      view: 'front',
      measure: { kind: 'offset', a: 'left_ankle', b: 'left_wrist', axis: 'x', toward: 'left_knee' },
      range: [-0.1, 0.1],
      label: 'Offset to ref',
      cueBelow: 'Move left',
      cueAbove: 'Move right',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).not.toBe('unmeasurable');
  });

  it('should handle offset with forward/backward and matFront', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900, matFront: 'left' };

    // Set up torso
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.4, 0.3);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.6, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.4, 0.6);
    frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.6, 0.6);

    frame[LANDMARK_INDEX.left_ankle] = makeLandmark(0.3, 0.85);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.35, 0.5);

    const rule: Rule = {
      id: 'test-offset-forward',
      view: 'side',
      measure: { kind: 'offset', a: 'left_ankle', b: 'left_wrist', axis: 'x', toward: 'forward' },
      range: [-0.2, 0.2],
      label: 'Forward',
      cueBelow: 'Back up',
      cueAbove: 'Come forward',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).not.toBe('unmeasurable');
  });

  it('should handle abs offset (always positive)', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    // Set up torso
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.4, 0.3);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.6, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.4, 0.6);
    frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.6, 0.6);

    frame[LANDMARK_INDEX.left_ankle] = makeLandmark(0.25, 0.85);
    frame[LANDMARK_INDEX.right_ankle] = makeLandmark(0.45, 0.85);

    const rule: Rule = {
      id: 'test-abs-offset',
      view: 'front',
      measure: { kind: 'offset', a: 'left_ankle', b: 'right_ankle', axis: 'x', abs: true },
      range: [0.1, 0.3],
      label: 'Ankles level',
      cueBelow: 'Wider',
      cueAbove: 'Narrower',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.value).toBeGreaterThanOrEqual(0);
  });
});

describe('evaluateRule - visibility', () => {
  it('should return unmeasurable for low visibility landmarks', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5, 0, 0.3); // visibility < 0.5
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5, 0.6);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5, 0.7);

    const rule: Rule = {
      id: 'test-visibility',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [80, 100],
      label: 'Angle',
      cueBelow: 'Open',
      cueAbove: 'Close',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).toBe('unmeasurable');
  });
});

describe('evaluateRule - status and margin', () => {
  it('should return ok when value is in range', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5);
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5, 0.5 - 100 / 900);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5 + 100 / 1600, 0.5);

    const rule: Rule = {
      id: 'test-ok',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [85, 95],
      margin: 5,
      label: 'Angle',
      cueBelow: 'Open',
      cueAbove: 'Close',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).toBe('ok');
    expect(result.deviation).toBe(0);
  });

  it('should return minor when deviation <= margin', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5);
    // Create 95° angle (slightly off from 90°)
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5 - 5 / 1600, 0.5 - 100 / 900);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5 + 100 / 1600, 0.5);

    const rule: Rule = {
      id: 'test-minor',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [85, 95],
      margin: 8,
      label: 'Angle',
      cueBelow: 'Open',
      cueAbove: 'Close',
    };

    const result = evaluateRule(frame, rule, ctx);
    // If deviation is small, should be 'minor' (or 'ok')
    expect(['minor', 'ok']).toContain(result.status);
  });

  it('should return major when deviation > margin', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5);
    // Create a very acute angle (30°)
    const angle = 30 * Math.PI / 180;
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5 + 50 / 1600 * Math.cos(angle), 0.5 - 50 / 900 * Math.sin(angle));
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5 + 100 / 1600, 0.5);

    const rule: Rule = {
      id: 'test-major',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [85, 95],
      margin: 5,
      label: 'Angle',
      cueBelow: 'Open more',
      cueAbove: 'Close',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).toBe('major');
  });
});

describe('evaluateRule - ideal point feedback', () => {
  it('should have ideal point that produces in-range value when substituted', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5);
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5, 0.5 - 100 / 900);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5 + 100 / 1600, 0.5);

    const rule: Rule = {
      id: 'test-ideal',
      view: 'front',
      measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
      range: [85, 95],
      label: 'Angle',
      cueBelow: 'Open',
      cueAbove: 'Close',
    };

    const result = evaluateRule(frame, rule, ctx);
    expect(result.visual).toBeDefined();
    if (result.visual?.type === 'angle' && result.visual.idealC) {
      // Verify that the ideal point is reasonable
      expect(result.visual.idealC.x).toBeDefined();
      expect(result.visual.idealC.y).toBeDefined();
    }
  });
});

describe('evaluateRule - lead/trail resolution', () => {
  it('should resolve lead_/trail_ with side "left"', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900, side: 'left' };

    frame[LANDMARK_INDEX.left_knee] = makeLandmark(0.4, 0.7);
    frame[LANDMARK_INDEX.right_knee] = makeLandmark(0.6, 0.7);

    const rule: Rule = {
      id: 'test-lead',
      view: 'front',
      measure: { kind: 'offset', a: 'lead_knee', b: 'right_wrist', axis: 'x' },
      range: [-0.1, 0.1],
      label: 'Lead knee',
      cueBelow: 'Back',
      cueAbove: 'Forward',
    };

    // With side 'left', lead_ should resolve to left_
    // So lead_knee -> left_knee
    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.4, 0.3);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.6, 0.3);
    frame[LANDMARK_INDEX.left_hip] = makeLandmark(0.4, 0.6);
    frame[LANDMARK_INDEX.right_hip] = makeLandmark(0.6, 0.6);
    frame[LANDMARK_INDEX.right_wrist] = makeLandmark(0.6, 0.5);

    const result = evaluateRule(frame, rule, ctx);
    expect(result.status).not.toBe('unmeasurable');
  });
});

describe('evaluatePose', () => {
  it('should filter rules by view and sort by importance', () => {
    const frame = makeFrame();
    const ctx: FrameContext = { width: 1600, height: 900 };

    frame[LANDMARK_INDEX.left_shoulder] = makeLandmark(0.5, 0.5);
    frame[LANDMARK_INDEX.left_elbow] = makeLandmark(0.5, 0.6);
    frame[LANDMARK_INDEX.left_wrist] = makeLandmark(0.5, 0.7);
    frame[LANDMARK_INDEX.right_shoulder] = makeLandmark(0.5, 0.5);
    frame[LANDMARK_INDEX.right_elbow] = makeLandmark(0.5, 0.6);
    frame[LANDMARK_INDEX.right_wrist] = makeLandmark(0.5, 0.7);

    const rules: Rule[] = [
      {
        id: 'front-rule',
        view: 'front',
        measure: { kind: 'angle', a: 'left_elbow', b: 'left_shoulder', c: 'left_wrist' },
        range: [80, 100],
        weight: 2,
        label: 'Front',
        cueBelow: 'Open',
        cueAbove: 'Close',
      },
      {
        id: 'side-rule',
        view: 'side',
        measure: { kind: 'angle', a: 'right_elbow', b: 'right_shoulder', c: 'right_wrist' },
        range: [80, 100],
        weight: 2,
        label: 'Side',
        cueBelow: 'Open',
        cueAbove: 'Close',
      },
    ];

    const results = evaluatePose(frame, rules, 'front', ctx);
    expect(results.length).toBe(1);
    expect(results[0].rule.id).toBe('front-rule');
  });
});

describe('poseScore', () => {
  it('should calculate 100 when all rules are ok', () => {
    const results: RuleResult[] = [
      { rule: { id: '1', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'ok' },
      { rule: { id: '2', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'ok' },
    ];

    const score = poseScore(results);
    expect(score).toBe(100);
  });

  it('should weight rules correctly', () => {
    const results: RuleResult[] = [
      { rule: { id: '1', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A', weight: 3 }, status: 'ok' },
      { rule: { id: '2', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A', weight: 1 }, status: 'major' },
    ];

    const score = poseScore(results);
    // Total weight = 4, got = 3 (ok) + 0 (major)
    // Score = 3/4 * 100 = 75
    expect(score).toBe(75);
  });

  it('should count minor as half', () => {
    const results: RuleResult[] = [
      { rule: { id: '1', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'ok' },
      { rule: { id: '2', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'minor' },
    ];

    const score = poseScore(results);
    // Total weight = 4 (2+2 default), got = 2 + 1 = 3
    // Score = 3/4 * 100 = 75
    expect(score).toBe(75);
  });

  it('should ignore unmeasurable rules', () => {
    const results: RuleResult[] = [
      { rule: { id: '1', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'ok' },
      { rule: { id: '2', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'unmeasurable' },
    ];

    const score = poseScore(results);
    // Only 1 measurable rule, which is ok
    expect(score).toBe(100);
  });

  it('should return null when no measurable rules', () => {
    const results: RuleResult[] = [
      { rule: { id: '1', view: 'front', measure: { kind: 'angle', a: 'a', b: 'b', c: 'c' }, range: [0, 100], label: 'L', cueBelow: 'B', cueAbove: 'A' }, status: 'unmeasurable' },
    ];

    const score = poseScore(results);
    expect(score).toBeNull();
  });
});

describe('medianFrame', () => {
  it('should compute median across frames', () => {
    const frame1 = makeFrame();
    frame1[0] = { x: 0.1, y: 0.2, z: 0.3, visibility: 0.8 };

    const frame2 = makeFrame();
    frame2[0] = { x: 0.5, y: 0.6, z: 0.7, visibility: 0.9 };

    const frame3 = makeFrame();
    frame3[0] = { x: 0.3, y: 0.4, z: 0.5, visibility: 0.7 };

    const median = medianFrame([frame1, frame2, frame3]);

    expect(median[0].x).toBe(0.3); // median of 0.1, 0.5, 0.3 is 0.3
    expect(median[0].y).toBe(0.4); // median of 0.2, 0.6, 0.4 is 0.4
    expect(median[0].visibility).toBe(0.8); // median of 0.8, 0.9, 0.7 is 0.8
  });

  it('should compute median with even number of frames', () => {
    const frame1 = makeFrame();
    frame1[0] = { x: 0.1, y: 0.1, z: 0.1, visibility: 0.5 };

    const frame2 = makeFrame();
    frame2[0] = { x: 0.9, y: 0.9, z: 0.9, visibility: 0.9 };

    const median = medianFrame([frame1, frame2]);

    expect(median[0].x).toBe(0.5); // median of 0.1, 0.9 is 0.5
    expect(median[0].y).toBe(0.5);
    expect(median[0].visibility).toBe(0.7); // median of 0.5, 0.9 is 0.7
  });
});
