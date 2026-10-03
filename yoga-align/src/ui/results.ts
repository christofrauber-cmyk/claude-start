import { h, fmt, fmtSigned, fmtTime } from './dom';
import { go, rerender, state, type ViewName } from './state';
import { SCHOOLS } from '../data/schools';
import { POSE_BY_ID } from '../data/poses';
import { evaluatePose, medianFrame, poseScore } from '../core/engine';
import { bestFrame } from '../core/segmentation';
import type { FrameContext, PoseFrame, Rule, RuleResult, SequenceStep, Status } from '../core/types';
import { drawOverlay, STATUS_COLOR } from './overlay';
import { grabFrame, releaseVideo } from './video';
import { stepLabel } from './start';

const VIEWS: ViewName[] = ['front', 'side'];
const VIEW_DE: Record<ViewName, string> = { front: 'Vorne', side: 'Seite' };
const ONLY_WITH: Record<ViewName, string> = { front: 'nur mit Frontaufnahme messbar', side: 'nur mit Seitenaufnahme messbar' };
const STATUS_DE: Record<Status, string> = { ok: 'passt', minor: 'leicht daneben', major: 'deutlich daneben', unmeasurable: 'nicht erkennbar' };
/** Window around a manually chosen moment. */
const WINDOW_S = 1;

const school = () => SCHOOLS.find((s) => s.id === state.schoolId) ?? SCHOOLS[0];
const steps = (): SequenceStep[] => state.analyzed?.steps ?? [];

// ----- evaluation -----

interface StepEval {
  /** Time of the screenshot; null if no hold was found and nothing was chosen. */
  t: number | null;
  frame: PoseFrame | null;
  results: RuleResult[];
  rules: Rule[];
}

function evalStep(view: ViewName, i: number): StepEval {
  const vd = state.views[view]!;
  const step = steps()[i];
  const rules = (school().rules[step.poseId] ?? []).filter((r) => r.view === view);
  const ctx: FrameContext = { width: vd.width, height: vd.height, matFront: view === 'side' ? vd.matFront : undefined, side: step.side };

  const override = vd.overrides[i];
  const hold = vd.holds[i];
  let t: number | null = null;
  let frames: PoseFrame[] = [];
  if (override !== null) {
    t = override;
    frames = vd.frames.filter((f) => f.frame && Math.abs(f.t - override) <= WINDOW_S).map((f) => f.frame!);
    if (!frames.length) {
      const near = vd.frames.filter((f) => f.frame).sort((a, b) => Math.abs(a.t - override) - Math.abs(b.t - override))[0];
      if (near) frames = [near.frame!];
    }
  } else if (hold) {
    t = bestFrame(hold).t;
    frames = hold.frames.filter((f) => f.frame).map((f) => f.frame!);
  }
  if (!frames.length) return { t, frame: null, results: [], rules };
  const frame = medianFrame(frames);
  return { t, frame, results: evaluatePose(frame, rules, view, ctx), rules };
}

const scoreOf = (e: StepEval) => (e.frame ? poseScore(e.results) : null);
const scoreClass = (s: number | null) => (s === null ? 'none' : s >= 80 ? 'ok' : s >= 50 ? 'minor' : 'major');

// ----- screen -----

export function renderResults(): HTMLElement {
  const present = VIEWS.filter((v) => state.views[v]);
  const side = state.views.side;
  const i = state.stepIndex;

  const schoolSel = h('select', {
    'aria-label': 'Schule',
    onchange: (e: Event) => { state.schoolId = (e.target as HTMLSelectElement).value; rerender(); },
  }, SCHOOLS.map((s) => h('option', { value: s.id, selected: s.id === state.schoolId }, s.name)));

  const controls = h('div', { class: 'card controls stack-s' },
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'Schule'), schoolSel, h('span', { class: 'tag warn' }, school()?.status ?? '')),
    h('label', { class: 'row check' },
      h('input', { type: 'checkbox', checked: state.overlay, onchange: (e: Event) => { state.overlay = (e.target as HTMLInputElement).checked; rerender(); } }),
      'Overlay ein'),
    side ? h('div', { class: 'row' },
      h('span', { class: 'lbl' }, 'Mattenvorderkante im Bild (Seite)'),
      h('div', { class: 'seg' }, (['left', 'right'] as const).map((m) =>
        h('button', {
          type: 'button', class: side.matFront === m ? 'on' : '', 'aria-pressed': side.matFront === m,
          onclick: () => { side.matFront = m; rerender(); },
        }, m === 'left' ? 'links' : 'rechts'))),
    ) : null,
  );

  const head = h('div', { class: 'row between' },
    h('h1', {}, 'Ergebnis'),
    h('button', { class: 'link', type: 'button', onclick: newAnalysis }, 'Neue Analyse'),
  );

  if (i === null) return h('div', { class: 'stack' }, head, controls, overview(present));
  return h('div', { class: 'stack' }, head, controls, detail(i, present));
}

function newAnalysis() {
  for (const v of VIEWS) { const f = state.files[v]; if (f) releaseVideo(f); }
  state.files = {};
  state.views = {};
  state.stepIndex = null;
  go('start');
}

function badge(score: number | null, prefix?: string): HTMLElement {
  return h('span', { class: `badge ${scoreClass(score)}` }, prefix ? `${prefix} ` : '', score === null ? '–' : `${score}`);
}

function overview(present: ViewName[]): HTMLElement {
  const rows = steps().map((s, i) => {
    const p = POSE_BY_ID[s.poseId];
    const badges = present.map((v) => {
      const e = evalStep(v, i);
      const hasRules = e.rules.length > 0;
      if (!e.frame) return h('span', { class: 'badge none' }, VIEW_DE[v], ' nicht gefunden');
      return hasRules ? badge(scoreOf(e), VIEW_DE[v]) : h('span', { class: 'badge none' }, VIEW_DE[v], ' ohne Regeln');
    });
    return h('li', {},
      h('button', { class: 'card step', type: 'button', onclick: () => { state.stepIndex = i; rerender(); window.scrollTo(0, 0); } },
        h('span', { class: 'num' }, i + 1),
        h('span', { class: 'grow' },
          h('strong', {}, stepLabel(s)),
          h('span', { class: 'muted block' }, p?.sanskrit ?? '')),
        h('span', { class: 'badges' }, badges),
      ));
  });
  return h('section', { class: 'stack-s' },
    h('p', { class: 'muted' }, 'Punktzahl 0–100 pro Ansicht: Anteil der Regeln, die passen (gewichtet). Tippe auf eine Haltung für Details.'),
    h('ol', { class: 'list plain' }, rows),
    h('p', { class: 'muted' }, 'Die Zahlen sind eine grobe Orientierung aus einem 2D-Video, keine Bewertung deiner Praxis.'),
  );
}

function detail(i: number, present: ViewName[]): HTMLElement {
  const s = steps()[i];
  const p = POSE_BY_ID[s.poseId];
  const nav = h('div', { class: 'row between' },
    h('button', { class: 'btn', type: 'button', disabled: i === 0, onclick: () => { state.stepIndex = i - 1; rerender(); } }, '← Zurück'),
    h('button', { class: 'link', type: 'button', onclick: () => { state.stepIndex = null; rerender(); } }, 'Übersicht'),
    h('button', { class: 'btn', type: 'button', disabled: i === steps().length - 1, onclick: () => { state.stepIndex = i + 1; rerender(); } }, 'Weiter →'),
  );
  const nav2 = nav.cloneNode(true) as HTMLElement;
  nav2.querySelectorAll('button').forEach((b, k) => { const src = nav.querySelectorAll('button')[k]; b.onclick = () => src.click(); });
  const sections = VIEWS.map((v) => (state.views[v] ? viewSection(v, i) : missingSection(v, i)));
  return h('div', { class: 'stack' },
    nav,
    h('div', {},
      h('h2', {}, `${i + 1}. ${stepLabel(s)}`),
      h('p', { class: 'muted' }, p?.sanskrit, ' · ', p?.nameEn),
      p?.limits ? h('p', { class: 'muted' }, 'Grenzen: ', p.limits) : null,
      present.length === 1 && p && p.bestViews[0] !== present[0]
        ? h('p', { class: 'notice' }, `Für diese Haltung wäre die ${VIEW_DE[p.bestViews[0]]}-Ansicht am aussagekräftigsten – sie fehlt.`)
        : null),
    ...sections,
    nav2,
  );
}

function missingSection(v: ViewName, i: number): HTMLElement {
  const rules = (school().rules[steps()[i].poseId] ?? []).filter((r) => r.view === v);
  return h('section', { class: 'card stack-s' },
    h('h3', {}, `Ansicht ${VIEW_DE[v]}`),
    h('p', { class: 'muted' }, `Kein ${v === 'front' ? 'Front' : 'Seiten'}video hochgeladen.`),
    rules.length
      ? h('ul', { class: 'rules' }, rules.map((r) => h('li', { class: 'rule' }, h('strong', {}, r.label), ' ', h('span', { class: 'muted' }, ONLY_WITH[v]))))
      : h('p', { class: 'muted' }, 'In dieser Ansicht gibt es für diese Haltung keine Regeln.'),
  );
}

// ----- one view of one step -----

function viewSection(v: ViewName, i: number): HTMLElement {
  const vd = state.views[v]!;
  const canvas = h('canvas', { class: 'shot', role: 'img', 'aria-label': `Aufnahme ${VIEW_DE[v]}` });
  const note = h('p', { class: 'muted' });
  const list = h('div', {});
  const timeLabel = h('span', { class: 'muted' });
  let token = 0;

  const slider = h('input', {
    type: 'range', min: 0, max: Math.max(0.1, vd.duration), step: 0.1, 'aria-label': `Zeitpunkt ${VIEW_DE[v]}`,
    oninput: () => { timeLabel.textContent = fmtTime(parseFloat(slider.value)); },
    onchange: () => { vd.overrides[i] = parseFloat(slider.value); void update(); },
  });
  const reset = h('button', { class: 'link', type: 'button', onclick: () => { vd.overrides[i] = null; void update(); } }, 'Automatisch');

  async function update() {
    const my = ++token;
    const e = evalStep(v, i);
    const t = e.t ?? 0;
    slider.value = String(t);
    timeLabel.textContent = fmtTime(t);
    reset.hidden = vd.overrides[i] === null;
    renderRules(list, e);
    note.textContent = e.frame
      ? (vd.overrides[i] !== null ? `Manuell gewählter Moment, ausgewertet über ±${WINDOW_S} s.` : 'Automatisch erkannte Haltung.')
      : 'Für diese Haltung wurde im Video nichts gefunden. Wähle mit dem Regler den Moment, in dem du in der Haltung bist.';
    if (e.t === null) { canvas.hidden = true; return; }
    try {
      const img = await grabFrame(vd.file, e.t);
      if (my !== token) return;
      canvas.hidden = false;
      drawOverlay(canvas.getContext('2d')!, img, e.frame, e.results, { width: img.width, height: img.height, showOverlay: state.overlay });
    } catch (err) {
      note.textContent = err instanceof Error ? err.message : String(err);
    }
  }
  void update();

  return h('section', { class: 'card stack-s' },
    h('h3', {}, `Ansicht ${VIEW_DE[v]}`),
    canvas,
    note,
    h('div', { class: 'row timeline' }, h('span', { class: 'lbl' }, 'Moment'), slider, timeLabel, reset),
    list,
  );
}

function rangeText(r: Rule): string {
  const [lo, hi] = r.range;
  if (r.measure.kind === 'offset') return `${fmtSigned(lo)} bis ${fmtSigned(hi)} T`;
  return `${fmt(lo)}–${fmt(hi)}°`;
}
function valueText(r: Rule, val: number): string {
  return r.measure.kind === 'offset' ? `${fmtSigned(val)} T` : `${fmt(val)}°`;
}

function renderRules(into: HTMLElement, e: StepEval) {
  into.replaceChildren();
  if (!e.rules.length) {
    into.append(h('p', { class: 'muted' }, 'Für diese Haltung gibt es in dieser Ansicht keine Regeln in der gewählten Schule.'));
    return;
  }
  // Without a pose every rule is "not recognisable".
  const results: RuleResult[] = e.frame ? e.results : e.rules.map((rule) => ({ rule, status: 'unmeasurable' as const }));
  const score = scoreOf(e);
  into.append(
    h('div', { class: 'row between' }, h('strong', {}, 'Regeln'), badge(score)),
    h('ul', { class: 'rules' }, results.map((r) => {
      const st = r.status;
      return h('li', { class: `rule ${st}` },
        h('div', { class: 'row' },
          h('span', { class: 'dot', style: `background:${STATUS_COLOR[st]}` }),
          h('strong', { class: 'grow' }, r.rule.label),
          h('span', { class: `chip ${st}` }, STATUS_DE[st])),
        st === 'unmeasurable'
          ? h('p', { class: 'muted' }, 'nicht erkennbar (verdeckt/unsicher)')
          : h('p', { class: 'muted' }, `Gemessen ${valueText(r.rule, r.value!)} · Soll ${rangeText(r.rule)}`),
        r.cue ? h('p', { class: 'cue' }, r.cue) : null,
        r.rule.why ? h('details', {}, h('summary', {}, 'Warum?'), h('p', {}, r.rule.why)) : null,
      );
    })),
    h('p', { class: 'muted small' }, 'T = Torsolänge (Schulter bis Hüfte).'),
  );
}
