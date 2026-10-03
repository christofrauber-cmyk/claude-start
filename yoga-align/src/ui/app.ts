import { h } from './dom';
import { state } from './state';
import { renderStart } from './start';
import { renderRecord } from './record';
import { renderAnalyze } from './analyze';
import { renderResults } from './results';

export function render(): void {
  const root = document.getElementById('app')!;
  const screen =
    state.screen === 'start' ? renderStart()
    : state.screen === 'record' ? renderRecord()
    : state.screen === 'analyze' ? renderAnalyze()
    : renderResults();
  root.replaceChildren(
    h('header', { class: 'top' }, h('div', { class: 'wrap' }, h('span', { class: 'logo' }, 'Yoga-Ausrichtung'))),
    h('main', { class: 'wrap' }, screen),
    h('footer', { class: 'wrap foot' }, 'Alles wird lokal im Browser berechnet. Keine Ärztin, keine Lehrerin – nur eine Orientierungshilfe.'),
  );
}
