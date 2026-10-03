import { h, fmt } from './dom';
import { go, state, type ViewData, type ViewName } from './state';
import { currentSequence } from './start';
import { extractPoses } from './video';
import { detectHolds, guessMatFront } from '../core/segmentation';
import { realign } from './align';

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
