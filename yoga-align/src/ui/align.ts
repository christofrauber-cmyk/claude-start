import { SCHOOLS } from '../data/schools';
import { POSE_BY_ID } from '../data/poses';
import { medianFrame } from '../core/engine';
import { poseFit } from '../core/match';
import { alignHolds, type Hold } from '../core/segmentation';
import type { FrameContext, PoseFrame, SequenceStep } from '../core/types';
import type { ViewData, ViewName } from './state';
import { state } from './state';

const medians = new WeakMap<Hold, PoseFrame>();

/** Median frame of a hold, cached. */
export function holdMedian(hold: Hold): PoseFrame {
  let m = medians.get(hold);
  if (!m) { m = medianFrame(hold.frames.map((f) => f.frame!)); medians.set(hold, m); }
  return m;
}

/**
 * Assigns the video's holds to the steps contained in this video (checked
 * steps only), by order and by how well each hold fits the step's pose under
 * the current school. Manually chosen moments (vd.overrides) are untouched.
 */
export function realign(vd: ViewData, view: ViewName, steps: SequenceStep[]): void {
  const school = SCHOOLS.find((s) => s.id === state.schoolId) ?? SCHOOLS[0];
  const idx = steps.map((_, i) => i).filter((i) => vd.included[i] !== false);
  const aligned = alignHolds(vd.allHolds, idx.length, (hold, k) => {
    const step = steps[idx[k]];
    const pose = POSE_BY_ID[step.poseId];
    if (!pose) return 0.5;
    const ctx: FrameContext = { width: vd.width, height: vd.height, matFront: view === 'side' ? vd.matFront : undefined, side: step.side };
    return poseFit(holdMedian(hold), pose, school?.rules[step.poseId] ?? [], view, ctx);
  });
  vd.holds = steps.map(() => null);
  idx.forEach((si, k) => { vd.holds[si] = aligned[k]; });
}
