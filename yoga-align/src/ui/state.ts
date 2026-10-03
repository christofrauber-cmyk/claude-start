import type { Sequence } from '../core/types';
import type { Hold, TimedFrame } from '../core/segmentation';

export type Screen = 'start' | 'record' | 'analyze' | 'results';
export type ViewName = 'front' | 'side';

/** Analysis result of one uploaded video. */
export interface ViewData {
  file: File;
  width: number;
  height: number;
  duration: number;
  frames: TimedFrame[];
  /** One entry per sequence step (null = not found). */
  holds: (Hold | null)[];
  /** Side view only: where the mat front is in the image. */
  matFront: 'left' | 'right';
  /** Manually chosen moment per step (seconds), if any. */
  overrides: (number | null)[];
}

export interface AppState {
  screen: Screen;
  schoolId: string;
  sequenceId: string | null;
  files: Partial<Record<ViewName, File>>;
  views: Partial<Record<ViewName, ViewData>>;
  stepIndex: number | null; // null = overview
  overlay: boolean;
  error: string | null;
  /** Sequence used for the current analysis (frozen at analysis start). */
  analyzed: Sequence | null;
}

export const state: AppState = {
  screen: 'start',
  schoolId: '',
  sequenceId: null,
  files: {},
  views: {},
  stepIndex: null,
  overlay: true,
  error: null,
  analyzed: null,
};

let renderFn: () => void = () => {};
export function setRender(fn: () => void) { renderFn = fn; }
export function rerender() { renderFn(); }
export function go(screen: Screen) {
  state.screen = screen;
  window.scrollTo(0, 0);
  renderFn();
}

// ----- custom sequences (localStorage, may be unavailable) -----

const KEY = 'yoga-align.sequences.v1';

export function loadCustomSequences(): Sequence[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as Sequence[]).filter((s) => s && Array.isArray(s.steps)) : [];
  } catch {
    return [];
  }
}

export function saveCustomSequences(list: Sequence[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
