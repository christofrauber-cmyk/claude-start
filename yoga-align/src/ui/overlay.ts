import { LANDMARK_INDEX, SKELETON } from '../core/landmarks';
import type { PoseFrame, Pt, RuleResult, Status } from '../core/types';

export interface OverlayOptions {
  /** Natural size to draw at (canvas is resized to it). */
  width: number;
  height: number;
  /** false → only the image. */
  showOverlay: boolean;
  /** Draw the measured skeleton (default true). */
  showSkeleton?: boolean;
}

export const STATUS_COLOR: Record<Status, string> = {
  ok: '#22a559',
  minor: '#eaa81b',
  major: '#dc3a3a',
  unmeasurable: '#9aa0a6',
};
const IDEAL = '#35d07f';

/**
 * Draws the image and, optionally, skeleton + rule visuals.
 * Pure with respect to its inputs: everything is sized relative to the image.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frame: PoseFrame | null,
  results: RuleResult[],
  opts: OverlayOptions,
): void {
  const W = opts.width, H = opts.height;
  if (ctx.canvas.width !== W) ctx.canvas.width = W;
  if (ctx.canvas.height !== H) ctx.canvas.height = H;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(image, 0, 0, W, H);
  if (!opts.showOverlay) return;

  const lw = Math.max(2, Math.max(W, H) * 0.0035);
  const font = Math.max(13, Math.min(W, H) * 0.036);
  const px = (p: Pt): [number, number] => [p.x * W, p.y * H];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Measured skeleton, thin.
  if (frame && opts.showSkeleton !== false) {
    ctx.lineWidth = lw * 0.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = lw;
    ctx.beginPath();
    for (const [a, b] of SKELETON) {
      const la = frame[LANDMARK_INDEX[a]], lb = frame[LANDMARK_INDEX[b]];
      if (!la || !lb || la.visibility < 0.3 || lb.visibility < 0.3) continue;
      ctx.moveTo(la.x * W, la.y * H);
      ctx.lineTo(lb.x * W, lb.y * H);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const line = (a: Pt, b: Pt, color: string, width: number, dash: number[] = []) => {
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(...px(a));
    ctx.lineTo(...px(b));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const dot = (p: Pt, r: number, fill: string | null, stroke?: string) => {
    ctx.beginPath();
    ctx.arc(...px(p), r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const arrow = (from: Pt, to: Pt, color: string) => {
    const [x1, y1] = px(from), [x2, y2] = px(to);
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < lw * 4) return;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.min(L * 0.5, lw * 5);
    ctx.lineWidth = lw;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    ctx.stroke();
  };
  const label = (at: Pt, text: string, color: string) => {
    ctx.font = `600 ${font}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const padX = font * 0.45, bh = font * 1.5;
    let x = at.x * W + font * 0.6, y = at.y * H - font * 1.1;
    x = Math.min(Math.max(x, 2), W - tw - padX * 2 - 2);
    y = Math.min(Math.max(y, bh / 2 + 2), H - bh / 2 - 2);
    ctx.fillStyle = 'rgba(20,24,28,0.78)';
    ctx.beginPath();
    ctx.roundRect(x, y - bh / 2, tw + padX * 2, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x + padX, y + 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + padX * 0.55, y - bh / 2 + bh * 0.2, font * 0.12, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw ok first so problems end up on top.
  const order: Status[] = ['ok', 'minor', 'major'];
  const sorted = results.filter((r) => r.visual && r.value !== undefined).sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  for (const r of sorted) {
    const v = r.visual!;
    const color = STATUS_COLOR[r.status];
    const bad = r.status === 'minor' || r.status === 'major';
    const dash = [lw * 3, lw * 2.5];
    let anchor: Pt;
    let text: string;

    if (v.type === 'angle') {
      if (v.idealC) line(v.b, v.idealC, IDEAL, lw, dash);
      line(v.b, v.a, color, lw * 1.6);
      line(v.b, v.c, color, lw * 1.6);
      if (bad && v.idealC) arrow(v.c, v.idealC, color);
      dot(v.b, lw * 1.8, color);
      anchor = v.b;
      text = `${Math.round(v.value)}°`;
    } else if (v.type === 'segment') {
      if (v.idealTo) line(v.from, v.idealTo, IDEAL, lw, dash);
      line(v.from, v.to, color, lw * 1.6);
      if (bad && v.idealTo) arrow(v.to, v.idealTo, color);
      dot(v.from, lw * 1.4, color);
      anchor = { x: (v.from.x + v.to.x) / 2, y: (v.from.y + v.to.y) / 2 };
      text = `${Math.round(v.value)}°`;
    } else {
      if (v.idealA) {
        dot(v.idealA, lw * 2.4, null, IDEAL);
      }
      line(v.a, v.b, color, lw, [lw, lw * 2]);
      dot(v.b, lw * 1.4, null, color);
      dot(v.a, lw * 2, color);
      if (bad && v.idealA) arrow(v.a, v.idealA, color);
      anchor = v.a;
      text = `${v.value >= 0 ? '+' : '−'}${Math.abs(v.value).toFixed(2).replace('.', ',')} T`;
    }
    label(anchor, text, color);
  }
  ctx.restore();
}
