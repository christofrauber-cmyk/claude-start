import { h, fmt } from './dom';
import { AUTO_ID, go, state, type ReviewItem, type ViewData, type ViewName } from './state';
import { currentSequence } from './start';
import { extractPoses } from './video';
import { detectHolds, guessMatFront, type Hold } from '../core/segmentation';
import { holdMedian, realign } from './align';
import { suggestPoses } from '../core/match';
import { POSES } from '../data/poses';
import { SCHOOLS } from '../data/schools';
import { aiEnabled, classifyStill, grabStill, pool, SURE, type AiAnswer } from './ai';
import type { FrameContext } from '../core/types';

let running = false;

export function renderAnalyze(): HTMLElement {
  const bar = h('progress', { max: 1, value: 0 });
  const text = h('p', { class: 'muted' }, 'Vorbereitung …');
  const err = h('div', { class: 'notice err', hidden: true });
  const back = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => go('record') }, 'Zurück');

  const root = h('div', { class: 'stack' },
    h('h1', {}, 'Analyse läuft'),
    h('p', {}, 'Die Videos werden lokal im Browser ausgewertet. Das kann je nach Gerät und Videolänge einige Minuten dauern. Bitte diesen Tab geöffnet lassen.'),
    bar, text, err, back);

  if (!running) {
    running = true;
    void run(bar, text).catch((e: unknown) => {
      err.hidden = false;
      err.textContent = e instanceof Error
        ? e.message
        // MediaPipe/network failures surface as bare Events (e.g. script or model load error).
        : 'Das Erkennungsmodell konnte nicht geladen werden. Bitte Internetverbindung prüfen und erneut versuchen (nur das Modell wird geladen, das Video bleibt auf dem Gerät).';
      text.textContent = 'Die Analyse ist fehlgeschlagen.';
      back.hidden = false;
    }).finally(() => { running = false; });
  }
  return root;
}

async function run(bar: HTMLProgressElement, text: HTMLElement): Promise<void> {
  if (state.sequenceId === AUTO_ID) return runAuto(bar, text);
  const seq = currentSequence();
  if (!seq) throw new Error('Kein Ablauf gewählt.');
  const views: ViewName[] = (['front', 'side'] as const).filter((v) => state.files[v]);
  const labels = { front: 'Frontaufnahme', side: 'Seitenaufnahme' };
  const result: Partial<Record<ViewName, ViewData>> = {};

  for (let i = 0; i < views.length; i++) {
    const v = views[i];
    const file = state.files[v]!;
    const ex = await extractPoses(file, (f) => {
      bar.value = (i + f) / views.length;
      text.textContent = `${labels[v]}: ${fmt(f * 100)} %`;
    });
    if (!ex.frames.some((f) => f.frame)) throw new Error(`In der ${labels[v]} wurde keine Person erkannt. Ist der ganze Körper im Bild?`);
    const flags = state.included[v];
    const vd: ViewData = {
      file, width: ex.width, height: ex.height, duration: ex.duration, frames: ex.frames,
      allHolds: detectHolds(ex.frames, { aspect: ex.width / ex.height }),
      holds: seq.steps.map(() => null),
      included: seq.steps.map((_, k) => flags?.[k] !== false),
      matFront: v === 'side' ? guessMatFront(ex.frames) : 'right',
      overrides: seq.steps.map(() => null),
    };
    realign(vd, v, seq.steps);
    result[v] = vd;
  }
  state.views = result;
  state.analyzed = seq;
  state.stepIndex = null;
  go('results');
}

/** In auto mode, holds shorter than this are treated as transitions. */
const MIN_HOLD_S = 1.5;
/** Neighbouring holds with the same recognised pose and at most this gap are one hold. */
const JOIN_GAP_S = 3;

/**
 * Auto mode (no sequence given): find the holds, guess each pose (cloud AI if
 * the user agreed, else locally from the body shape), then let the user
 * confirm on the review screen.
 */
async function runAuto(bar: HTMLProgressElement, text: HTMLElement): Promise<void> {
  const views: ViewName[] = (['front', 'side'] as const).filter((v) => state.files[v]);
  const labels = { front: 'Frontaufnahme', side: 'Seitenaufnahme' };
  const result: Partial<Record<ViewName, ViewData>> = {};
  const share = 0.8; // of the progress bar for pose extraction

  for (let i = 0; i < views.length; i++) {
    const v = views[i];
    const file = state.files[v]!;
    const ex = await extractPoses(file, (f) => {
      bar.value = ((i + f) / views.length) * share;
      text.textContent = `${labels[v]}: ${fmt(f * 100)} %`;
    });
    if (!ex.frames.some((f) => f.frame)) throw new Error(`In der ${labels[v]} wurde keine Person erkannt. Ist der ganze Körper im Bild?`);
    const all = detectHolds(ex.frames, { aspect: ex.width / ex.height });
    const long = all.filter((h) => h.end - h.start >= MIN_HOLD_S);
    result[v] = {
      file, width: ex.width, height: ex.height, duration: ex.duration, frames: ex.frames,
      allHolds: long.length ? long : all,
      holds: [], included: [], overrides: [],
      matFront: v === 'side' ? guessMatFront(ex.frames) : 'right',
    };
  }

  // The video with the most holds sets the sequence; the other one is matched to it.
  const main = views.reduce((a, b) => (result[b]!.allHolds.length > result[a]!.allHolds.length ? b : a));
  const vd = result[main]!;
  if (!vd.allHolds.length) throw new Error('Im Video wurde keine ruhig gehaltene Haltung gefunden. Bitte jede Haltung einige Sekunden still halten.');

  const school = SCHOOLS.find((s) => s.id === state.schoolId) ?? SCHOOLS[0];
  const ctx: FrameContext = { width: vd.width, height: vd.height, matFront: main === 'side' ? vd.matFront : undefined };
  const useAi = aiEnabled();
  let done = 0;
  let failed = 0;
  text.textContent = useAi ? 'Haltungen werden erkannt …' : 'Haltungen werden verglichen …';

  const items = await pool(vd.allHolds, 3, async (hold: Hold, k): Promise<ReviewItem> => {
    const t = (hold.start + hold.end) / 2;
    const still = await grabStill(vd.file, t);
    const local = suggestPoses(holdMedian(hold), POSES, (id) => school?.rules[id] ?? [], main, ctx).map((s) => s.poseId);
    const ai: AiAnswer | null = useAi ? await classifyStill(main, still) : null;
    if (useAi && !ai) failed++;
    bar.value = share + ((++done) / vd.allHolds.length) * (1 - share);
    return toItem(k, t, still.url, ai, local);
  });

  // A hold is often split by a small wobble; join neighbours showing the same pose.
  const holds: Hold[] = [];
  const joined: ReviewItem[] = [];
  items.forEach((it, k) => {
    const h = vd.allHolds[k];
    const prev = joined[joined.length - 1];
    const ph = holds[holds.length - 1];
    if (prev && it.poseId && prev.poseId === it.poseId && h.start - ph.end <= JOIN_GAP_S) {
      const longer = h.end - h.start > ph.end - ph.start;
      holds[holds.length - 1] = { start: ph.start, end: h.end, frames: [...ph.frames, ...h.frames] };
      if (longer) { prev.image = it.image; prev.t = it.t; }
      prev.unsure = prev.unsure && it.unsure;
    } else {
      holds.push(h);
      joined.push({ ...it, hold: holds.length - 1 });
    }
  });
  vd.allHolds = holds;

  state.views = result;
  state.review = joined;
  state.reviewView = main;
  state.aiFailed = useAi && failed > 0;
  state.analyzed = null;
  state.stepIndex = null;
  go('review');
}

function toItem(hold: number, t: number, image: string, ai: AiAnswer | null, local: string[]): ReviewItem {
  const known = (id: string) => POSES.some((p) => p.id === id);
  if (ai && ai.pose_id !== 'unknown' && known(ai.pose_id)) {
    const options = [...new Set([ai.pose_id, ...ai.alternatives.map((a) => a.pose_id).filter(known), ...local])].slice(0, 4);
    return { hold, t, image, poseId: ai.pose_id, options, source: 'ai', unsure: ai.confidence < SURE || !ai.person_visible };
  }
  const options = [...new Set([...(ai?.alternatives.map((a) => a.pose_id).filter(known) ?? []), ...local])].slice(0, 4);
  // The AI said "no pose" (e.g. a transition): suggest skipping it.
  const skip = !!ai && ai.pose_id === 'unknown' && ai.confidence >= SURE;
  return { hold, t, image, poseId: skip ? null : options[0] ?? null, options, source: ai ? 'ai' : 'local', unsure: true };
}
