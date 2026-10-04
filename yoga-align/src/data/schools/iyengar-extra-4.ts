import type { Measure, Rule } from '../../core/types';

/*
 * Iyengar-Regelwerk, Ergänzung 4 (ENTWURF – fachlich zu prüfen):
 * Umkehrhaltungen, Armbalancen und liegende Haltungen.
 *
 * Konventionen
 *  - Kameras relativ zur MATTE: 'front' = kurze Mattenkante, 'side' = lange Mattenkante.
 *    Liegende Haltungen liegen entlang der Matte: 'side' sieht sie im Profil (Sagittalebene),
 *    'front' blickt von Fuß- bzw. Kopfende und sieht nur Breiten (Knieabstand, Schulter-/Beckenlinie).
 *  - Winkel = Innenwinkel 0..180 (180 = gestreckt), tilt = Abweichung von Senkrechter/Waagrechter,
 *    offset in Rumpflängen. In 'side' fallen mid_-Punkte auf die sichtbare Körperseite zurück.
 *  - Nicht gesidete Haltungen nutzen nur anatomische Seiten bzw. mid_-Punkte.
 *
 * lead/trail der gesideten Haltungen (passend zum sideCue der Haltung):
 *  - Vasisthasana (lowerWrist): lead = Seite der unteren Hand = Stützarm/Standseite; trail = oberer Arm/oberes Bein.
 *    Kamera 'side' blickt auf die Brust (Körperlinie liegt entlang der Matte).
 *  - Supta Padangusthasana (higherAnkle): lead = ANGEHOBENES Bein; trail = Bein am Boden.
 *  - Anantasana (higherAnkle): lead = ANGEHOBENES (oberes) Bein; trail = unteres Bein am Boden.
 *    Die Person liegt mit der Brust zur langen Mattenkante, 'side' sieht die Frontalebene.
 *  - Parsva Bakasana (kein sideCue): lead = die im Schritt genannte Seite = Seite, zu der die Knie zeigen
 *    (der Arm dieser Seite trägt die Oberschenkel); trail = Gegenseite.
 *  - Astavakrasana (kein sideCue): lead = im Schritt genannte Seite = Seite, zu der die Beine ausgestreckt sind
 *    (über diesem Oberarm hängend, dieses Bein oben); trail = Gegenseite.
 *  - Eka Pada Koundinyasana (kein sideCue): lead = im Schritt genannte Seite = das nach vorn/zur Seite
 *    gestreckte Bein (auf dem Oberarm ruhend); trail = das nach hinten gestreckte Bein.
 *
 * BEWUSST NICHT KODIERT (mit 33 Punkten aus einer 2D-Kamera nicht messbar) – Input für die fachliche Prüfung:
 *
 * Adho Mukha Vrksasana: Handflächenverteilung und Fingerspreizung; Schulterblätter nach oben/ohren; Rippen/Hohlkreuz und
 *   Bauchspannung; Beinschluss und Fußspannung; Wandkontakt; Blick zwischen die Hände; Kopfhaltung (Pose-Erkennung kopfüber unsicher).
 * Ardha Pincha Mayurasana: Unterarme parallel und schulterbreit (nur frontal grob); Handflächen/Fingerstreckung;
 *   Schulterblatt-Auflösung und Brustbein zu den Oberschenkeln; Wirbelsäulen-Konkavität; Fersen-Bodenkontakt.
 * Viparita Karani: Bolster-/Wandabstand; Lage des Kreuzbeins auf dem Polster; Brustbeinhebung; Nacken und Kehle weich;
 *   Fußspannung vs. Entspannung; Armlage (Handflächen nach oben).
 * Bakasana: Knie hoch an den Oberarmen/Achseln; Rundrücken und Kopf heben; Blick; Fußlage (Zehen, Fersen zum Gesäß);
 *   Handflächenverteilung; Ellbogen nicht auseinanderfallen; Schwerpunktverschiebung nur grob über Schulter-Handgelenk.
 * Parsva Bakasana: Rumpfdrehung und Lage der Oberschenkel auf dem Oberarm; Ellbogen-Beugung und Ausrichtung der Unterarme;
 *   Hüft-Schulter-Höhe; Fußkreuzung; Schulterblattstellung (starke Selbstverdeckung).
 * Tittibhasana: Oberschenkel hoch an den Oberarmen; Schulter-Hüft-Beziehung; Zehenspannung; Hände flach vor den Füßen;
 *   Rundrücken; Kopf heben (starke Selbstverdeckung).
 * Astavakrasana: Fußverschränkung und Beinhaken über dem Oberarm; Rumpfneigung und Ellbogenwinkel; Beckenhöhe;
 *   Kopf und Blick; Schulterblätter (Beine, Arme und Rumpf überlagern sich stark).
 * Eka Pada Koundinyasana: Rumpfdrehung zum Oberarm; Beinhaltung am Oberarm; Beckenhöhe und Schultergürtel;
 *   Armbeugung; Blick nach vorn; Fußspannung (Drehung nur grob über Beinspreizung).
 * Vasisthasana: Schulter über Handgelenk in der Tiefe; Brustbeindrehung nach oben; Beckenrotation; Fußkanten-Gewölbe;
 *   Handflächen-Druckverteilung; Kopf- und Nackenlage; Fußstellung (Seitkante des Fußes).
 * Phalakasana: Bauchspannung und Steißbein-Position; Schulterblätter breit; Handflächen-Verteilung; Fußstellung (Zehen);
 *   Hohlkreuz vs. Pike nur grob über Körperlinie; Kopf und Nacken in Verlängerung (nur grob).
 * Lolasana: Fußkreuzung und Fersen am Gesäß; Hüftlift (Füße vom Boden) nur schwer erkennbar; Rundrücken; Kopfhaltung;
 *   Kontakt der Schienbeine; Handflächen- und Fingerlage.
 * Mayurasana: Ellbogen zusammen und Unterarme parallel; Handlage (Finger zeigen zu den Füßen); Bauchdruck auf den Ellbogen;
 *   Kopf nicht nach unten fallen lassen; Beinspannung (Zehen); Brustbein-Hebung.
 * Savasana: Entspannung selbst (Gesicht, Atem, Kiefer); Fußrotation nach außen; Handflächen nach oben;
 *   Kopf- und Nackenlage; Beckenneigung und Lendenbogen; Abstand der Arme vom Rumpf nur grob.
 * Apanasana: Druck der Hände auf die Schienbeine; Kreuzbein am Boden; Kopf- und Nackenlage; Knie-zusammen-Abstand;
 *   Fußspannung; Atem und Entspannung des unteren Rückens.
 * Supta Baddha Konasana: Bolster-/Deckenlage; Fußsohlen-Kontakt und Fersen-Abstand zum Becken; Beckenneigung;
 *   Schultergürtel und Nacken weich; Armlage; Knieöffnung nur frontal grob (Perspektive).
 * Supta Padangusthasana: Beckenrotation und Gleichheit beider Hüften; Zehengriff bzw. Gurtlage; Außenseite des Standbeins am Boden;
 *   Zehen/Ferse des Bodenbeins; Schultern am Boden; Kopf- und Nackenlage.
 * Ananda Balasana: Griffhöhe an Fußaußenkanten; Kreuzbein am Boden; Kopf- und Nackenlage; Knieöffnung (nur frontal grob);
 *   Armstreckung; Fußsohlen-Parallelität zur Decke.
 * Supta Virasana: Fersen neben den Hüften; Fußrücken am Boden; Knieabstand und Zehen; Lendenwirbelsäule vs. Hohlkreuz;
 *   Brustkorböffnung; Armlage; Unterschenkel unter den Oberschenkeln verdeckt (Kniewinkel nur grob).
 * Anantasana: Rumpfdrehung nach vorn (Brustbein offen); Stützarm-Lage und Kopf auf der Hand; Fuß-/Zehengriff;
 *   Beckenstapelung (Hüfte über Hüfte) und Beckenrotation; Fußspannung beider Beine.
 * Urdhva Prasarita Padasana: Kreuzbein am Boden und Lendenbogen; Zehen- und Fußspannung; Fersen über den Hüften;
 *   Schultern und Nacken weich; Armlage; Beine zusammen (nur frontal grob).
 */

const angle = (a: string, b: string, c: string): Measure => ({ kind: 'angle', a, b, c });
const tilt = (from: string, to: string, axis: 'vertical' | 'horizontal'): Measure => ({ kind: 'tilt', from, to, axis });
const offset = (a: string, b: string, axis: 'x' | 'y', toward?: string, abs?: boolean): Measure => ({
  kind: 'offset', a, b, axis, ...(toward ? { toward } : {}), ...(abs ? { abs: true } : {}),
});

export const RULES_EXTRA_4: Record<string, Rule[]> = {
  // -------------------------------------------------------- Adho Mukha Vrksasana
  adho_mukha_vrksasana: [
    {
      id: 'adho_mukha_vrksasana.arms_straight_left', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [165, 180], label: 'Arme links',
      cueBelow: 'Arme ganz strecken: Ellbogen fest, Hände in den Boden drücken.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme außen drehen, Schultern aktiv.',
      why: 'Die gestreckten Arme tragen wie die Beine in Tadasana das ganze Gewicht.', weight: 3,
    },
    {
      id: 'adho_mukha_vrksasana.arms_straight_right', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [165, 180], label: 'Arme rechts',
      cueBelow: 'Arme ganz strecken: Ellbogen fest, Hände in den Boden drücken.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme außen drehen, Schultern aktiv.',
      why: 'Die gestreckten Arme tragen wie die Beine in Tadasana das ganze Gewicht.', weight: 3,
    },
    {
      id: 'adho_mukha_vrksasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Beine strecken: Kniescheiben hoch, Fersen nach oben ziehen.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel fest.',
      why: 'Gestreckte Beine verlängern die Körperachse nach oben und halten das Gleichgewicht.', weight: 2,
    },
    {
      id: 'adho_mukha_vrksasana.body_vertical', view: 'side', measure: tilt('mid_wrist', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 10, label: 'Körperlinie',
      cueBelow: 'Körperachse senkrecht über den Händen halten.',
      cueAbove: 'Beine über die Hände bringen: Hüfte über Schultern, Körper in einer senkrechten Linie.',
      why: 'Die Schwerlinie fällt durch die Hände, nur dann trägt der Körper sich ohne Anstrengung.', weight: 3,
    },
    {
      id: 'adho_mukha_vrksasana.trunk_vertical', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 15], margin: 10, label: 'Rumpf',
      cueBelow: 'Rumpf senkrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein zu den Händen, nicht ins Hohlkreuz oder Bananenform kippen.',
      why: 'Ein senkrechter Rumpf zeigt, dass Schultergürtel und Becken übereinander stehen.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Ardha Pincha Mayurasana
  ardha_pincha_mayurasana: [
    {
      id: 'ardha_pincha_mayurasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [160, 180], label: 'Beine',
      cueBelow: 'Beine strecken: Kniescheiben hoch, Oberschenkel nach hinten.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Fersen Richtung Boden.',
      why: 'Die gestreckten Beine geben dem Rumpf Gegenzug, damit sich die Wirbelsäule verlängern kann.', weight: 3,
    },
    {
      id: 'ardha_pincha_mayurasana.hip_angle', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [55, 110], margin: 10, label: 'Hüftwinkel',
      cueBelow: 'Hüfte etwas weniger hoch: Rumpf und Beine nicht zusammenfalten.',
      cueAbove: 'Sitzbeine höher ziehen: Hüfte zur Decke, Rumpf zu den Oberschenkeln.',
      why: 'Der spitze Winkel in der Hüfte entlastet die Schultern und streckt die Wirbelsäule.', weight: 3,
    },
    {
      id: 'ardha_pincha_mayurasana.hips_high', view: 'side', measure: offset('mid_hip', 'mid_shoulder', 'y', 'up'),
      range: [0.5, 1.4], margin: 0.12, label: 'Hüfte hoch',
      cueBelow: 'Hüfte weiter nach oben schieben: Zehen nach vorn, Sitzbeine zur Decke.',
      cueAbove: 'Hüfte etwas senken: Rumpf lang, nicht auf die Schultern fallen.',
      why: 'Die hohe Hüfte bringt Gewicht von den Schultern zu den Beinen.', weight: 2,
    },
    {
      id: 'ardha_pincha_mayurasana.upper_arm_vertical_left', view: 'side', measure: tilt('left_elbow', 'left_shoulder', 'vertical'),
      range: [0, 18], margin: 10, label: 'Oberarme links',
      cueBelow: 'Oberarme senkrecht halten.',
      cueAbove: 'Ellbogen unter die Schultern bringen: Oberarme senkrecht, nicht nach vorn rutschen.',
      why: 'Ellbogen unter den Schultern bilden eine stabile Stütze, Schulterblätter bleiben breit.', weight: 2,
    },
    {
      id: 'ardha_pincha_mayurasana.upper_arm_vertical_right', view: 'side', measure: tilt('right_elbow', 'right_shoulder', 'vertical'),
      range: [0, 18], margin: 10, label: 'Oberarme rechts',
      cueBelow: 'Oberarme senkrecht halten.',
      cueAbove: 'Ellbogen unter die Schultern bringen: Oberarme senkrecht, nicht nach vorn rutschen.',
      why: 'Ellbogen unter den Schultern bilden eine stabile Stütze, Schulterblätter bleiben breit.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Viparita Karani
  viparita_karani: [
    {
      id: 'viparita_karani.legs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'vertical'),
      range: [0, 15], margin: 10, label: 'Beine senkrecht',
      cueBelow: 'Beine senkrecht halten.',
      cueAbove: 'Beine senkrecht nach oben strecken: Fersen über die Hüften, Wand nur als Stütze.',
      why: 'Senkrechte Beine lassen das Blut mühelos zum Herzen zurückfließen und beruhigen.', weight: 3,
    },
    {
      id: 'viparita_karani.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [160, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel anspannen, Kniescheiben hoch.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben locker nach oben ziehen.',
      why: 'Lange Beine halten die Haltung aufrecht, ohne die Knie zu belasten.', weight: 2,
    },
    {
      id: 'viparita_karani.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 30], margin: 10, label: 'Rumpf',
      cueBelow: 'Rumpf waagrecht ablegen.',
      cueAbove: 'Rumpf ablegen: Schultern und Hinterkopf zum Boden, Brustkorb weit.',
      why: 'Der ruhig liegende Rumpf lässt die Haltung zur Erholung werden statt zur Anstrengung.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Bakasana
  bakasana: [
    {
      id: 'bakasana.arms_straight_left', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [155, 180], margin: 10, label: 'Arme links',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Ellbogen fest.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme fest, Schulterblätter breit.',
      why: 'Gestreckte Arme tragen das Körpergewicht; gebeugte Ellbogen lassen die Haltung einbrechen.', weight: 3,
    },
    {
      id: 'bakasana.arms_straight_right', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [155, 180], margin: 10, label: 'Arme rechts',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Ellbogen fest.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme fest, Schulterblätter breit.',
      why: 'Gestreckte Arme tragen das Körpergewicht; gebeugte Ellbogen lassen die Haltung einbrechen.', weight: 3,
    },
    {
      id: 'bakasana.knees_folded', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [15, 75], margin: 10, label: 'Knie',
      cueBelow: 'Knie nicht zu eng schließen: Fersen zum Gesäß, aber Schienbeine locker halten.',
      cueAbove: 'Fersen näher zum Gesäß ziehen: Knie fest an die Oberarme.',
      why: 'Die eng gefalteten Beine bringen den Schwerpunkt nahe an die Stützpunkte.', weight: 2,
    },
    {
      id: 'bakasana.hips_high', view: 'side', measure: offset('mid_hip', 'mid_shoulder', 'y', 'up'),
      range: [-0.1, 0.8], margin: 0.12, label: 'Hüfte',
      cueBelow: 'Hüfte höher heben: Sitzbeine nach oben, Rücken lang.',
      cueAbove: 'Hüfte etwas senken: Gewicht nach vorn in die Hände bringen.',
      why: 'Eine hoch getragene Hüfte entlastet die Arme und hebt die Füße vom Boden.', weight: 2,
    },
    {
      id: 'bakasana.shoulders_over_wrists', view: 'side', measure: offset('mid_shoulder', 'mid_wrist', 'x', 'forward'),
      range: [-0.05, 0.6], margin: 0.12, label: 'Schulter über Handgelenk',
      cueBelow: 'Schultern weiter nach vorn über die Hände bringen.',
      cueAbove: 'Nicht zu weit nach vorn fallen: Schultern nur leicht vor die Hände.',
      why: 'Der Schwerpunkt wandert über die Hände, damit die Füße sich lösen können.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Parsva Bakasana (lead = Seite der Knie)
  parsva_bakasana: [
    {
      id: 'parsva_bakasana.lead_leg_folded', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [15, 80], margin: 10, label: 'Vorderes Bein',
      cueBelow: 'Bein nicht öffnen: Ferse eng zum Gesäß.',
      cueAbove: 'Ferse näher zum Gesäß ziehen, Knie fest gegen den Oberarm.',
      why: 'Die zusammengefalteten Beine bleiben kompakt und lassen sich über den Arm tragen.', weight: 2,
    },
    {
      id: 'parsva_bakasana.trail_leg_folded', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [15, 80], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Bein nicht öffnen: Ferse eng zum Gesäß.',
      cueAbove: 'Ferse näher zum Gesäß ziehen, Knie fest an die Knie des anderen Beins.',
      why: 'Beide Beine bleiben gleich kompakt, damit der Schwerpunkt über den Händen liegt.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Tittibhasana
  tittibhasana: [
    {
      id: 'tittibhasana.arms_straight_left', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [150, 180], margin: 10, label: 'Arme links',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Oberschenkel gegen die Oberarme.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme fest und Schulterblätter breit.',
      why: 'Die Arme tragen den ganzen Körper; ihre Streckung gibt der Haltung Leichtigkeit.', weight: 3,
    },
    {
      id: 'tittibhasana.arms_straight_right', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [150, 180], margin: 10, label: 'Arme rechts',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Oberschenkel gegen die Oberarme.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme fest und Schulterblätter breit.',
      why: 'Die Arme tragen den ganzen Körper; ihre Streckung gibt der Haltung Leichtigkeit.', weight: 3,
    },
    {
      id: 'tittibhasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [150, 180], margin: 10, label: 'Beine',
      cueBelow: 'Beine strecken: Fersen weg, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Zehen aktiv.',
      why: 'Die gestreckten Beine sind das Gegengewicht und machen die Haltung lang.', weight: 2,
    },
    {
      id: 'tittibhasana.legs_forward', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 35], margin: 10, label: 'Beine nach vorn',
      cueBelow: 'Beine waagrecht nach vorn strecken.',
      cueAbove: 'Beine heben und nach vorn strecken: Füße nicht zu Boden sinken lassen.',
      why: 'Die waagrecht gestreckten Beine zeigen, dass die Hüfte genug Öffnung und Kraft hat.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Astavakrasana (lead = Seite der Beine)
  astavakrasana: [
    {
      id: 'astavakrasana.lead_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [150, 180], margin: 10, label: 'Vorderes Bein',
      cueBelow: 'Bein strecken: Ferse wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Die gestreckten Beine werden zum Gegengewicht und machen die Haltung leicht.', weight: 2,
    },
    {
      id: 'astavakrasana.trail_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [150, 180], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Bein strecken: Ferse wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Beide Beine strecken sich gleich, damit sie einen Hebel bilden.', weight: 2,
    },
    {
      id: 'astavakrasana.legs_level', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 40], margin: 10, label: 'Beine waagrecht',
      cueBelow: 'Beine waagrecht halten.',
      cueAbove: 'Beine heben: Füße nicht absinken lassen, Hüfte stützen.',
      why: 'Die Beine schweben seitlich in der Luft; ihr Gegengewicht zum Rumpf ist der Schlüssel.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Eka Pada Koundinyasana (lead = Vorderbein, trail = Hinterbein)
  eka_pada_koundinyasana: [
    {
      id: 'eka_pada_koundinyasana.lead_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [150, 180], margin: 10, label: 'Vorderes Bein',
      cueBelow: 'Vorderes Bein strecken: Ferse weg, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Vorderbein bildet den langen Hebel der Haltung.', weight: 2,
    },
    {
      id: 'eka_pada_koundinyasana.trail_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [150, 180], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Hinteres Bein strecken: Ferse zurück, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das hintere Bein gleicht das vordere aus; beide strecken sich in gegengesetzte Richtungen.', weight: 2,
    },
    {
      id: 'eka_pada_koundinyasana.legs_split', view: 'side', measure: angle('lead_ankle', 'mid_hip', 'trail_ankle'),
      range: [120, 180], margin: 12, label: 'Beinspreizung',
      cueBelow: 'Beine weiter auseinander strecken: Spagat in der Luft.',
      cueAbove: 'Beine in einer Linie halten.',
      why: 'Die weite Spreizung verteilt das Gewicht und hält das Becken über den Händen.', weight: 1,
    },
  ],

  // -------------------------------------------------------- Vasisthasana (lead = untere Hand / Stützarm)
  vasisthasana: [
    {
      id: 'vasisthasana.support_arm_straight', view: 'side', measure: angle('lead_shoulder', 'lead_elbow', 'lead_wrist'),
      range: [165, 180], label: 'Stützarm',
      cueBelow: 'Stützarm strecken: Hand in den Boden drücken, Ellbogen fest.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarm außen drehen, Schulter aktiv.',
      why: 'Der gestreckte Stützarm trägt den Körper, ohne dass die Schulter einsinkt.', weight: 3,
    },
    {
      id: 'vasisthasana.support_arm_vertical', view: 'side', measure: tilt('lead_wrist', 'lead_shoulder', 'vertical'),
      range: [0, 12], label: 'Stützarm senkrecht',
      cueBelow: 'Arm senkrecht halten.',
      cueAbove: 'Schulter über das Handgelenk bringen: Stützarm senkrecht zum Boden.',
      why: 'Der senkrechte Arm nimmt das Gewicht durch den Knochen auf, nicht durch den Muskel.', weight: 3,
    },
    {
      id: 'vasisthasana.body_line', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [165, 180], label: 'Körperlinie',
      cueBelow: 'Hüfte heben: Schultern, Becken und Fersen in einer geraden Linie.',
      cueAbove: 'Hüfte nicht nach oben schieben: Körper lang wie ein Brett.',
      why: 'Eine gerade Körperlinie verlangt aktive Beine und einen starken Rumpf.', weight: 3,
    },
    {
      id: 'vasisthasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Beine strecken: Kniescheiben hoch, Fersen weg.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Die gestreckten Beine halten die Körperlinie; Knie, die sich beugen, lassen das Becken sinken.', weight: 2,
    },
    {
      id: 'vasisthasana.arms_line', view: 'side', measure: angle('lead_wrist', 'mid_shoulder', 'trail_wrist'),
      range: [160, 180], label: 'Arme in einer Linie',
      cueBelow: 'Oberen Arm senkrecht über die Schulter strecken, beide Arme in einer Linie.',
      cueAbove: 'Arme in einer Linie halten, Schultern auseinander.',
      why: 'Die Arme bilden eine senkrechte Linie; die Brust dreht nach oben auf.', weight: 2,
    },
    {
      id: 'vasisthasana.top_arm_vertical', view: 'side', measure: tilt('trail_wrist', 'trail_shoulder', 'vertical'),
      range: [0, 15], margin: 10, label: 'Oberer Arm',
      cueBelow: 'Oberen Arm senkrecht halten.',
      cueAbove: 'Oberen Arm senkrecht nach oben strecken, Brust aufdrehen.',
      why: 'Der senkrechte obere Arm öffnet den Brustkorb zur Seite.', weight: 2,
    },
    {
      id: 'vasisthasana.body_incline', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'horizontal'),
      range: [5, 40], margin: 10, label: 'Körperneigung',
      cueBelow: 'Hüfte nicht hängen lassen: Körper auf die Linie vom Fuß zur Schulter bringen.',
      cueAbove: 'Fersen weiter von der Hand wegschieben: Körper flacher stellen.',
      why: 'Die schräge Linie vom Fuß bis zur Schulter zeigt, dass der Körper von Fuß und Hand gleichmäßig getragen wird.', weight: 1,
    },
  ],

  // -------------------------------------------------------- Phalakasana
  phalakasana: [
    {
      id: 'phalakasana.body_line', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [165, 180], label: 'Körperlinie',
      cueBelow: 'Hüfte senken: Schultern, Becken und Fersen in einer geraden Linie.',
      cueAbove: 'Hüfte nicht hochschieben, Steißbein Richtung Fersen strecken.',
      why: 'Der Körper bleibt ein gerades Brett; Bauch und Beine tragen die Linie.', weight: 3,
    },
    {
      id: 'phalakasana.arms_straight_left', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [165, 180], label: 'Arme links',
      cueBelow: 'Arme strecken: Ellbogen fest, Hände in den Boden drücken.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme außen drehen.',
      why: 'Die gestreckten Arme tragen das Gewicht, ohne dass die Schultern einsinken.', weight: 3,
    },
    {
      id: 'phalakasana.arms_straight_right', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [165, 180], label: 'Arme rechts',
      cueBelow: 'Arme strecken: Ellbogen fest, Hände in den Boden drücken.',
      cueAbove: 'Ellbogen nicht überstrecken: Oberarme außen drehen.',
      why: 'Die gestreckten Arme tragen das Gewicht, ohne dass die Schultern einsinken.', weight: 3,
    },
    {
      id: 'phalakasana.shoulders_over_wrists', view: 'side', measure: tilt('mid_wrist', 'mid_shoulder', 'vertical'),
      range: [0, 12], label: 'Schulter über Handgelenk',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Schultern über die Handgelenke bringen: Arme senkrecht zum Boden.',
      why: 'Der senkrechte Arm schützt die Handgelenke und die Schultern.', weight: 2,
    },
    {
      id: 'phalakasana.body_level', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Körper waagrecht',
      cueBelow: 'Körper waagrecht halten.',
      cueAbove: 'Körper parallel zum Boden ausrichten: Fersen nach hinten, Brustbein nach vorn.',
      why: 'Ein waagrecht gehaltener Körper verteilt das Gewicht gleichmäßig auf Hände und Zehen.', weight: 2,
    },
    {
      id: 'phalakasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Beine strecken: Kniescheiben hoch, Fersen nach hinten.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel fest.',
      why: 'Aktive Beine halten die Körperlinie; sinkende Knie ziehen das Becken ab.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Lolasana
  lolasana: [
    {
      id: 'lolasana.arms_straight_left', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [155, 180], margin: 10, label: 'Arme links',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Schultern heben.',
      cueAbove: 'Ellbogen nicht überstrecken: Schulterblätter nach unten.',
      why: 'Die Arme sind die einzige Stütze; ihre Streckung lässt den Körper schweben.', weight: 3,
    },
    {
      id: 'lolasana.arms_straight_right', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [155, 180], margin: 10, label: 'Arme rechts',
      cueBelow: 'Arme strecken: Hände in den Boden drücken, Schultern heben.',
      cueAbove: 'Ellbogen nicht überstrecken: Schulterblätter nach unten.',
      why: 'Die Arme sind die einzige Stütze; ihre Streckung lässt den Körper schweben.', weight: 3,
    },
    {
      id: 'lolasana.hips_behind_wrists', view: 'side', measure: offset('mid_hip', 'mid_wrist', 'x', 'backward'),
      range: [0.15, 1.5], margin: 0.12, label: 'Hüfte hinter den Händen',
      cueBelow: 'Hüfte weiter nach hinten schwingen, damit die Beine frei schweben können.',
      cueAbove: 'Hüfte etwas näher an die Hände bringen.',
      why: 'Das Schwingen nach hinten schafft Raum für die Beine unter dem Körper.', weight: 2,
    },
    {
      id: 'lolasana.knees_folded', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [15, 85], margin: 10, label: 'Knie',
      cueBelow: 'Knie nicht zu weit öffnen: Fersen zum Gesäß.',
      cueAbove: 'Fersen näher zum Gesäß ziehen: Beine eng falten.',
      why: 'Die kompakt gefalteten Beine halten den Schwerpunkt nahe am Körper.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Mayurasana
  mayurasana: [
    {
      id: 'mayurasana.body_level', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Körper waagrecht',
      cueBelow: 'Körper waagrecht halten.',
      cueAbove: 'Beine heben und nach hinten strecken: Körper parallel zum Boden.',
      why: 'Der waagrechte Körper ruht auf den Ellbogen wie ein Balken auf zwei Stützen.', weight: 3,
    },
    {
      id: 'mayurasana.body_line', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [160, 180], label: 'Körperlinie',
      cueBelow: 'Hüfte heben: Körper in einer geraden Linie vom Kopf bis zu den Fersen.',
      cueAbove: 'Hüfte nicht hochschieben: Körper lang halten.',
      why: 'Die gerade Linie zeigt, dass Bauch und Beine gleichmäßig arbeiten.', weight: 2,
    },
    {
      id: 'mayurasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Beine strecken: Kniescheiben hoch, Zehen aktiv.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Die gestreckten Beine sind der lange Hebel, der den Körper in der Waage hält.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Savasana
  savasana: [
    {
      id: 'savasana.body_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 10], margin: 6, label: 'Rumpf liegt flach',
      cueBelow: 'Rumpf ganz ablegen.',
      cueAbove: 'Rücken ganz auf den Boden ablegen, Kopf nicht anheben.',
      why: 'Der Rumpf ruht ohne Anstrengung auf dem Boden – der Körper gibt sein Gewicht ab.', weight: 2,
    },
    {
      id: 'savasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [160, 180], label: 'Beine',
      cueBelow: 'Beine ausstrecken und ablegen.',
      cueAbove: 'Beine entspannt ablegen, Knie nicht durchdrücken.',
      why: 'Die Beine liegen ausgestreckt und lang, ohne dass die Knie arbeiten.', weight: 2,
    },
    {
      id: 'savasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], margin: 6, label: 'Schultern',
      cueBelow: 'Schultern gleichmäßig ablegen.',
      cueAbove: 'Beide Schultern gleich weit vom Ohr wegsinken lassen, nicht schief liegen.',
      why: 'Symmetrisch liegende Schultern zeigen, dass der Brustkorb frei atmet.', weight: 2,
    },
    {
      id: 'savasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], margin: 6, label: 'Becken',
      cueBelow: 'Becken gerade ablegen.',
      cueAbove: 'Becken gerade ausrichten: Beine nicht zur Seite kippen lassen.',
      why: 'Ein gerade liegendes Becken gibt dem Rücken gleichmäßige Auflage.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Apanasana
  apanasana: [
    {
      id: 'apanasana.hip_flexed', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [20, 75], margin: 10, label: 'Hüftbeugung',
      cueBelow: 'Knie nicht zu weit zur Brust ziehen: Becken und Kreuzbein am Boden lassen.',
      cueAbove: 'Knie näher zur Brust ziehen: Oberschenkel zum Bauch.',
      why: 'Die Beugung der Hüfte dehnt den unteren Rücken und entspannt die Beinmuskeln.', weight: 3,
    },
    {
      id: 'apanasana.knees_bent', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [20, 75], margin: 10, label: 'Knie',
      cueBelow: 'Knie nicht zu eng beugen.',
      cueAbove: 'Fersen zum Gesäß ziehen: Schienbeine nah an den Oberschenkeln.',
      why: 'Die gefalteten Beine sind kompakt und entspannen den Rücken.', weight: 2,
    },
    {
      id: 'apanasana.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Rumpf liegt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rücken ablegen: Schultern und Kopf auf den Boden, Nacken lang.',
      why: 'Der Rücken liegt ruhig am Boden, damit die Hüftbeugung die Lendenwirbelsäule öffnen kann.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Supta Baddha Konasana
  supta_baddha_konasana: [
    {
      id: 'supta_baddha_konasana.knees_open', view: 'front', measure: offset('left_knee', 'right_knee', 'x', undefined, true),
      range: [0.5, 1.8], margin: 0.15, label: 'Knieöffnung',
      cueBelow: 'Knie weiter nach außen sinken lassen, Oberschenkel öffnen.',
      cueAbove: 'Knie nicht zu weit auseinanderfallen lassen: Fußsohlen zusammen, mit Blöcken stützen.',
      why: 'Die Hüften öffnen sich durch das Gewicht der Beine, nicht durch Druck.', weight: 2,
    },
    {
      id: 'supta_baddha_konasana.knees_level', view: 'front', measure: tilt('left_knee', 'right_knee', 'horizontal'),
      range: [0, 10], margin: 6, label: 'Knie auf gleicher Höhe',
      cueBelow: 'Knie gleich hoch halten.',
      cueAbove: 'Knie auf gleiche Höhe bringen: beide Seiten gleichmäßig öffnen.',
      why: 'Gleich geöffnete Hüften zeigen, dass die Haltung symmetrisch ist.', weight: 2,
    },
    {
      id: 'supta_baddha_konasana.feet_together', view: 'front', measure: offset('left_ankle', 'right_ankle', 'x', undefined, true),
      range: [0, 0.35], margin: 0.12, label: 'Füße zusammen',
      cueBelow: 'Fußsohlen zusammen halten.',
      cueAbove: 'Fußsohlen zusammenbringen: Fersen zueinander, Füße berühren sich.',
      why: 'Die Fußsohlen berühren sich als Basis der gebundenen Haltung.', weight: 2,
    },
    {
      id: 'supta_baddha_konasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], margin: 6, label: 'Schultern',
      cueBelow: 'Schultern gleichmäßig ablegen.',
      cueAbove: 'Beide Schultern gleichmäßig ablegen, nicht schief liegen.',
      why: 'Symmetrisch liegende Schultern lassen den Brustkorb sich öffnen.', weight: 1,
    },
    {
      id: 'supta_baddha_konasana.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 30], margin: 10, label: 'Rumpf',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rumpf auf dem Polster ablegen: Brustkorb weit, Schultern entspannt.',
      why: 'Der Rumpf ruht entspannt, damit der Brustkorb sich öffnen kann.', weight: 1,
    },
  ],

  // -------------------------------------------------------- Supta Padangusthasana (lead = angehobenes Bein)
  supta_padangusthasana: [
    {
      id: 'supta_padangusthasana.lifted_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Angehobenes Bein',
      cueBelow: 'Knie strecken: Ferse nach oben drücken, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hochziehen.',
      why: 'Das gestreckte Bein macht die Dehnung der Beinrückseite erst wirksam.', weight: 3,
    },
    {
      id: 'supta_padangusthasana.floor_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Bein am Boden',
      cueBelow: 'Bein am Boden strecken: Oberschenkel in den Boden, Ferse weg.',
      cueAbove: 'Knie nicht durchdrücken, Kniescheibe nach oben ziehen.',
      why: 'Das Bein am Boden verankert das Becken und hält die Hüften gerade.', weight: 3,
    },
    {
      id: 'supta_padangusthasana.floor_leg_flat', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'horizontal'),
      range: [0, 12], margin: 8, label: 'Bein am Boden flach',
      cueBelow: 'Bein am Boden halten.',
      cueAbove: 'Bein am Boden ablegen: Fuß nicht anheben oder zur Seite kippen.',
      why: 'Das liegende Bein bildet die ruhige Basis für die Dehnung.', weight: 2,
    },
    {
      id: 'supta_padangusthasana.leg_raised', view: 'side', measure: angle('mid_shoulder', 'lead_hip', 'lead_knee'),
      range: [30, 110], margin: 10, label: 'Beinhebung',
      cueBelow: 'Bein nicht zu nahe zum Kopf ziehen: Becken und Kreuzbein bleiben am Boden.',
      cueAbove: 'Bein höher heben: Fuß Richtung Decke, Hand zum großen Zeh oder mit Gurt.',
      why: 'Die Hebung des Beins dehnt die Beinrückseite bei fest geerdetem Becken.', weight: 2,
    },
    {
      id: 'supta_padangusthasana.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 12], margin: 8, label: 'Rumpf liegt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Schultern und Kopf ablegen: nicht zum Bein hochkommen.',
      why: 'Der Rumpf bleibt liegen, damit die Dehnung in den Beinen stattfindet und nicht im Rücken.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Ananda Balasana
  ananda_balasana: [
    {
      id: 'ananda_balasana.shins_vertical', view: 'side', measure: tilt('mid_knee', 'mid_ankle', 'vertical'),
      range: [0, 20], margin: 10, label: 'Schienbeine',
      cueBelow: 'Schienbeine senkrecht halten.',
      cueAbove: 'Fußsohlen zur Decke ausrichten: Schienbeine senkrecht über die Knie.',
      why: 'Senkrechte Schienbeine zeigen, dass die Hüften sich gleichmäßig öffnen.', weight: 2,
    },
    {
      id: 'ananda_balasana.knees_bent', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [55, 115], margin: 10, label: 'Knie',
      cueBelow: 'Knie nicht zu eng beugen.',
      cueAbove: 'Knie stärker beugen: Fersen Richtung Decke, Füße über den Knien.',
      why: 'Der rechte Winkel in den Knien gibt der Hüfte Raum zum Öffnen.', weight: 2,
    },
    {
      id: 'ananda_balasana.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Rumpf liegt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rücken ablegen: Kreuzbein und Schultern auf den Boden, Kopf nicht anheben.',
      why: 'Der ruhige Rücken am Boden lässt die Hüften frei arbeiten.', weight: 2,
    },
    {
      id: 'ananda_balasana.knees_level', view: 'front', measure: tilt('left_knee', 'right_knee', 'horizontal'),
      range: [0, 10], margin: 6, label: 'Knie auf gleicher Höhe',
      cueBelow: 'Knie gleich hoch halten.',
      cueAbove: 'Beide Knie gleichmäßig zu den Achseln ziehen, nicht schief liegen.',
      why: 'Gleiche Höhe der Knie zeigt eine gleichmäßige Öffnung beider Hüften.', weight: 1,
    },
  ],

  // -------------------------------------------------------- Supta Virasana
  supta_virasana: [
    {
      id: 'supta_virasana.knees_folded', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [0, 50], margin: 10, label: 'Knie',
      cueBelow: 'Knie nicht zu eng zusammenklappen.',
      cueAbove: 'Fersen neben die Hüften: Knie tiefer beugen, Unterschenkel unter die Oberschenkel schieben.',
      why: 'Die tief gebeugten Knie dehnen die Vorderseite der Oberschenkel.', weight: 3,
    },
    {
      id: 'supta_virasana.thighs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Oberschenkel',
      cueBelow: 'Oberschenkel am Boden halten.',
      cueAbove: 'Knie Richtung Boden sinken lassen: Rumpf höher auf Polster, bis die Oberschenkel liegen.',
      why: 'Die Knie bleiben am Boden, damit die Dehnung in den Oberschenkeln und nicht im Rücken stattfindet.', weight: 3,
    },
    {
      id: 'supta_virasana.trunk_reclined', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 45], margin: 10, label: 'Rumpf zurückgelehnt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rücken weiter zurücklehnen, Polster unter den Rumpf legen und Brustbein heben.',
      why: 'Der zurückgelehnte Rumpf öffnet die Vorderseite des Körpers.', weight: 2,
    },
    {
      id: 'supta_virasana.knees_together', view: 'front', measure: offset('left_knee', 'right_knee', 'x', undefined, true),
      range: [0, 0.6], margin: 0.15, label: 'Knieabstand',
      cueBelow: 'Knie zusammen halten.',
      cueAbove: 'Knie näher zusammenbringen: nicht auseinanderfallen lassen, Oberschenkel nach innen drehen.',
      why: 'Die Knie zeigen nach vorn und bleiben beisammen, damit die Kniegelenke geschützt sind.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Anantasana (lead = oberes, angehobenes Bein)
  anantasana: [
    {
      id: 'anantasana.lifted_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [160, 180], label: 'Angehobenes Bein',
      cueBelow: 'Oberes Knie strecken: Ferse nach oben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das lange obere Bein dehnt die Rückseite und gibt der Haltung ihre Länge.', weight: 3,
    },
    {
      id: 'anantasana.lifted_leg_vertical', view: 'side', measure: tilt('lead_hip', 'lead_ankle', 'vertical'),
      range: [0, 25], margin: 10, label: 'Bein senkrecht',
      cueBelow: 'Bein senkrecht halten.',
      cueAbove: 'Bein senkrecht nach oben bringen: Ferse über die Hüfte, Fuß nicht zum Kopf sinken lassen.',
      why: 'Das senkrechte Bein steht über dem Becken und belastet nicht den Rücken.', weight: 2,
    },
    {
      id: 'anantasana.floor_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Unteres Bein',
      cueBelow: 'Unteres Bein strecken: Ferse wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht durchdrücken: Kniescheibe hoch.',
      why: 'Das untere Bein ist der stabile Anker der Seitlage.', weight: 2,
    },
    {
      id: 'anantasana.body_line', view: 'side', measure: angle('mid_shoulder', 'trail_hip', 'trail_ankle'),
      range: [165, 180], label: 'Körperlinie',
      cueBelow: 'Körper strecken: Schultern, Becken und unterer Fuß in einer Linie.',
      cueAbove: 'Körper in einer Linie halten: Hüfte nicht nach hinten oder vorn wegdrehen.',
      why: 'Die gerade Linie vom Kopf zum Fuß hält den Körper in der Seitlage lang.', weight: 3,
    },
    {
      id: 'anantasana.body_flat', view: 'side', measure: tilt('mid_shoulder', 'trail_ankle', 'horizontal'),
      range: [0, 15], margin: 8, label: 'Körper liegt waagrecht',
      cueBelow: 'Körper waagrecht halten.',
      cueAbove: 'Körper entlang der Matte ausrichten: Kopf, Rumpf und Beine auf einer Linie.',
      why: 'Der Körper liegt in einer Ebene auf dem Boden – die Grundlage für das Anheben des Beins.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Urdhva Prasarita Padasana
  urdhva_prasarita_padasana: [
    {
      id: 'urdhva_prasarita_padasana.legs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Beine senkrecht',
      cueBelow: 'Beine senkrecht halten.',
      cueAbove: 'Beine senkrecht nach oben bringen: Fersen über die Hüften.',
      why: 'Senkrechte Beine liegen über dem Becken und entlasten den unteren Rücken.', weight: 3,
    },
    {
      id: 'urdhva_prasarita_padasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel anspannen, Kniescheiben hochziehen.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Aktive, gestreckte Beine halten die Haltung ohne Zittern.', weight: 2,
    },
    {
      id: 'urdhva_prasarita_padasana.trunk_flat', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'horizontal'),
      range: [0, 12], margin: 8, label: 'Rumpf liegt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rücken ablegen: Kreuzbein auf den Boden, Kopf und Schultern entspannt.',
      why: 'Der Rumpf liegt ruhig; nur die Beine arbeiten.', weight: 2,
    },
    {
      id: 'urdhva_prasarita_padasana.hip_right_angle', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [75, 110], margin: 10, label: 'Hüftwinkel',
      cueBelow: 'Beine etwas weiter vom Rumpf weg senken.',
      cueAbove: 'Beine näher zum Rumpf bringen: Hüfte in rechtem Winkel beugen.',
      why: 'Der rechte Winkel zwischen Rumpf und Beinen zeigt, dass die Hüfte frei arbeitet.', weight: 1,
    },
  ],
};
