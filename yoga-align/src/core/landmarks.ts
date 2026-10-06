import type { FrameContext, JointRef, PoseFrame, Pt } from './types';

/** MediaPipe BlazePose landmark indices. */
export const LANDMARK_INDEX: Record<string, number> = {
  nose: 0,
  left_eye_inner: 1, left_eye: 2, left_eye_outer: 3,
  right_eye_inner: 4, right_eye: 5, right_eye_outer: 6,
  left_ear: 7, right_ear: 8,
  mouth_left: 9, mouth_right: 10,
  left_shoulder: 11, right_shoulder: 12,
  left_elbow: 13, right_elbow: 14,
  left_wrist: 15, right_wrist: 16,
  left_pinky: 17, right_pinky: 18,
  left_index: 19, right_index: 20,
  left_thumb: 21, right_thumb: 22,
  left_hip: 23, right_hip: 24,
  left_knee: 25, right_knee: 26,
  left_ankle: 27, right_ankle: 28,
  left_heel: 29, right_heel: 30,
  left_foot_index: 31, right_foot_index: 32,
};

/** Skeleton edges for drawing. */
export const SKELETON: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_heel'], ['left_heel', 'left_foot_index'], ['left_ankle', 'left_foot_index'],
  ['right_ankle', 'right_heel'], ['right_heel', 'right_foot_index'], ['right_ankle', 'right_foot_index'],
];

const MIDPOINTS: Record<string, [string, string]> = {
  mid_hip: ['left_hip', 'right_hip'],
  mid_shoulder: ['left_shoulder', 'right_shoulder'],
  mid_ankle: ['left_ankle', 'right_ankle'],
  mid_knee: ['left_knee', 'right_knee'],
  mid_wrist: ['left_wrist', 'right_wrist'],
  mid_elbow: ['left_elbow', 'right_elbow'],
  mid_ear: ['left_ear', 'right_ear'],
  mid_heel: ['left_heel', 'right_heel'],
};

export const MIN_VISIBILITY = 0.5;

/** Turns lead_/trail_ into left_/right_ for the given step side. */
export function resolveName(ref: JointRef, side: FrameContext['side'] = 'right'): string {
  const other = side === 'left' ? 'right' : 'left';
  if (ref.startsWith('lead_')) return `${side}_${ref.slice(5)}`;
  if (ref.startsWith('trail_')) return `${other}_${ref.slice(6)}`;
  return ref;
}

export function isKnownRef(ref: JointRef): boolean {
  const name = resolveName(ref, 'right');
  return name in LANDMARK_INDEX || name in MIDPOINTS;
}

export interface ResolvedPoint {
  /** Normalized image coords. */
  p: Pt;
  visibility: number;
}

export function getPoint(frame: PoseFrame, ref: JointRef, ctx: FrameContext): ResolvedPoint | null {
  const name = resolveName(ref, ctx.side);
  if (name in MIDPOINTS) {
    const [a, b] = MIDPOINTS[name];
    const pa = getPoint(frame, a, ctx);
    const pb = getPoint(frame, b, ctx);
    if (!pa || !pb) return null;
    // From the side, left and right overlap and the far one is often hidden:
    // then the visible one is a better midpoint than the average.
    if (ctx.view === 'side') {
      const [va, vb] = [pa.visibility >= MIN_VISIBILITY, pb.visibility >= MIN_VISIBILITY];
      if (va !== vb) return va ? pa : pb;
    }
    return {
      p: { x: (pa.p.x + pb.p.x) / 2, y: (pa.p.y + pb.p.y) / 2 },
      visibility: Math.min(pa.visibility, pb.visibility),
    };
  }
  const idx = LANDMARK_INDEX[name];
  if (idx === undefined) return null;
  const lm = frame[idx];
  if (!lm) return null;
  return { p: { x: lm.x, y: lm.y }, visibility: lm.visibility ?? 1 };
}
