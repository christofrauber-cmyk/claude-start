import type { Sequence } from '../core/types';

export const BUILT_IN_SEQUENCES: Sequence[] = [
  {
    id: 'standing-basics',
    name: 'Stehhaltungen – Grundlagen',
    description: 'Die klassischen Iyengar-Stehhaltungen, jede Seite einzeln. Ca. 30 Sekunden pro Haltung halten.',
    builtIn: true,
    steps: [
      { poseId: 'tadasana' },
      { poseId: 'vrksasana', side: 'right' }, { poseId: 'vrksasana', side: 'left' },
      { poseId: 'utthita_trikonasana', side: 'right' }, { poseId: 'utthita_trikonasana', side: 'left' },
      { poseId: 'virabhadrasana_2', side: 'right' }, { poseId: 'virabhadrasana_2', side: 'left' },
      { poseId: 'utthita_parsvakonasana', side: 'right' }, { poseId: 'utthita_parsvakonasana', side: 'left' },
      { poseId: 'uttanasana' },
    ],
  },
  {
    id: 'sun-salutation-elements',
    name: 'Sonnengruß-Elemente',
    description: 'Die Haltungen aus dem Sonnengruß, jede einzeln gehalten statt fließend. Ca. 15–20 Sekunden pro Haltung.',
    builtIn: true,
    steps: [
      { poseId: 'tadasana' },
      { poseId: 'utkatasana' },
      { poseId: 'uttanasana' },
      { poseId: 'chaturanga_dandasana' },
      { poseId: 'urdhva_mukha_svanasana' },
      { poseId: 'adho_mukha_svanasana' },
      { poseId: 'virabhadrasana_1', side: 'right' }, { poseId: 'virabhadrasana_1', side: 'left' },
    ],
  },
  {
    id: 'balance-and-floor',
    name: 'Balance & Boden',
    description: 'Halbmond, Sitzhaltungen und Schulterbrücke. Ca. 30 Sekunden pro Haltung.',
    builtIn: true,
    steps: [
      { poseId: 'ardha_chandrasana', side: 'right' }, { poseId: 'ardha_chandrasana', side: 'left' },
      { poseId: 'dandasana' },
      { poseId: 'paschimottanasana' },
      { poseId: 'setu_bandha_sarvangasana' },
    ],
  },
];
