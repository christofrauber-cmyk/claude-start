import type { Sequence, Side } from '../core/types';
import type { Hold, TimedFrame } from '../core/segmentation';

export type Screen = 'start' | 'record' | 'analyze' | 'review' | 'results';

/** Sequence id for "no sequence, recognise the poses". */
export const AUTO_ID = 'auto';
export type ViewName = 'front' | 'side';

/** Analysis result of one uploaded video. */
export interface ViewData {
  file: File;
  width: number;
  height: number;
  duration: number;
  frames: TimedFrame[];
  /** All holds found in the video (before assigning them to steps). */
  allHolds: Hold[];
  /** One entry per sequence step (null = not found or not in this video). */
  holds: (Hold | null)[];
  /** Per step: is it contained in this video? */
  included: boolean[];
  /** Side view only: where the mat front is in the image. */
  matFront: 'left' | 'right';
  /** Manually chosen moment per step (seconds), if any. */
  overrides: (number | null)[];
  /** Auto mode, main video: holds were confirmed by the user, do not re-assign them. */
  fixed?: boolean;
}

/** Auto mode: one hold of the main video, waiting for the user's confirmation. */
export interface ReviewItem {
  /** Index into the main view's allHolds. */
  hold: number;
  /** Middle of the hold (seconds). */
  t: number;
  /** Still image shown to the user (data URL). */
  image: string;
  /** Chosen pose id, or null = not a pose / skip. */
  poseId: string | null;
  side?: Side;
  /** Shortlist to tap on, best first. */
  options: string[];
  /** Where the preselection came from, and whether the user should look at it. */
  source: 'ai' | 'local';
  unsure: boolean;
}

export interface AppState {
  screen: Screen;
  schoolId: string;
  sequenceId: string | null;
  files: Partial<Record<ViewName, File>>;
  /** Record screen: which steps each video contains (per view, one flag per step). */
  included: Partial<Record<ViewName, boolean[]>>;
  /** Sequence id the `included` flags belong to. */
  includedSeq: string | null;
  views: Partial<Record<ViewName, ViewData>>;
  stepIndex: number | null; // null = overview
  overlay: boolean;
  error: string | null;
  /** Sequence used for the current analysis (frozen at analysis start). */
  analyzed: Sequence | null;
  /** Auto mode: holds to confirm, and the video they come from. */
  review: ReviewItem[] | null;
  reviewView: ViewName | null;
  /** Auto mode: the AI could not be reached, local suggestions were used. */
  aiFailed: boolean;
}

export const state: AppState = {
  screen: 'start',
  schoolId: '',
  sequenceId: null,
  files: {},
  included: {},
  includedSeq: null,
  views: {},
  stepIndex: null,
  overlay: true,
  error: null,
  analyzed: null,
  review: null,
  reviewView: null,
  aiFailed: false,
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
