// Tiny DOM helper: h('div', {class: 'x', onclick: fn}, 'text', child)
type Child = Node | string | number | null | undefined | false | Child[];
type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k in el && k !== 'list') (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** German number format with fixed decimals. */
export const fmt = (n: number, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtSigned = (n: number, d = 2) => (n >= 0 ? '+' : '−') + fmt(Math.abs(n), d);

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${fmt(s - m * 60, 1).padStart(4, '0')}`;
}

/** Torso (shoulder to hip) of an adult is roughly 50 cm; good enough for a hint. */
export const TORSO_CM = 50;
/** Offset in torso lengths as approximate centimetres, e.g. "≈ 15 cm". */
export const fmtCm = (torsoLengths: number, signed = false) => {
  const cm = Math.round(torsoLengths * TORSO_CM);
  return `≈ ${signed && cm > 0 ? '+' : cm < 0 ? '−' : ''}${Math.abs(cm)} cm`;
};
