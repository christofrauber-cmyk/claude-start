import { h, fmt } from './dom';
import { go, rerender, state, type ViewName } from './state';
import { SCHOOLS } from '../data/schools';
import { POSE_BY_ID } from '../data/poses';
import { currentSequence } from './start';
import { releaseVideo } from './video';

const VIEW_DE: Record<ViewName, string> = { front: 'Vorne', side: 'Seite' };

function diagram(): SVGElement {
  const svg = `
<svg viewBox="0 0 320 210" role="img" aria-label="Aufsicht: Matte mit Kamera vorne an der kurzen Kante und Kamera seitlich an der langen Kante" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="318" height="208" rx="10" fill="var(--bg-soft)"/>
  <!-- mat, front edge at the bottom -->
  <rect x="120" y="14" width="64" height="150" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="152" y="30" text-anchor="middle" font-size="10" fill="var(--text-2)">Matte</text>
  <line x1="120" y1="164" x2="184" y2="164" stroke="var(--accent)" stroke-width="5"/>
  <text x="196" y="160" font-size="10" fill="var(--text-2)">Mattenvorderkante</text>
  <!-- person -->
  <circle cx="152" cy="92" r="8" fill="var(--text)"/>
  <ellipse cx="152" cy="112" rx="14" ry="9" fill="var(--text)"/>
  <!-- front camera -->
  <g transform="translate(152 190)">
    <rect x="-14" y="-9" width="28" height="18" rx="4" fill="var(--accent)"/><circle r="5" fill="#fff"/>
  </g>
  <path d="M152 178 L152 126" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="152" y="206" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text)">Vorne</text>
  <!-- side camera -->
  <g transform="translate(262 92)">
    <rect x="-14" y="-9" width="28" height="18" rx="4" fill="var(--accent)"/><circle r="5" fill="#fff"/>
  </g>
  <path d="M246 92 L172 92" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="262" y="124" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text)">Seite</text>
</svg>`;
  const t = document.createElement('div');
  t.innerHTML = svg.trim();
  return t.firstElementChild as SVGElement;
}

function slot(view: ViewName, title: string, hint: string): HTMLElement {
  const file = state.files[view];
  const input = h('input', {
    type: 'file', accept: 'video/*', capture: 'environment', class: 'sr', id: `file-${view}`,
    onchange: (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) { if (file) releaseVideo(file); state.files[view] = f; rerender(); }
    },
  });
  return h('div', { class: 'card slot' + (file ? ' filled' : '') },
    h('strong', {}, title),
    h('span', { class: 'muted' }, hint),
    file ? h('span', { class: 'file' }, `${file.name} (${fmt(file.size / 1048576, 1)} MB)`) : null,
    input,
    h('div', { class: 'row' },
      h('label', { class: 'btn', for: `file-${view}` }, file ? 'Anderes Video wählen' : 'Video wählen / aufnehmen'),
      file ? h('button', { class: 'link danger', type: 'button', onclick: () => { releaseVideo(file); delete state.files[view]; rerender(); } }, 'Entfernen') : null,
    ),
  );
}

/** What is measurable with the current uploads, per pose. */
function coverage(): HTMLElement {
  const seq = currentSequence();
  const school = SCHOOLS.find((s) => s.id === state.schoolId) ?? SCHOOLS[0];
  if (!seq || !school) return h('div');
  const have = { front: !!state.files.front, side: !!state.files.side };
  const ids = [...new Set(seq.steps.map((s) => s.poseId))];
  const count = (id: string, v: ViewName) => (school.rules[id] ?? []).filter((r) => r.view === v).length;

  let total = 0, lost = 0;
  const rows = ids.map((id) => {
    const p = POSE_BY_ID[id];
    const nf = count(id, 'front'), ns = count(id, 'side');
    total += nf + ns;
    if (!have.front) lost += nf;
    if (!have.side) lost += ns;
    const best = p?.bestViews[0];
    const missingBest = best && !have[best];
    return h('li', { class: 'row cov' },
      h('span', { class: 'grow' }, p?.nameDe ?? id),
      h('span', { class: 'muted' }, `Beste Ansicht: ${best ? VIEW_DE[best] : '–'}`),
      h('span', { class: 'tag ' + (missingBest ? 'warn' : '') }, `Vorne ${nf} · Seite ${ns}`),
    );
  });

  const missing = (['front', 'side'] as ViewName[]).filter((v) => !have[v]);
  return h('section', { class: 'stack-s' },
    h('h3', {}, 'Was ist messbar?'),
    missing.length === 1
      ? h('p', { class: 'notice' },
          `Ohne ${missing[0] === 'side' ? 'Seitenaufnahme' : 'Frontaufnahme'} entfallen ${lost} von ${total} Regeln dieser Schule` +
          (missing[0] === 'side' ? ' (z. B. Rumpfneigung, Knie über dem Knöchel, Rundrücken).' : ' (z. B. Symmetrie, Knie-Ausrichtung, Beckenhöhe).') +
          ' Beide Ansichten liefern das vollständigste Bild.')
      : missing.length === 2
        ? h('p', { class: 'muted' }, 'Lade mindestens ein Video hoch. Pro Haltung siehst du hier, welche Ansicht wie viele Regeln misst.')
        : h('p', { class: 'muted' }, 'Mit beiden Ansichten sind alle Regeln der Schule messbar.'),
    h('ul', { class: 'list' }, rows),
  );
}

export function renderRecord(): HTMLElement {
  const seq = currentSequence();
  const ready = !!(state.files.front || state.files.side);
  return h('div', { class: 'stack' },
    h('button', { class: 'link back', type: 'button', onclick: () => go('start') }, '← Zurück'),
    h('section', { class: 'stack-s' },
      h('h1', {}, 'Aufnahme'),
      seq ? h('p', { class: 'muted' }, `Ablauf: ${seq.name} (${seq.steps.length} Schritte)`) : null,
      h('p', {}, 'Die Ansichten beziehen sich auf deine Matte, nicht auf deinen Körper.'),
      diagram(),
      h('ul', { class: 'bullets' },
        h('li', {}, h('strong', {}, 'Vorne: '), 'Kamera an der kurzen Vorderkante der Matte, Blick entlang der Matte.'),
        h('li', {}, h('strong', {}, 'Seite: '), 'Kamera an der langen Kante der Matte, Blick quer über die Matte.'),
        h('li', {}, 'Der ganze Körper (Kopf bis Füße, auch Hände) muss im Bild bleiben.'),
        h('li', {}, 'Handy in Hüfthöhe aufstellen und nicht bewegen; gutes Licht, enganliegende Kleidung hilft.'),
        h('li', {}, 'Jede Haltung etwa 20–30 Sekunden ruhig halten und zwischen den Haltungen kurz zurück in den Stand kommen. So erkennt die App die einzelnen Haltungen.'),
        h('li', {}, 'Die Haltungen in der Reihenfolge des Ablaufs ausführen. Für beide Ansichten den Ablauf einmal komplett durchgehen.'),
      ),
    ),
    h('section', { class: 'stack-s' },
      h('h2', {}, 'Videos hochladen'),
      h('div', { class: 'slots' },
        slot('front', 'Frontaufnahme (Vorne)', 'Video vom kurzen Mattenende.'),
        slot('side', 'Seitenaufnahme (Seite)', 'Video von der langen Mattenseite.'),
      ),
      h('p', { class: 'muted' }, 'Mindestens ein Video ist nötig. Das Video wird nur im Browser gelesen und nicht hochgeladen.'),
    ),
    coverage(),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', type: 'button', disabled: !ready, onclick: () => go('analyze') }, 'Analyse starten'),
    ),
  );
}
