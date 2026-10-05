// Auto mode: one card per detected hold. The AI preselects the pose; one tap
// changes it.
import { fmtTime, h } from './dom';
import { go, rerender, state, type ReviewItem } from './state';
import { POSES, POSE_BY_ID } from '../data/poses';
import { realign } from './align';
import type { Sequence, Side } from '../core/types';

const SORTED = [...POSES].sort((a, b) => a.nameDe.localeCompare(b.nameDe, 'de'));

function card(it: ReviewItem, n: number): HTMLElement {
  const pose = it.poseId ? POSE_BY_ID[it.poseId] : null;
  const pick = (id: string | null) => { it.poseId = id; it.unsure = false; it.side = undefined; rerender(); };
  const chip = (id: string) => h('button', {
    type: 'button', class: 'chip' + (it.poseId === id ? ' on' : ''), 'aria-pressed': String(it.poseId === id), onclick: () => pick(id),
  }, POSE_BY_ID[id]?.nameDe ?? id);

  const status = it.failed && it.poseId === null
    ? h('span', { class: 'tag warn' }, 'nicht erkannt – bitte wählen')
    : it.poseId === null
      ? h('span', { class: 'tag' }, 'wird übersprungen')
      : it.unsure
        ? h('span', { class: 'tag warn' }, 'bitte prüfen')
        : h('span', { class: 'tag ok' }, 'KI: sicher');

  return h('li', { class: 'card review' + ((it.unsure && it.poseId) || (it.failed && !it.poseId) ? ' unsure' : '') + (it.poseId === null ? ' skipped' : '') },
    h('img', { src: it.image, alt: `Standbild bei ${fmtTime(it.t)}`, class: 'still' }),
    h('div', { class: 'stack-s grow' },
      h('div', {},
        h('span', { class: 'muted small' }, `${n}. Haltung · ${fmtTime(it.t)}`), ' ', status,
        h('strong', { class: 'block' }, pose ? pose.nameDe : 'Keine Haltung', pose ? h('span', { class: 'muted' }, ` ${pose.sanskrit}`) : null),
      ),
      h('div', { class: 'chips' },
        it.options.map(chip),
        h('button', { type: 'button', class: 'chip' + (it.poseId === null ? ' on' : ''), onclick: () => pick(null) }, 'Keine Haltung'),
      ),
      h('div', { class: 'row' },
        h('select', {
          'aria-label': 'Andere Haltung wählen', class: 'grow',
          onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v) { if (!it.options.includes(v)) it.options = [v, ...it.options].slice(0, 5); pick(v); } },
        },
          h('option', { value: '' }, 'Andere Haltung …'),
          SORTED.map((p) => h('option', { value: p.id }, `${p.nameDe} (${p.sanskrit})`))),
        pose?.sided ? sideSelect(it.side, (v) => { it.side = v; }) : null,
      ),
    ),
  );
}

function sideSelect(value: Side | undefined, onChange: (v: Side | undefined) => void): HTMLSelectElement {
  return h('select', {
    'aria-label': 'Seite',
    onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; onChange(v === 'auto' ? undefined : (v as Side)); },
  },
    h('option', { value: 'auto', selected: !value }, 'Seite automatisch'),
    h('option', { value: 'right', selected: value === 'right' }, 'rechts'),
    h('option', { value: 'left', selected: value === 'left' }, 'links'));
}

function confirm(): void {
  const items = state.review ?? [];
  const main = state.reviewView!;
  const chosen = items.filter((it) => it.poseId);
  const seq: Sequence = {
    id: 'auto-' + Date.now().toString(36),
    name: 'Automatisch erkannt',
    description: `${chosen.length} Haltungen`,
    steps: chosen.map((it) => (it.side ? { poseId: it.poseId!, side: it.side } : { poseId: it.poseId! })),
  };
  for (const [v, vd] of Object.entries(state.views)) {
    if (!vd) continue;
    vd.included = seq.steps.map(() => true);
    vd.overrides = seq.steps.map(() => null);
    if (v === main) {
      vd.holds = chosen.map((it) => vd.allHolds[it.hold]);
      vd.fixed = true;
    } else {
      vd.fixed = false;
      realign(vd, v as 'front' | 'side', seq.steps);
    }
  }
  state.analyzed = seq;
  state.stepIndex = null;
  go('results');
}

export function renderReview(): HTMLElement {
  const items = state.review ?? [];
  const open = items.filter((it) => it.unsure && it.poseId).length;
  return h('div', { class: 'stack' },
    h('button', { class: 'link back', type: 'button', onclick: () => go('record') }, '← Zurück'),
    h('section', { class: 'stack-s' },
      h('h1', {}, 'Erkannte Haltungen'),
      h('p', {}, `Die KI hat ${items.length} gehaltene Haltungen erkannt. Stimmt etwas nicht, tippe die richtige an.`),
      state.aiFailed ? h('p', { class: 'notice' }, 'Bei einzelnen Haltungen kam keine Antwort der KI. Bitte dort die Haltung aus der Liste wählen.') : null,
      open ? h('p', { class: 'muted' }, `${open} ${open === 1 ? 'Haltung ist' : 'Haltungen sind'} mit „bitte prüfen“ markiert.`) : null,
    ),
    h('ol', { class: 'list review-list' }, items.map((it, i) => card(it, i + 1))),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', type: 'button', disabled: !items.some((it) => it.poseId), onclick: confirm }, 'Auswerten'),
      open ? h('span', { class: 'muted small' }, 'Du kannst auch ohne Prüfen weiter; die Auswertung nimmt dann die Vorschläge.') : null,
    ),
  );
}
