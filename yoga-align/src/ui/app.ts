import { h } from './dom';
import { state } from './state';
import { renderStart } from './start';
import { renderRecord } from './record';
import { renderAnalyze } from './analyze';
import { renderResults } from './results';
import { renderReview } from './review';
import { aiEnabled } from './ai';

export function render(): void {
  const root = document.getElementById('app')!;
  const screen =
    state.screen === 'start' ? renderStart()
    : state.screen === 'record' ? renderRecord()
    : state.screen === 'analyze' ? renderAnalyze()
    : state.screen === 'review' ? renderReview()
    : renderResults();
  root.replaceChildren(
    h('header', { class: 'top' }, h('div', { class: 'wrap' }, h('span', { class: 'logo' }, 'Yoga-Ausrichtung'))),
    h('main', { class: 'wrap' }, screen),
    h('footer', { class: 'wrap foot' },
      aiEnabled() ? 'Alles wird lokal im Browser berechnet; zur Erkennung der Haltungen gehen einzelne Standbilder an einen KI-Dienst. ' : 'Alles wird lokal im Browser berechnet. ',
      'Keine Ärztin, keine Lehrerin – nur eine Orientierungshilfe.'),
  );
}
