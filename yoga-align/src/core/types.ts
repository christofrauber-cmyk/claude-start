import type { ShapeSignature } from './signature';

// Core data model. Everything the rule engine and the UI share lives here.

/**
 * Camera position relative to the MAT (not to the body):
 * - front: camera at the short front edge of the mat, looking down its length
 * - side:  camera at the long edge of the mat, looking across it
 * A student facing the mat front in Tadasana is seen frontally from "front"
 * and in profile from "side". In Warrior II the same student shows the chest
 * to "side" and the lead knee pointing at the camera from "front".
 */
export type View = 'front' | 'side';

export type Side = 'left' | 'right';

/** One MediaPipe landmark in normalized image coordinates (0..1, y pointing down). */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/** 33 landmarks in MediaPipe BlazePose order. */
export type PoseFrame = Landmark[];

/**
 * Names a body point in a rule. Anatomical sides:
 *   left_knee, right_wrist, ...
 * Pose-relative sides, resolved via the step's side (lead = the side named in
 * "Warrior II right", i.e. the bent front leg):
 *   lead_knee, trail_ankle, ...
 * Virtual midpoints:
 *   mid_hip, mid_shoulder, mid_ankle, mid_knee, mid_wrist, mid_ear
 */
export type JointRef = string;

/** Direction for signed offsets. A JointRef means "toward that point". */
export type Direction = 'up' | 'down' | 'forward' | 'backward' | JointRef;

export type Measure =
  /** Interior angle at b between b→a and b→c, 0..180°, measured in the image plane. */
  | { kind: 'angle'; a: JointRef; b: JointRef; c: JointRef }
  /** Deviation of segment from→to from the vertical or horizontal, 0..90°. */
  | { kind: 'tilt'; from: JointRef; to: JointRef; axis: 'vertical' | 'horizontal' }
  /**
   * Displacement of point a relative to point b along one image axis,
   * in torso lengths (mid_shoulder↔mid_hip distance). Positive means "a lies
   * further in `toward` than b". With abs: true the sign is dropped
   * (e.g. "hips level").
   * 'forward'/'backward' = toward / away from the mat front (side view only).
   */
  | { kind: 'offset'; a: JointRef; b: JointRef; axis: 'x' | 'y'; toward?: Direction; abs?: boolean };

export interface Rule {
  id: string;
  /** Which camera position can judge this rule. */
  view: View;
  measure: Measure;
  /** Acceptable range [min, max] in the measure's unit (degrees or torso lengths). */
  range: [number, number];
  /**
   * Outside the range by at most this much → 'minor', beyond → 'major'.
   * Defaults: 8° for angle/tilt, 0.08 torso lengths for offset.
   */
  margin?: number;
  /** Short label shown next to the measurement, e.g. "Vorderes Knie". */
  label: string;
  /** Teacher cue when the value is below range[0]. */
  cueBelow: string;
  /** Teacher cue when the value is above range[1]. */
  cueAbove: string;
  /** Optional explanation why this matters in this school. */
  why?: string;
  /** 1 = detail, 2 = normal, 3 = foundational. Used for ordering feedback. */
  weight?: 1 | 2 | 3;
}

/**
 * How to recognise the lead side of a sided pose in a frame:
 * - bentKnee:    lead = the more bent knee (Warriors, lunges, side angle)
 * - straightKnee: lead = the straighter knee (Janu Sirsasana)
 * - lowerAnkle:  lead = the standing leg (Warrior III, Half Moon)
 * - higherAnkle: lead = the lifted leg (Tree)
 * - lowerWrist:  lead = the side of the lower hand (Triangle)
 */
export type SideCue = 'bentKnee' | 'straightKnee' | 'lowerAnkle' | 'higherAnkle' | 'lowerWrist';

export type PoseCategory = 'standing' | 'forward-bend' | 'backbend' | 'twist' | 'seated' | 'inversion' | 'arm-balance' | 'prone' | 'supine';

export interface PoseDef {
  id: string;
  sanskrit: string;
  nameDe: string;
  nameEn: string;
  category: PoseCategory;
  /** True if the pose is done to the left and to the right. */
  sided: boolean;
  /** Which views give useful feedback, best first. */
  bestViews: View[];
  /** Notes on detection limits for this pose (occlusion, depth...). */
  limits?: string;
  /** Sided poses: how to tell the lead side from the landmarks. */
  sideCue?: SideCue;
  /** Coarse shape used to recognise the pose in a video (see signature.ts). */
  shape?: ShapeSignature;
}

export interface School {
  id: string;
  name: string;
  description: string;
  /** Rules per pose id. A pose without rules is shown but not judged. */
  rules: Record<string, Rule[]>;
  /** Free-text status, e.g. "Entwurf – fachlich zu prüfen". */
  status: string;
}

export interface SequenceStep {
  poseId: string;
  side?: Side;
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  /** Built-in sequences are read-only. */
  builtIn?: boolean;
}

// ----- engine output -----

export type Status = 'ok' | 'minor' | 'major' | 'unmeasurable';

/** Normalized image coordinates (0..1). */
export interface Pt {
  x: number;
  y: number;
}

/** What the overlay should draw for one rule. All points are normalized. */
export type Visual =
  | { type: 'angle'; a: Pt; b: Pt; c: Pt; idealC?: Pt; value: number }
  | { type: 'segment'; from: Pt; to: Pt; idealTo?: Pt; value: number }
  | { type: 'offset'; a: Pt; b: Pt; idealA?: Pt; value: number };

export interface RuleResult {
  rule: Rule;
  status: Status;
  value?: number;
  /** How far outside the range (0 if inside). */
  deviation?: number;
  cue?: string;
  visual?: Visual;
}

export interface FrameContext {
  /** Video pixel size, needed to measure angles without aspect distortion. */
  width: number;
  height: number;
  /** Side view only: where the mat front is in the image. */
  matFront?: 'left' | 'right';
  /** Resolves lead_/trail_ refs. Defaults to 'right'. */
  side?: Side;
  /** Camera position; in 'side' view midpoints fall back to the visible side. */
  view?: View;
}
