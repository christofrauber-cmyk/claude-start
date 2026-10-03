import { evaluatePose, poseScore } from './engine';
import { detectLeadSide } from './side';
import { shapeFeatures, shapeFit } from './signature';
import type { FrameContext, PoseDef, PoseFrame, Rule, Side, View } from './types';

/**
 * Lead side for evaluating a sided pose: detected from the landmarks if
 * possible (robust against MediaPipe's left/right swaps), else the side the
 * user named for the step, else right.
 */
export function resolveSide(frame: PoseFrame, pose: PoseDef, ctx: FrameContext, named?: Side): Side {
  if (!pose.sided) return named ?? 'right';
  return (pose.sideCue && detectLeadSide(frame, pose.sideCue, ctx)) || named || 'right';
}

/**
 * 0..1: how much a (median) frame looks like the given pose. Mostly the
 * coarse shape signature, a little the school's rules for this view.
 */
export function poseFit(frame: PoseFrame, pose: PoseDef, rules: Rule[], view: View, ctx: FrameContext): number {
  const f = shapeFeatures(frame, ctx);
  const shape = f && pose.shape ? shapeFit(f, pose.shape) : 0.5;
  const side = resolveSide(frame, pose, ctx, ctx.side);
  const score = poseScore(evaluatePose(frame, rules, view, { ...ctx, side }));
  return 0.75 * shape + 0.25 * (score === null ? 0.5 : score / 100);
}
