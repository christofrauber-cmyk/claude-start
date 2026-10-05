import { h } from './dom';
import { AUTO_ID, go, loadCustomSequences, rerender, saveCustomSequences, state } from './state';
import { aiAvailable, aiEnabled, getConsent, setConsent } from './ai';
import { DEFAULT_SCHOOL_ID, SCHOOLS } from '../data/schools';
import { POSES, POSE_BY_ID } from '../data/poses';
import { parseSequence } from '../core/parse';
import { BUILT_IN_SEQUENCES } from '../data/sequences';
import type { Sequence, SequenceStep, Side } from '../core/types';

let custom: Sequence[] | null = null;
let draft: { name: string; steps: SequenceStep[] } = { name: '', steps: [] };
let addPose = POSES[0].id;
let addSide: Side | undefined; // undefined = automatisch
let storageWarn = false;
let pasteText = '';
let pasteUnknown: string[] = [];

export const allSequences = (): Sequence[] => [...BUILT_IN_SEQUENCES, ...(custom ??= loadCustomSequences())];
export const currentSequence = (): Sequence | undefined => allSequences().find((s) => s.id === state.sequenceId);

export function stepLabel(s: SequenceStep): string {
  const p = POSE_BY_ID[s.poseId];
  return `${p?.nameDe ?? s.poseId}${s.side ? (s.side === 'left' ? ' links' : ' rechts') : ''}`;
}

export function renderStart(): HTMLElement {
  if (!aiEnabled()) return renderGate();
  custom ??= loadCustomSequences();
  if (!state.schoolId) state.schoolId = SCHOOLS.some((s) => s.id === DEFAULT_SCHOOL_ID) ? DEFAULT_SCHOOL_ID : (SCHOOLS[0]?.id ?? '');
  const school = SCHOOLS.find((s) => s.id === state.schoolId) ?? SCHOOLS[0];
  // Simplest path first: recognise the poses, no sequence needed.
  if (state.sequenceId === null) state.sequenceId = AUTO_ID;
  const auto = state.sequenceId === AUTO_ID;
  const seq = currentSequence();

  const schoolSelect = h('select', {
    id: 'school',
    onchange: (e: Event) => { state.schoolId = (e.target as HTMLSelectElement).value; rerender(); },
  }, SCHOOLS.map((s) => h('option', { value: s.id, selected: s.id === state.schoolId }, s.name)));

  const seqCards = allSequences().map((s) =>
    h('label', { class: 'card choice' + (s.id === state.sequenceId ? ' on' : '') },
      h('input', { type: 'radio', name: 'seq', checked: s.id === state.sequenceId, onchange: () => { state.sequenceId = s.id; rerender(); } }),
      h('span', { class: 'choice-body' },
        h('strong', {}, s.name, s.builtIn ? '' : h('span', { class: 'tag' }, 'eigene')),
        h('span', { class: 'muted' }, s.description || `${s.steps.length} Schritte`),
        h('span', { class: 'steps' }, s.steps.map(stepLabel).join(' · ')),
      ),
      s.builtIn ? null : h('button', {
        class: 'link danger', type: 'button', title: 'Ablauf löschen',
        onclick: (e: Event) => {
          e.preventDefault();
          custom = custom!.filter((c) => c.id !== s.id);
          saveCustomSequences(custom);
          if (state.sequenceId === s.id) state.sequenceId = null;
          rerender();
        },
      }, 'Löschen'),
    ));

  const autoCard = h('label', { class: 'card choice' + (auto ? ' on' : '') },
    h('input', { type: 'radio', name: 'seq', checked: auto, onchange: () => { state.sequenceId = AUTO_ID; rerender(); } }),
    h('span', { class: 'choice-body' },
      h('strong', {}, 'Automatisch erkennen', h('span', { class: 'tag' }, 'ohne Ablauf')),
      h('span', { class: 'muted' }, 'Einfach üben und filmen. Die KI erkennt jede gehaltene Haltung, du bestätigst kurz.'),
    ));

  return h('div', { class: 'stack' },
    h('section', {},
      h('h1', {}, 'Wie gut sitzt deine Haltung?'),
      h('p', {}, 'Lade ein bis zwei Videos deiner Yogapraxis hoch (von vorne und/oder von der Seite). Die App erkennt deine Körperpunkte, vergleicht Winkel und Positionen mit den Ausrichtungsregeln einer Schule und zeigt dir pro Haltung, was passt und was du korrigieren könntest.'),
      h('div', { class: 'notice' },
        h('strong', {}, 'Wichtig: '),
        'Diese App ersetzt keine Lehrerin und keinen Lehrer und keine ärztliche Beratung. Das Video verlässt dein Gerät nicht, für die Erkennung gehen nur einzelne Standbilder an die KI. Bei Schmerzen oder Beschwerden höre auf und frage eine Fachperson.'),
    ),
    h('section', { class: 'stack-s' },
      h('h2', {}, '1. Schule wählen'),
      h('label', { for: 'school', class: 'sr' }, 'Schule'),
      schoolSelect,
      school ? h('p', { class: 'muted' }, h('span', { class: /Entwurf/.test(school.status) ? 'tag warn' : 'tag' }, school.status), ' ', school.description) : null,
    ),
    h('section', { class: 'stack-s' },
      h('h2', {}, '2. Ablauf wählen'),
      autoCard,
      h('p', { class: 'muted small' }, 'Oder einen festen Ablauf vorgeben:'),
      h('div', { class: 'stack-s' }, seqCards),
      renderBuilder(),
    ),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', type: 'button', disabled: !auto && (!seq || seq.steps.length === 0), onclick: () => go('record') }, 'Weiter zur Aufnahme'),
      !auto && !seq ? h('span', { class: 'muted' }, 'Bitte einen Ablauf wählen.') : null,
    ),
    h('details', { class: 'card settings' },
      h('summary', {}, 'Einstellungen'),
      h('p', { class: 'muted small' }, AI_INFO),
      h('button', { class: 'link danger', type: 'button', onclick: () => { setConsent('no'); rerender(); } }, 'Einwilligung zurückziehen'),
    ),
  );
}

function renderBuilder(): HTMLElement {
  const pose = POSE_BY_ID[addPose];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= draft.steps.length) return;
    [draft.steps[i], draft.steps[j]] = [draft.steps[j], draft.steps[i]];
    rerender();
  };

  const stepRows = draft.steps.map((s, i) =>
    h('li', { class: 'row' },
      h('span', { class: 'grow' }, `${i + 1}. `, POSE_BY_ID[s.poseId]?.nameDe ?? s.poseId, h('span', { class: 'muted' }, ` ${POSE_BY_ID[s.poseId]?.sanskrit ?? ''}`)),
      POSE_BY_ID[s.poseId]?.sided ? sideSelect(s.side, (v) => { s.side = v; rerender(); }) : null,
      h('button', { class: 'icon', type: 'button', 'aria-label': 'Nach oben', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
      h('button', { class: 'icon', type: 'button', 'aria-label': 'Nach unten', disabled: i === draft.steps.length - 1, onclick: () => move(i, 1) }, '↓'),
      h('button', { class: 'icon', type: 'button', 'aria-label': 'Entfernen', onclick: () => { draft.steps.splice(i, 1); rerender(); } }, '×'),
    ));

  const details = h('details', { class: 'card builder', open: draft.steps.length > 0 || undefined },
    h('summary', {}, 'Eigenen Ablauf zusammenstellen'),
    h('div', { class: 'stack-s' },
      h('label', { for: 'paste', class: 'lbl' }, 'Ablauf als Text einfügen'),
      h('textarea', {
        id: 'paste', rows: 4, class: 'paste',
        placeholder: 'z. B. Tadasana, Krieger 2 rechts, Krieger 2 links, Down Dog, Kindhaltung',
        value: pasteText,
        oninput: (e: Event) => { pasteText = (e.target as HTMLTextAreaElement).value; },
      }),
      h('div', { class: 'row' },
        h('button', {
          class: 'btn', type: 'button',
          onclick: () => {
            const items = parseSequence(pasteText, POSES);
            for (const it of items) if (it.step) draft.steps.push({ ...it.step });
            pasteUnknown = items.filter((it) => !it.pose).map((it) => it.text);
            if (items.some((it) => it.step)) pasteText = '';
            rerender();
          },
        }, 'Übernehmen'),
        h('span', { class: 'muted small' }, 'Deutsch, Englisch oder Sanskrit; „rechts“/„links“/„beide Seiten“ nach der Haltung.'),
      ),
      pasteUnknown.length
        ? h('p', { class: 'notice' }, 'Nicht erkannt: ', pasteUnknown.map((t) => `„${t}“`).join(', '), '. Bitte einzeln unten hinzufügen.')
        : null,
      h('p', { class: 'lbl' }, 'Oder einzeln hinzufügen'),
      h('div', { class: 'row' },
        h('select', { 'aria-label': 'Haltung', class: 'grow', onchange: (e: Event) => { addPose = (e.target as HTMLSelectElement).value; rerender(); } },
          [...POSES].sort((a, b) => a.nameDe.localeCompare(b.nameDe, 'de')).map((p) => h('option', { value: p.id, selected: p.id === addPose }, `${p.nameDe} (${p.sanskrit})`))),
        pose.sided ? sideSelect(addSide, (v) => { addSide = v; }) : null,
        h('button', {
          class: 'btn', type: 'button',
          onclick: () => { draft.steps.push(pose.sided && addSide ? { poseId: addPose, side: addSide } : { poseId: addPose }); rerender(); },
        }, 'Hinzufügen'),
      ),
      draft.steps.length ? h('ol', { class: 'list' }, stepRows) : h('p', { class: 'muted' }, 'Noch keine Haltungen. Bei Haltungen mit Seite (z. B. Baum) einfach beide Seiten nacheinander hinzufügen.'),
      h('div', { class: 'row' },
        h('input', {
          type: 'text', class: 'grow', placeholder: 'Name des Ablaufs', maxLength: 60, value: draft.name, 'aria-label': 'Name des Ablaufs',
          oninput: (e: Event) => { draft.name = (e.target as HTMLInputElement).value; },
        }),
        h('button', {
          class: 'btn', type: 'button', disabled: draft.steps.length === 0,
          onclick: () => {
            const s: Sequence = {
              id: 'custom-' + Date.now().toString(36),
              name: draft.name.trim() || 'Mein Ablauf',
              description: `${draft.steps.length} Schritte`,
              steps: draft.steps.map((x) => ({ ...x })),
            };
            custom = [...(custom ?? []), s];
            storageWarn = !saveCustomSequences(custom);
            state.sequenceId = s.id;
            draft = { name: '', steps: [] };
            rerender();
          },
        }, 'Speichern & wählen'),
      ),
      storageWarn ? h('p', { class: 'muted' }, 'Hinweis: Speichern im Browser nicht möglich – der Ablauf gilt nur für diese Sitzung.') : null,
    ),
  );
  return details;
}

function sideSelect(value: Side | undefined, onChange: (v: Side | undefined) => void): HTMLSelectElement {
  return h('select', {
    'aria-label': 'Seite',
    onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; onChange(v === 'auto' ? undefined : (v as Side)); },
  },
    h('option', { value: 'auto', selected: !value }, 'automatisch'),
    h('option', { value: 'right', selected: value === 'right' }, 'rechts'),
    h('option', { value: 'left', selected: value === 'left' }, 'links'));
}

const AI_INFO = 'Pro gehaltener Haltung geht ein einzelnes Standbild verschlüsselt an unseren Server und von dort an den KI-Dienst Anthropic (Claude). Das Video selbst, Namen oder Konten werden nicht übermittelt. Wir speichern die Bilder nicht; Anthropic verwendet sie nicht zum Training und löscht sie nach spätestens 30 Tagen. Die Einwilligung lässt sich jederzeit unter „Einstellungen“ zurückziehen.';

/**
 * The app needs the AI to recognise poses, so it starts with a one-time,
 * global consent. Without it (or before the server is set up) it stops here.
 */
function renderGate(): HTMLElement {
  const declined = getConsent() === 'no';
  return h('div', { class: 'stack' },
    h('section', { class: 'stack-s' },
      h('h1', {}, 'Wie gut sitzt deine Haltung?'),
      h('p', {}, 'Filme deine Yogapraxis von vorne und/oder von der Seite. Eine KI erkennt jede gehaltene Haltung, die App vergleicht Winkel und Positionen mit den Ausrichtungsregeln einer Schule und zeigt dir, was passt und was du korrigieren könntest.'),
    ),
    !aiAvailable()
      ? h('p', { class: 'notice' }, 'Die KI-Erkennung wird gerade eingerichtet. Bitte schau bald wieder vorbei.')
      : h('div', { class: 'card consent stack-s' },
          h('strong', {}, 'Einwilligung zur KI-Erkennung'),
          h('p', { class: 'small' }, AI_INFO),
          declined ? h('p', { class: 'notice' }, 'Ohne diese Einwilligung kann die App deine Haltungen nicht erkennen und nicht auswerten.') : null,
          h('div', { class: 'row' },
            h('button', { class: 'btn primary', type: 'button', onclick: () => { setConsent('yes'); rerender(); } }, 'Einverstanden'),
            declined ? null : h('button', { class: 'btn', type: 'button', onclick: () => { setConsent('no'); rerender(); } }, 'Nein danke'),
          ),
        ),
    h('p', { class: 'muted small' }, 'Diese App ersetzt keine Lehrerin und keinen Lehrer und keine ärztliche Beratung. Bei Schmerzen oder Beschwerden höre auf und frage eine Fachperson.'),
  );
}
