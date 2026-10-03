import { getPoint, MIN_VISIBILITY } from './landmarks';
import type { FrameContext, PoseFrame, Side, SideCue } from './types';

/** Minimum difference between left and right before we trust the guess. */
const MIN_KNEE_DIFF = 15; // degrees
const MIN_HEIGHT_DIFF = 0.15; // torso lengths

/**
 * Which detected side is the lead side? Returns null when unsure.
 * This works on MediaPipe's left/right labels, so even when the model swaps
 * them (common in profile) the rules still measure the right leg.
 */
export function detectLeadSide(frame: PoseFrame, cue: SideCue, ctx: FrameContext): Side | null {
  const px = (ref: string) => {
    const r = getPoint(frame, ref, ctx);
    return r && r.visibility >= MIN_VISIBILITY ? { x: r.p.x * ctx.width, y: r.p.y * ctx.height } : null;
  };
  const kneeAngle = (s: Side) => {
    const h = px(`${s}_hip`), k = px(`${s}_knee`), a = px(`${s}_ankle`);
    if (!h || !k || !a) return null;
    const u = { x: h.x - k.x, y: h.y - k.y }, v = { x: a.x - k.x, y: a.y - k.y };
    const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1);
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  };
  const torso = () => {
    const s = px('mid_shoulder'), h = px('mid_hip');
    return s && h ? Math.hypot(s.x - h.x, s.y - h.y) : null;
  };
  const yOf = (ref: string) => px(ref)?.y ?? null;

  // Positive score → left is lead.
  let score: number | null = null;
  let min = 0;
  switch (cue) {
    case 'bentKnee':
    case 'straightKnee': {
      const l = kneeAngle('left'), r = kneeAngle('right');
      if (l === null || r === null) return null;
      score = cue === 'bentKnee' ? r - l : l - r;
      min = MIN_KNEE_DIFF;
      break;
    }
    case 'lowerAnkle':
    case 'higherAnkle':
    case 'lowerWrist': {
      const part = cue === 'lowerWrist' ? 'wrist' : 'ankle';
      const l = yOf(`left_${part}`), r = yOf(`right_${part}`), t = torso();
      if (l === null || r === null || !t) return null;
      // Image y points down: larger y = lower.
      score = (cue === 'higherAnkle' ? r - l : l - r) / t;
      min = MIN_HEIGHT_DIFF;
      break;
    }
  }
  if (score === null || Math.abs(score) < min) return null;
  return score > 0 ? 'left' : 'right';
}
