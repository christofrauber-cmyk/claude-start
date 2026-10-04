import { h, fmt, fmtCm, fmtTime } from './dom';
import { go, rerender, state, type ViewName } from './state';
import { SCHOOLS } from '../data/schools';
import { POSE_BY_ID } from '../data/poses';
import { evaluatePose, medianFrame, poseScore } from '../core/engine';
import { bestFrame } from '../core/segmentation';
import { resolveSide } from '../core/match';
import { detectLeadSide } from '../core/side';
import { realign } from './align';
import type { FrameContext, PoseFrame, Rule, RuleResult, SequenceStep, Side, Status } from '../core/types';
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
const isDraft = (poseId: string) => !!school().draftPoseIds?.includes(poseId);
const steps = (): SequenceStep[] => state.analyzed?.steps ?? [];

// ----- evaluation -----

interface StepEval {
  /** Time of the screenshot; null if no hold was found and nothing was chosen. */
  t: number | null;
  frame: PoseFrame | null;
  results: RuleResult[];
  rules: Rule[];
  /** Step is not part of this view's video. */
  excluded?: boolean;
  /** Side used for evaluation (sided poses only) and what the landmarks said. */
  side?: Side;
  detected?: Side | null;
}

const SIDE_DE: Record<Side, string> = { left: 'links', right: 'rechts' };

function evalStep(view: ViewName, i: number): StepEval {
  const vd = state.views[view]!;
  const step = steps()[i];
  const rules = (school().rules[step.poseId] ?? []).filter((r) => r.view === view);
  const ctx: FrameContext = { width: vd.width, height: vd.height, matFront: view === 'side' ? vd.matFront : undefined, side: step.side };

  if (vd.included[i] === false) return { t: null, frame: null, results: [], rules, excluded: true };
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
  const pose = POSE_BY_ID[step.poseId];
  if (pose?.sided) {
    const detected = pose.sideCue ? detectLeadSide(frame, pose.sideCue, ctx) : null;
    const side = resolveSide(frame, pose, ctx, step.side);
    return { t, frame, results: evaluatePose(frame, rules, view, { ...ctx, side }), rules, side, detected };
  }
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
    onchange: (e: Event) => { state.schoolId = (e.target as HTMLSelectElement).value; realignAll(); rerender(); },
  }, SCHOOLS.map((s) => h('option', { value: s.id, selected: s.id === state.schoolId }, s.name)));

  const controls = h('div', { class: 'card controls stack-s' },
    h('div', { class: 'row' }, h('span', { class: 'lbl' }, 'Schule'), schoolSel, h('span', { class: /Entwurf/.test(school()?.status ?? '') ? 'tag warn' : 'tag' }, school()?.status ?? '')),
    h('label', { class: 'row check' },
      h('input', { type: 'checkbox', checked: state.overlay, onchange: (e: Event) => { state.overlay = (e.target as HTMLInputElement).checked; rerender(); } }),
      'Overlay ein'),
    side ? h('div', { class: 'row' },
      h('span', { class: 'lbl' }, 'Mattenvorderkante im Bild (Seite)'),
      h('div', { class: 'seg' }, (['left', 'right'] as const).map((m) =>
        h('button', {
          type: 'button', class: side.matFront === m ? 'on' : '', 'aria-pressed': side.matFront === m,
          onclick: () => { side.matFront = m; realign(side, 'side', steps()); rerender(); },
        }, m === 'left' ? 'links' : 'rechts'))),
    ) : null,
  );

  const head = h('div', { class: 'row between' },
    h('h1', {}, 'Ergebnis'),
    h('div', { class: 'row' },
      state.review ? h('button', { class: 'link', type: 'button', onclick: () => go('review') }, 'Haltungen ändern') : null,
      h('button', { class: 'link', type: 'button', onclick: newAnalysis }, 'Neue Analyse'),
    ),
  );

  if (i === null) return h('div', { class: 'stack' }, head, controls, overview(present));
  return h('div', { class: 'stack' }, head, controls, detail(i, present));
}

function realignAll() {
  for (const v of VIEWS) { const vd = state.views[v]; if (vd) realign(vd, v, steps()); }
}

function newAnalysis() {
  for (const v of VIEWS) { const f = state.files[v]; if (f) releaseVideo(f); }
  state.files = {};
  state.included = {};
  state.views = {};
  state.stepIndex = null;
  state.review = null;
  state.reviewView = null;
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
      if (e.excluded) return h('span', { class: 'badge none' }, VIEW_DE[v], ' –');
      if (!e.frame) return h('span', { class: 'badge none' }, VIEW_DE[v], ' nicht gefunden');
      return hasRules ? badge(scoreOf(e), VIEW_DE[v]) : h('span', { class: 'badge none' }, VIEW_DE[v], ' ohne Regeln');
    });
    const auto = !s.side && p?.sided
      ? present.map((v) => evalStep(v, i)).find((e) => e.frame && e.detected)?.detected
      : null;
    return h('li', {},
      h('button', { class: 'card step', type: 'button', onclick: () => { state.stepIndex = i; rerender(); window.scrollTo(0, 0); } },
        h('span', { class: 'num' }, i + 1),
        h('span', { class: 'grow' },
          h('strong', {}, stepLabel(s)), isDraft(s.poseId) ? h('span', { class: 'tag warn' }, 'Regeln: Entwurf') : null,
          h('span', { class: 'muted block' }, p?.sanskrit ?? '', auto ? ` · Seite: ${SIDE_DE[auto]} (erkannt)` : '')),
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
  const sections = VIEWS.map((v) => (!state.views[v] ? missingSection(v, i) : state.views[v]!.included[i] === false ? excludedSection(v, i) : viewSection(v, i)));
  return h('div', { class: 'stack' },
    nav,
    h('div', {},
      h('h2', {}, `${i + 1}. ${stepLabel(s)}`),
      h('p', { class: 'muted' }, p?.sanskrit, ' · ', p?.nameEn),
      isDraft(s.poseId) ? h('p', { class: 'notice' }, 'Die Regeln für diese Haltung sind ein Entwurf und noch nicht fachlich geprüft.') : null,
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

function excludedSection(v: ViewName, i: number): HTMLElement {
  const rules = (school().rules[steps()[i].poseId] ?? []).filter((r) => r.view === v);
  return h('section', { class: 'card stack-s' },
    h('h3', {}, `Ansicht ${VIEW_DE[v]}`),
    h('p', { class: 'muted' }, 'Diese Haltung ist nicht in diesem Video.'),
    rules.length
      ? h('ul', { class: 'rules' }, rules.map((r) => h('li', { class: 'rule' }, h('strong', {}, r.label), ' ', h('span', { class: 'muted' }, 'nicht in diesem Video'))))
      : null,
  );
}

function sideInfo(i: number, e: StepEval): HTMLElement | null {
  const named = steps()[i].side;
  if (!e.frame || !e.side) return null;
  const differs = !!e.detected && !!named && e.detected !== named;
  if (named && !differs) return null;
  const line = e.detected
    ? `Seite: ${SIDE_DE[e.side]} (automatisch erkannt)`
    : `Seite: ${SIDE_DE[e.side]} (nicht erkennbar, Annahme)`;
  return h('div', {},
    h('p', {}, line),
    differs ? h('p', { class: 'muted small-hint' }, `Erkannt: ${SIDE_DE[e.detected!]} – die Bewertung nutzt das erkannte vordere/Stand-Bein`) : null);
}

// ----- one view of one step -----

function viewSection(v: ViewName, i: number): HTMLElement {
  const vd = state.views[v]!;
  const canvas = h('canvas', { class: 'shot', role: 'img', 'aria-label': `Aufnahme ${VIEW_DE[v]}` });
  const note = h('p', { class: 'muted' });
  const list = h('div', {});
  const sideBox = h('div', {});
  const timeLabel = h('span', { class: 'muted' });
  let token = 0;
  let lastDraw: { img: HTMLCanvasElement; e: StepEval } | null = null;
  let lastScale = 0;
  const draw = () => {
    if (!lastDraw) return;
    const { img, e } = lastDraw;
    const shown = canvas.clientWidth || Math.min(window.innerWidth - 32, 700);
    lastScale = img.width / shown;
    drawOverlay(canvas.getContext('2d')!, img, e.frame, e.results, { width: img.width, height: img.height, showOverlay: state.overlay, scale: lastScale });
  };
  // Redraw when the displayed size changes (rotation, resize) so labels keep their size.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      const shown = canvas.clientWidth;
      if (lastDraw && shown && Math.abs(lastDraw.img.width / shown - lastScale) > 0.03 * lastScale) draw();
    }).observe(canvas);
  }

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
    sideBox.replaceChildren(...[sideInfo(i, e)].filter((x): x is HTMLElement => !!x));
    note.textContent = e.frame
      ? (vd.overrides[i] !== null ? `Manuell gewählter Moment, ausgewertet über ±${WINDOW_S} s.` : 'Automatisch erkannte Haltung.')
      : 'Für diese Haltung wurde im Video nichts gefunden. Wähle mit dem Regler den Moment, in dem du in der Haltung bist.';
    if (e.t === null) { canvas.hidden = true; return; }
    try {
      const img = await grabFrame(vd.file, e.t);
      if (my !== token) return;
      canvas.hidden = false;
      lastDraw = { img, e };
      draw();
    } catch (err) {
      note.textContent = err instanceof Error ? err.message : String(err);
    }
  }
  void update();

  return h('section', { class: 'card stack-s' },
    h('h3', {}, `Ansicht ${VIEW_DE[v]}`),
    canvas,
    note,
    sideBox,
    h('div', { class: 'row timeline' }, h('span', { class: 'lbl' }, 'Moment'), slider, timeLabel, reset),
    list,
  );
}

function rangeText(r: Rule): string {
  const [lo, hi] = r.range;
  if (r.measure.kind === 'offset') return `${fmtCm(lo, true)} bis ${fmtCm(hi, true).replace('≈ ', '')}`;
  return `${fmt(lo)}–${fmt(hi)}°`;
}
function valueText(r: Rule, val: number): string {
  return r.measure.kind === 'offset' ? fmtCm(val, true) : `${fmt(val)}°`;
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
    h('p', { class: 'muted small' }, 'cm-Angaben sind grob geschätzt (Annahme: Rumpf Schulter–Hüfte ≈ 50 cm).'),
  );
}
