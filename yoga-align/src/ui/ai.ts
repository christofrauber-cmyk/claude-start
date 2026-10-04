// Optional pose recognition in the cloud (opt-in). Sends one still image per
// hold to our own server, which asks a Claude vision model. No video, no
// landmarks, no names leave the device; the server stores nothing.
import { grabFrame } from './video';
import type { ViewName } from './state';

/** Server address, set at build time. Empty = feature not offered. */
export const AI_URL: string = (import.meta.env.VITE_CLASSIFY_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const aiAvailable = (): boolean => AI_URL !== '';

/** Below this confidence the app asks the user to check the pose. */
export const SURE = 0.6;

const KEY = 'yoga-align.ai-consent.v1';
export type Consent = 'yes' | 'no' | null;
let memo: Consent = null;

export function getConsent(): Consent {
  try { const v = localStorage.getItem(KEY); return v === 'yes' || v === 'no' ? v : null; } catch { return memo; }
}
export function setConsent(v: 'yes' | 'no'): void {
  memo = v;
  try { localStorage.setItem(KEY, v); } catch { /* private mode: lasts for this session */ }
}
export const aiEnabled = (): boolean => aiAvailable() && getConsent() === 'yes';

export interface AiAnswer {
  person_visible: boolean;
  pose_id: string;
  confidence: number;
  alternatives: { pose_id: string; confidence: number }[];
}

/** Still image of one moment: a small JPEG for the server plus a URL to show it. */
export interface Still { jpegB64: string; url: string }

const EDGE = 1024;

export async function grabStill(file: File, t: number): Promise<Still> {
  const big = await grabFrame(file, t);
  const s = Math.min(1, EDGE / Math.max(big.width, big.height));
  const c = document.createElement('canvas');
  c.width = Math.round(big.width * s);
  c.height = Math.round(big.height * s);
  c.getContext('2d')!.drawImage(big, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.8);
  return { jpegB64: dataUrl.slice(dataUrl.indexOf(',') + 1), url: dataUrl };
}

/** Asks the server. Returns null on any failure; the caller then falls back to local suggestions. */
export async function classifyStill(view: ViewName, still: Still): Promise<AiAnswer | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40000);
  try {
    const res = await fetch(`${AI_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: [{ view, data: still.jpegB64 }] }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const a = (await res.json()) as AiAnswer;
    return typeof a?.pose_id === 'string' && typeof a.confidence === 'number' ? a : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Runs tasks with limited parallelism, in order of the results. */
export async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
