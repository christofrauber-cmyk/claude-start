import type { Measure, Rule } from '../../core/types';

/*
 * Iyengar-Regelwerk, Ergänzung 3 (ENTWURF – fachlich zu prüfen).
 * Gleiche Konventionen wie in iyengar.ts: Kameras relativ zur MATTE ('front' = kurze Kante,
 * 'side' = lange Kante), Winkel = Innenwinkel 0..180 (180 = gestreckt), tilt = Abweichung von
 * Senkrechter/Waagrechter, offset in Rumpflängen. Bei umgekehrten Haltungen und Sitzen wirken
 * die Bereiche absichtlich großzügig (Messrauschen ±5–8°).
 *
 * Lead/Trail bei einseitigen Haltungen (Seite im Schritt, "… rechts"):
 *  - Bharadvajasana: lead = Seite, zu der BEINE und KNIE zeigen; gedreht wird zur Gegenseite.
 *      (kein sideCue; die Regeln verwenden bewusst nur symmetrische Messungen, lead/trail kommt nicht vor.)
 *  - Jathara Parivartanasana: lead = Seite, zu der die Beine abgesenkt werden (kein sideCue; nicht in Regeln verwendet).
 *  - Parivrtta Janu Sirsasana (sideCue straightKnee): lead = das GESTRECKTE Bein; trail = gebeugtes Bein.
 *  - Parivrtta Utkatasana: lead = Drehseite (zu ihr wird gedreht, der Gegenellbogen liegt außen
 *      am lead-Knie); kein sideCue, nicht in Regeln verwendet.
 *  - Gomukhasana: lead = Seite des OBEREN Knies (kein sideCue; nicht in Regeln verwendet).
 *  - Hanumanasana: lead = Seite des VORDEREN Beins; trail = hinteres Bein (kein sideCue; im Schritt genannt).
 *  - Eka Pada Rajakapotasana (bentKnee): lead = das vordere, stärker gebeugte Knie; trail = nach hinten gestrecktes Bein.
 *  - Utthan Pristhasana (bentKnee): lead = das vordere gebeugte Knie; trail = hinteres, angehobenes Bein.
 *
 * Kamerahinweise: Im Sitz/Stand mit Blick zur Mattenfront zeigt 'side' die Sagittalebene (Rumpfneigung,
 * Beinwinkel), 'front' die Frontalebene (Schultern, Becken, Knie auf gleicher Höhe).
 * Bei Rajakapotasana liegt das vordere Schienbein quer zur Matte; es wird deshalb nur in 'front'
 * (nicht kodiert) gesehen, das hintere Bein dagegen in 'side'.
 *
 * NACH DER PRÜFUNG GESTRICHEN (Falschalarm-Risiko, doppelte Aussage oder Sicherheit):
 *   Schulterlinien (Sitzhaltungen, Bharadvajasana, Baddha Konasana, Gomukhasana: gehobener Arm kippt die Schultern
 *   absichtlich, Eka Pada Rajakapotasana), Schulter-über-Hüfte (doppelt zum Rumpf aufrecht), Ohr über Schulter,
 *   gestrecktes Bein am Boden (Janu Sirsasana), Knie-Höhe im gedrehten Stuhl (Segment zu kurz), Hüftlinie Utthan Pristhasana,
 *   Füße-heben Navasana (doppelt zum V-Winkel). Knie-Cues in Padmasana, Baddha Konasana: nie nach unten drücken.
 *
 * BEWUSST NICHT KODIERT (aus einer 2D-Kamera mit 33 Punkten nicht belastbar messbar) – Input für die fachliche Prüfung:
 *
 * Bharadvajasana: Drehung von Brustbein und Becken (liegt in der Bildtiefe), Hand/Knie-Bezug, Kopfdrehung,
 *   Beinstellung (Knie zu einer Seite, Füße neben dem Gesäß), Sitzbein-Gewicht und Beckenkippung, Lendenwirbel lang.
 * Jathara Parivartanasana: Beinwinkel zum Rumpf (Drehung in der Bildtiefe), Hüftdrehung, Kreuzbein am Boden,
 *   Beine zusammen, Fußabstand zum Boden, Rippenöffnung, Bodenkontakt der Schulterblätter (nur grob über Schulterhöhe).
 * Parivrtta Janu Sirsasana: Drehung des Rumpfes nach oben (Brustbein zur Decke), Griff der Hände am Fuß,
 *   Seitneige vs. Drehung getrennt, Knie-Öffnung des gebeugten Beins, Wirbelsäulenlänge, Kopf zum Bein.
 * Parivrtta Utkatasana: Rumpfdrehung, Ellbogen außen am Knie, Handflächen zusammen vor der Brust, Knie-Abstand,
 *   Beckenrotation (Hüften quadrat), Gewicht auf Fersen, Wirbelsäulenlänge.
 * Sukhasana / Siddhasana / Padmasana: Fußposition (Fersen am Damm bzw. Füße in den Leisten, Fußsohlen nach oben),
 *   Beckenkippung und Sitzbein-Gewicht, Wirbelsäulenkonkavität, Handhaltung, Beinkreuzung (rechts/links wechseln),
 *   Knie-Außenrotation und Gelenkschutz bei Padmasana (Kniegelenk nicht verdrehen!).
 * Virasana: Fußspann am Boden, Zehen gerade nach hinten, Fersen neben den Hüften, Waden nach außen gedreht,
 *   Sitzbeine auf Boden bzw. Block, Knie-Schmerz (Warnung: Block unterlegen).
 * Baddha Konasana: Fußsohlen aneinander, Fersen am Damm, Knie-Öffnung nur frontal grob, Beckenkippung, Griff der Hände an den Füßen,
 *   Schulterblätter und Brustbein.
 * Gomukhasana: Armbindung (Hände hinter dem Rücken), oberer Ellbogen am Ohr, Fingerhaken, Knie-Überlagerung (exakt
 *   übereinander), Fersen neben den Hüften, Sitzbein-Gewicht auf beiden Seiten.
 * Hanumanasana: Beckenquadratstellung (Hüftachse zur Mattenkante), hinteres Knie nach unten, vorderer Fuß/Zehenstellung,
 *   Hände am Boden vs. Blöcke, Hohlkreuz, Beinrotation, Handstellung am Boden.
 * Eka Pada Rajakapotasana: Schienbeinwinkel des vorderen Beins (quer zur Matte, in 'side' verkürzt), Beckenkippung und
 *   Hohlkreuz, Beckenneigung zur Seite (Sitzbein am Boden), Fuß-/Zehenstellung des hinteren Beins, Rückbeuge von Brustbein
 *   und Nacken, Armstellung (Hände am Boden oder am Fuß).
 * Utthan Pristhasana: Schienbein senkrecht (nur über Knie-Offset), Unterarm-Position am Boden, hintere Ferse aktiv,
 *   Tiefe des Beckens (Hüftbeuger-Dehnung), Beckenrotation, Kniescheibe des hinteren Beins, Rumpflänge.
 * Navasana / Ardha Navasana: Wirbelsäulenstreckung (Rundrücken vs. aufrecht) und Beckenkippung, Gewicht auf den Sitzbeinen,
 *   Zehen-/Fußhaltung, Beinabstand, Handhaltung (Finger hinter dem Kopf bei Ardha), Nacken, Kopf.
 * Tolasana: Fußposition (gekreuzte Beine/Lotus), Hand-Boden-Kontakt und Handgelenkwinkel, Armrotation, Schulterblattlage,
 *   Hebehöhe nur grob (wenige Zentimeter), Zehenstellung, Blick.
 * Sirsasana: Scheitel-Auflage und Gewicht auf Kopf vs. Unterarmen (Sicherheit: Scheitelpunkt!), Ellbogenabstand (schulterbreit),
 *   Schultern aktiv hochschieben, Nacken frei, Beckenstellung, Fußspitzen, Zehen, Hohlkreuz/Rippen.
 * Salamba Sarvangasana: Kinn-Brustbein-Verbindung (Kinnschloss, Nackenlänge – SICHERHEITSKRITISCH), Auflage der Schultern
 *   auf Decken, Hände am Rücken, Ellbogenabstand, Brustbeinhebung, Hohlkreuz, Fußspitzen.
 * Halasana: Nacken/Kinn zur Brust, Hände am Rücken oder Arme am Boden, Beckenlage über Schultern,
 *   Fußspitzen/Beinstreckung auf dem Boden, Hocker/Decke-Unterlage, Brustbeinhebung, Gewicht auf den Schultern.
 * Karnapidasana: Knie-Ohr-Kontakt und Ohr-Druck (Gehör!), Kinn am Brustbein, Fußrücken am Boden, Hände am Rücken,
 *   Beinhaltung beim Einrollen, Kopf-Lage.
 * Pincha Mayurasana: Unterarm-Abstand und Parallelität (Ellbogen schulterbreit), Handflächen/Fingerverteilung,
 *   Schulterblätter nach oben schieben, Blick, Hohlkreuz/Rippen, Beinspalt, Fußspitzen, Gleichgewicht an der Wand.
 */

const angle = (a: string, b: string, c: string): Measure => ({ kind: 'angle', a, b, c });
const tilt = (from: string, to: string, axis: 'vertical' | 'horizontal'): Measure => ({ kind: 'tilt', from, to, axis });
const offset = (a: string, b: string, axis: 'x' | 'y', toward?: string, abs?: boolean): Measure => ({
  kind: 'offset', a, b, axis, ...(toward ? { toward } : {}), ...(abs ? { abs: true } : {}),
});

/**
 * Gemeinsame Sitz-Regeln für Sukhasana, Siddhasana und Padmasana (Beine gekreuzt, Knie sinken):
 * Rumpf aufrecht, Schultern/Becken/Knie gleich hoch, Knie nicht über Hüfthöhe.
 */
function crossLeggedRules(id: string, kneeUp: number, why: { knees: string; spine: string; kneesAbove: string }): Rule[] {
  return [
    {
      id: `${id}.trunk_upright_side`, view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Aufrichten: Sitzbeine in den Boden, Brustbein heben, nicht nach hinten oder vorn sinken.',
      why: why.spine, weight: 3,
    },
    {
      id: `${id}.knees_low`, view: 'side', measure: offset('mid_knee', 'mid_hip', 'y', 'up'),
      range: [-0.6, kneeUp], margin: 0.1, label: 'Knie',
      cueBelow: 'Becken aufrecht halten, nicht nach hinten wegkippen.',
      cueAbove: why.kneesAbove,
      why: why.knees, weight: 2,
    },
    {
      id: `${id}.trunk_vertical_front`, view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf mittig halten: nicht zur Seite kippen, Brustbein über die Beckenmitte.',
      why: 'Beide Sitzbeine tragen gleich, die Mittelachse bleibt senkrecht.', weight: 2,
    },
    {
      id: `${id}.hips_level`, view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen.',
      why: 'Ein schiefes Becken im Sitz verrät ungleiche Beinlage und verkürzt eine Rumpfseite.', weight: 2,
    },
  ];
}

const rules: Record<string, Rule[]> = {
  // ---------------------------------------------------------------- Bharadvajasana
  bharadvajasana: [
    {
      id: 'bharadvajasana.trunk_upright_side', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Wirbelsäule heben, nicht in die Drehung hineinsinken: Brustbein hoch, Rumpf lang.',
      why: 'Die Drehung beginnt aus einer langen, senkrechten Wirbelsäule und nicht aus einem eingesunkenen Rücken.', weight: 3,
    },
    {
      id: 'bharadvajasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Nicht zur Seite kippen: Wirbelsäule senkrecht, Brustbein über der Beckenmitte, dann erst drehen.',
      why: 'Die Wirbelsäule dreht sich um die senkrechte Achse; seitliches Kippen verkürzt eine Rumpfseite.', weight: 3,
    },
    {
      id: 'bharadvajasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine am Boden halten: das Gesäß der Beinseite nicht anheben, Decke unterlegen.',
      why: 'Beide Sitzbeine bleiben schwer, damit die Drehung aus der Wirbelsäule und nicht aus dem Becken kommt.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Jathara Parivartanasana
  jathara_parivartanasana: [
    {
      id: 'jathara_parivartanasana.legs_straight', view: 'front', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [160, 180], margin: 10, label: 'Beine',
      cueBelow: 'Knie strecken: Fersen weit wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Beine aktiv.',
      why: 'Die gestreckten Beine sind die Hebel der Drehung; gebeugte Knie nehmen ihr die Wirkung.', weight: 2,
    },
    {
      id: 'jathara_parivartanasana.shoulders_flat', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Schultern am Boden',
      cueBelow: 'Schultern am Boden halten.',
      cueAbove: 'Beide Schulterblätter auf den Boden drücken: Schultern gleich schwer, Arme in Linie.',
      why: 'Die Schultern bleiben am Boden, während sich Becken und Beine drehen: so dreht sich die Wirbelsäule, nicht der ganze Körper.', weight: 3,
    },
    {
      id: 'jathara_parivartanasana.arms_in_line', view: 'front', measure: tilt('left_wrist', 'right_wrist', 'horizontal'),
      range: [0, 12], margin: 10, label: 'Arme in Linie',
      cueBelow: 'Arme in einer Linie halten.',
      cueAbove: 'Arme seitlich in einer Linie auf dem Boden ausbreiten, Handflächen nach unten drücken.',
      why: 'Die ausgebreiteten Arme verankern den Oberkörper am Boden und lassen die Beine als Gegengewicht wirken.', weight: 1,
    },
  ],

  // ---------------------------------------------------------------- Parivrtta Janu Sirsasana
  parivrtta_janu_sirsasana: [
    {
      id: 'parivrtta_janu_sirsasana.straight_leg', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie strecken: Oberschenkel in den Boden drücken, Ferse vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein ist fest und aktiv; über ihm kippt der Rumpf in die Seitbeuge.', weight: 3,
    },
    {
      id: 'parivrtta_janu_sirsasana.bent_knee', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [25, 110], margin: 15, label: 'Gebeugtes Knie',
      cueBelow: 'Ferse des gebeugten Beins näher an die Leiste ziehen.',
      cueAbove: 'Gebeugtes Knie weiter beugen: Ferse zur Leiste, Knie zur Seite sinken lassen.',
      why: 'Die Ferse des gebeugten Beins liegt nahe der Leiste, das Knie öffnet sich zur Seite.', weight: 2,
    },
    {
      id: 'parivrtta_janu_sirsasana.side_bend', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'lead_ankle'),
      range: [0, 75], margin: 25, label: 'Seitbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Rumpf weiter über das gestreckte Bein seitlich lehnen, Seite lang halten, Brustbein zur Decke drehen.',
      why: 'Der Rumpf lehnt sich in die Seitbeuge über das gestreckte Bein; die untere Seite bleibt lang.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Parivrtta Utkatasana
  parivrtta_utkatasana: [
    {
      id: 'parivrtta_utkatasana.knee_angle', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [85, 140], margin: 10, label: 'Knie',
      cueBelow: 'Etwas höher kommen: Oberschenkel möglichst waagrecht, Knie nicht tiefer als Hüfte.',
      cueAbove: 'Knie tiefer beugen: Gesäß zurück, Oberschenkel Richtung Waagrechte.',
      why: 'Wie im Stuhl arbeiten die Oberschenkel kräftig; sie tragen die Drehung des Rumpfes.', weight: 3,
    },
    {
      id: 'parivrtta_utkatasana.knee_over_ankle', view: 'side', measure: offset('mid_knee', 'mid_ankle', 'x', 'forward'),
      range: [-0.05, 0.6], margin: 0.12, label: 'Knie über Fuß',
      cueBelow: 'Knie etwas mehr nach vorn beugen.',
      cueAbove: 'Gewicht in die Fersen, Gesäß zurück: Knie nicht zu weit über die Zehen schieben.',
      why: 'Das Gewicht bleibt auf den Fersen, damit die Knie in der Drehung nicht überlastet werden.', weight: 1,
    },
    {
      id: 'parivrtta_utkatasana.trunk_lean', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [5, 50], margin: 12, label: 'Rumpfneigung',
      cueBelow: 'Rumpf leicht nach vorn neigen, damit die Wirbelsäule über dem Becken im Gleichgewicht bleibt.',
      cueAbove: 'Brustbein heben, Rumpf aufrichten: nicht über die Oberschenkel fallen lassen.',
      why: 'Der Rumpf bleibt lang und hebt sich aus dem Becken, bevor er sich dreht.', weight: 2,
    },
    {
      id: 'parivrtta_utkatasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüften gleich hoch, Gewicht auf beide Fersen.',
      why: 'Das Becken bleibt als stabile Basis; die Drehung kommt aus der Wirbelsäule.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Sukhasana
  sukhasana: crossLeggedRules('sukhasana', 0.2, {
    knees: 'Im leichten Sitz liegen die Hüften höher als die Knie, damit das Becken aufrecht bleibt.',
    spine: 'Im Sitz richtet sich die Wirbelsäule senkrecht aus dem Becken auf; das ist die Grundlage von Atem und Konzentration.',
    kneesAbove: 'Knie höher als Hüften: Decke oder Block unter das Gesäß legen, bis die Hüften höher sind.',
  }),

  // ---------------------------------------------------------------- Padmasana
  padmasana: crossLeggedRules('padmasana', 0.1, {
    knees: 'Im Lotussitz sinken beide Knie zum Boden; schwebende Knie zeigen, dass die Hüften noch nicht genug öffnen (nie mit dem Knie erzwingen).',
    spine: 'Im Lotussitz steht die Wirbelsäule senkrecht auf dem Becken, Rücken und Brustbein heben sich.',
    kneesAbove: 'Die Knie sind hoch: Decke unter das Gesäß legen oder erst Halblotus üben. Knie nie nach unten drücken.',
  }),

  // ---------------------------------------------------------------- Siddhasana
  siddhasana: crossLeggedRules('siddhasana', 0.15, {
    knees: 'Im Siddhasana sinken die Knie zum Boden, die Ferse drückt gegen den Damm; Hüften höher als Knie.',
    spine: 'Im Siddhasana steht die Wirbelsäule senkrecht über den Sitzbeinen.',
    kneesAbove: 'Knie höher als Hüften: Decke oder Block unter das Gesäß legen, bis die Hüften höher sind.',
  }),

  // ---------------------------------------------------------------- Virasana
  virasana: [
    {
      id: 'virasana.trunk_upright_side', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Aufrichten: Sitzbeine auf Block oder Boden, Brustbein heben, nicht zurücklehnen.',
      why: 'Im Heldensitz steht die Wirbelsäule senkrecht über dem Becken, die Sitzbeine tragen.', weight: 3,
    },
    {
      id: 'virasana.knee_flexion', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [0, 65], margin: 20, label: 'Knie gebeugt',
      cueBelow: 'Knie vollständig beugen.',
      cueAbove: 'Becken tiefer zwischen die Füße sinken lassen: Block oder Decke unter die Sitzbeine, Knie nicht erzwingen.',
      why: 'Die Knie sind tief gebeugt und das Becken sitzt zwischen den Füßen; ein Block schützt die Kniegelenke.', weight: 2,
    },
    {
      id: 'virasana.knees_together', view: 'front', measure: offset('left_knee', 'right_knee', 'x', undefined, true),
      range: [0, 0.4], margin: 0.12, label: 'Knie zusammen',
      cueBelow: 'Knie nah beieinander halten.',
      cueAbove: 'Knie zusammenführen: Oberschenkel nach innen drehen, Knie nebeneinander.',
      why: 'Die Knie bleiben dicht zusammen, die Schienbeine liegen gerade neben den Hüften.', weight: 2,
    },
    {
      id: 'virasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf mittig halten: Brustbein über die Beckenmitte, nicht zur Seite kippen.',
      why: 'Beide Sitzbeine tragen gleich, die Mittelachse bleibt senkrecht.', weight: 2,
    },
    {
      id: 'virasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Block oder Boden drücken, Becken ausgleichen.',
      why: 'Ein gerades Becken zeigt, dass beide Beine gleich gebeugt sind.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Baddha Konasana
  baddha_konasana: [
    {
      id: 'baddha_konasana.trunk_upright_side', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 10], label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Aufrichten: Sitzbeine in den Boden, Brustbein heben, Decke unterlegen, damit das Becken nicht kippt.',
      why: 'Im Schmetterling steht die Wirbelsäule senkrecht aus dem aufrechten Becken.', weight: 3,
    },
    {
      id: 'baddha_konasana.knees_down', view: 'front', measure: offset('mid_knee', 'mid_hip', 'y', 'up'),
      range: [-0.6, 0.2], margin: 0.1, label: 'Knie',
      cueBelow: 'Knie sinken lassen.',
      cueAbove: 'Knie nur sinken lassen, nicht nach unten drücken: Decken oder Blöcke unter die Knie legen.',
      why: 'Die Knie sinken von allein, wenn die Oberschenkel außen drehen und die Leisten weich werden.', weight: 2,
    },
    {
      id: 'baddha_konasana.knees_level', view: 'front', measure: tilt('left_knee', 'right_knee', 'horizontal'),
      range: [0, 10], label: 'Knie gleich hoch',
      cueBelow: 'Knie auf gleicher Höhe halten.',
      cueAbove: 'Beide Knie gleich tief sinken lassen: Becken ausgleichen, beide Sitzbeine am Boden.',
      why: 'Gleich tiefe Knie zeigen gleichmäßige Hüftöffnung; ein Knie hängt oft an einem schiefen Becken.', weight: 2,
    },
    {
      id: 'baddha_konasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen.',
      why: 'Das gerade Becken ist die Basis für gleiche Beinöffnung.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Gomukhasana
  gomukhasana: [
    {
      id: 'gomukhasana.trunk_upright_side', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Aufrichten: Sitzbeine in den Boden, Brustbein heben, nicht in die Armbindung hineinsinken.',
      why: 'Die senkrechte Wirbelsäule trägt die Armbindung und öffnet den Brustkorb.', weight: 3,
    },
    {
      id: 'gomukhasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf mittig halten: Brustbein über die Beckenmitte, nicht zur Seite kippen.',
      why: 'Die Mittelachse bleibt senkrecht, auch wenn ein Arm oben und einer unten bindet.', weight: 2,
    },
    {
      id: 'gomukhasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken: Decke unter das höhere Sitzbein.',
      why: 'Gleiches Gewicht auf beiden Sitzbeinen, obwohl die Beine gekreuzt sind.', weight: 2,
    },
    {
      id: 'gomukhasana.knees_stacked', view: 'front', measure: offset('left_knee', 'right_knee', 'x', undefined, true),
      range: [0, 0.2], margin: 0.1, label: 'Knie übereinander',
      cueBelow: 'Knie übereinander halten.',
      cueAbove: 'Knie genau übereinander in der Mitte: oberen Oberschenkel nach innen drehen, Decke unterlegen.',
      why: 'Die Knie liegen übereinander in der Mittellinie; so bleiben die Sitzbeine unter dem Rumpf.', weight: 3,
    },
  ],

  // ---------------------------------------------------------------- Hanumanasana
  hanumanasana: [
    {
      id: 'hanumanasana.split_angle', view: 'side', measure: angle('lead_ankle', 'mid_hip', 'trail_ankle'),
      range: [150, 180], margin: 25, label: 'Spagat',
      cueBelow: 'Becken Richtung Boden sinken lassen, Blöcke unter die Hände: nicht erzwingen.',
      cueAbove: 'Beine in einer Linie halten.',
      why: 'Der Spagat bildet eine gerade Linie zwischen vorderem und hinterem Bein.', weight: 2,
    },
    {
      id: 'hanumanasana.front_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Vorderes Bein',
      cueBelow: 'Vorderes Knie strecken: Ferse vorschieben, Oberschenkel fest.',
      cueAbove: 'Vorderes Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das vordere Bein bleibt gestreckt und aktiv, damit sich die Rückseite gleichmäßig dehnt.', weight: 3,
    },
    {
      id: 'hanumanasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Kniescheibe zum Boden, Oberschenkel nach hinten schieben.',
      cueAbove: 'Hinteres Knie nicht überstrecken.',
      why: 'Das hintere Bein bleibt gestreckt; seine Vorderseite öffnet sich zur Leiste.', weight: 3,
    },
    {
      id: 'hanumanasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 15], margin: 10, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Brustbein heben, Rumpf senkrecht über dem Becken: weder nach vorn über das vordere Bein fallen noch zurücklehnen.',
      why: 'Der Rumpf bleibt lang und senkrecht, während die Beine den Spagat öffnen.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Eka Pada Rajakapotasana
  eka_pada_rajakapotasana: [
    {
      id: 'eka_pada_rajakapotasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [150, 180], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel zum Boden, Ferse weit zurückschieben.',
      cueAbove: 'Hinteres Knie nicht überstrecken.',
      why: 'Das nach hinten gestreckte Bein bildet die lange Linie, in die sich Becken und Brustkorb öffnen.', weight: 2,
    },
    {
      id: 'eka_pada_rajakapotasana.back_leg_on_floor', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'horizontal'),
      range: [0, 15], margin: 10, label: 'Hinteres Bein am Boden',
      cueBelow: 'Hinteres Bein am Boden lassen.',
      cueAbove: 'Hinteres Bein auf den Boden drücken, Knie nicht anheben.',
      why: 'Das hintere Bein ruht am Boden und verankert das Becken für die Rückbeuge.', weight: 2,
    },
    {
      id: 'eka_pada_rajakapotasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 20], margin: 10, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Brustbein heben und aufrichten, nicht über das vordere Bein fallen: Wirbelsäule von unten verlängern.',
      why: 'Der Rumpf hebt sich aus dem Becken; erst aus dieser Länge entsteht die Rückbeuge.', weight: 3,
    },
    {
      id: 'eka_pada_rajakapotasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken gerade halten: das vordere Sitzbein nicht anheben, Decke unter die Hüfte legen.',
      why: 'Beide Hüften zeigen gerade nach vorn, damit sich das hintere Bein nicht verdreht.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Utthan Pristhasana
  utthan_pristhasana: [
    {
      id: 'utthan_pristhasana.front_knee', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [70, 110], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie etwas weniger beugen: Schritt weiter öffnen.',
      cueAbove: 'Vorderes Knie tiefer beugen: Becken weiter zum Boden sinken lassen.',
      why: 'Das vordere Knie bildet etwa einen rechten Winkel; das Becken sinkt tief zwischen die Hände.', weight: 3,
    },
    {
      id: 'utthan_pristhasana.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.2, 0.2], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse: Schritt weiter öffnen, Schienbein möglichst senkrecht.',
      why: 'Das Knie schiebt nicht über den Fuß hinaus und wird nicht überlastet.', weight: 3,
    },
    {
      id: 'utthan_pristhasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [160, 180], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Ferse weit zurückschieben, Oberschenkel fest und angehoben.',
      cueAbove: 'Hinteres Knie nicht überstrecken.',
      why: 'Das angehobene hintere Bein bleibt gestreckt und aktiv; so öffnet sich die Leiste.', weight: 3,
    },
    {
      id: 'utthan_pristhasana.back_leg_line', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'horizontal'),
      range: [0, 25], margin: 10, label: 'Hinteres Bein',
      cueBelow: 'Hinteres Bein in einer langen Linie halten.',
      cueAbove: 'Hinteres Bein auf einer Linie mit dem Rumpf nach hinten strecken, Ferse zurück, Bein nicht abwinkeln.',
      why: 'Das hintere Bein verlängert den Rumpf in einer Linie nach hinten.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Navasana
  navasana: [
    {
      id: 'navasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen weit wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Die gestreckten Beine bilden mit dem Rumpf das V des Bootes.', weight: 3,
    },
    {
      id: 'navasana.v_angle', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [40, 85], margin: 12, label: 'V-Winkel',
      cueBelow: 'Beine etwas senken oder Rumpf etwas zurücklehnen: das V öffnet sich.',
      cueAbove: 'Beine höher, Rumpf aufrechter: V enger schließen, Brustbein zu den Zehen.',
      why: 'Rumpf und Beine bilden ein offenes V auf den Sitzbeinen; es entsteht aus der Kraft der Bauch- und Beinmuskeln.', weight: 3,
    },
    {
      id: 'navasana.trunk_lean', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [10, 50], margin: 10, label: 'Rumpfneigung',
      cueBelow: 'Rumpf etwas zurücklehnen, Gleichgewicht auf den Sitzbeinen.',
      cueAbove: 'Brustbein heben, Rumpf aufrichten: nicht in die Rückenlehne sinken, Wirbelsäule lang.',
      why: 'Der Rumpf lehnt sich nur so weit zurück, dass die Wirbelsäule lang und das Brustbein offen bleibt.', weight: 2,
    },
    {
      id: 'navasana.arms_parallel', view: 'side', measure: tilt('mid_shoulder', 'mid_wrist', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Arme parallel',
      cueBelow: 'Arme parallel zum Boden halten.',
      cueAbove: 'Arme parallel zum Boden nach vorn strecken, Schultern weg von den Ohren.',
      why: 'Die waagrechten Arme geben Gleichgewicht und halten die Brust offen.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Ardha Navasana
  ardha_navasana: [
    {
      id: 'ardha_navasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen weit wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Die gestreckten Beine tragen das Gewicht in der halb liegenden Haltung.', weight: 3,
    },
    {
      id: 'ardha_navasana.legs_lifted', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [10, 55], margin: 12, label: 'Beine gehoben',
      cueBelow: 'Beine etwas höher heben, Füße vom Boden lösen.',
      cueAbove: 'Beine etwas senken: so tief, dass der untere Rücken lang bleibt.',
      why: 'Die Beine schweben schräg über dem Boden; Bauch und Hüftbeuger halten sie.', weight: 2,
    },
    {
      id: 'ardha_navasana.trunk_lowered', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [10, 60], margin: 12, label: 'Rumpf zurückgelehnt',
      cueBelow: 'Rumpf etwas anheben: Brustbein heben, Rücken lang.',
      cueAbove: 'Rumpf weiter zurücklehnen, aber den Rücken lang halten.',
      why: 'Der Rumpf lehnt sich zurück, ohne dass der untere Rücken durchhängt.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Tolasana
  tolasana: [
    {
      id: 'tolasana.left_arm_straight', view: 'front', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [160, 180], margin: 10, label: 'Linker Arm',
      cueBelow: 'Linken Arm strecken: in die Hand drücken, Schulter weg vom Ohr.',
      cueAbove: 'Linken Ellbogen nicht überstrecken.',
      why: 'Die gestreckten Arme tragen den Körper; gebeugte Ellbogen kosten Höhe und Kraft.', weight: 3,
    },
    {
      id: 'tolasana.right_arm_straight', view: 'front', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [160, 180], margin: 10, label: 'Rechter Arm',
      cueBelow: 'Rechten Arm strecken: in die Hand drücken, Schulter weg vom Ohr.',
      cueAbove: 'Rechten Ellbogen nicht überstrecken.',
      why: 'Die gestreckten Arme tragen den Körper; gebeugte Ellbogen kosten Höhe und Kraft.', weight: 3,
    },
    {
      id: 'tolasana.hips_lifted', view: 'side', measure: offset('mid_hip', 'mid_wrist', 'y', 'up'),
      range: [0.15, 1.5], margin: 0.08, label: 'Becken gehoben',
      cueBelow: 'Becken vom Boden lösen: Hände in den Boden drücken, Schultern nach unten schieben.',
      cueAbove: 'Gleichgewicht über den Händen halten, Becken nur so hoch wie nötig.',
      why: 'Das Becken schwebt über dem Boden, getragen von den Armen und der Kraft der Schultern.', weight: 3,
    },
    {
      id: 'tolasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 18], margin: 10, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht über die Beine hängen.',
      why: 'Ein aufrechter Rumpf zeigt, dass das Gewicht über den Händen im Gleichgewicht liegt.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Sirsasana (nur robuste Linien)
  sirsasana: [
    {
      id: 'sirsasana.body_vertical_side', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Körperachse',
      cueBelow: 'Körperachse senkrecht halten.',
      cueAbove: 'Körper in eine senkrechte Linie bringen: Becken über die Schultern, Fersen über das Becken, nicht ins Hohlkreuz kippen.',
      why: 'Im Kopfstand steht der Körper in einer senkrechten Linie über dem Scheitel, die Last liegt nicht auf dem Nacken.', weight: 3,
    },
    {
      id: 'sirsasana.body_vertical_front', view: 'front', measure: tilt('mid_shoulder', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Körperachse seitlich',
      cueBelow: 'Körperachse senkrecht halten.',
      cueAbove: 'Nicht zur Seite kippen: Beine und Becken genau über den Schultern, beide Seiten gleich lang.',
      why: 'Die Linie steht auch seitlich senkrecht über dem Scheitel; so bleibt das Gleichgewicht ohne Gewicht auf einer Seite.', weight: 3,
    },
    {
      id: 'sirsasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen nach oben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Gestreckte, aktive Beine verlängern die Körperachse nach oben und halten das Gleichgewicht.', weight: 1,
    },
  ],

  // ---------------------------------------------------------------- Salamba Sarvangasana (nur robuste Linien)
  salamba_sarvangasana: [
    {
      id: 'salamba_sarvangasana.legs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'vertical'),
      range: [0, 10], margin: 8, label: 'Beine senkrecht',
      cueBelow: 'Beine senkrecht halten.',
      cueAbove: 'Beine gerade nach oben strecken, Fersen über die Hüften.',
      why: 'Im Schulterstand zeigen die Beine gerade zur Decke, das Gewicht ruht auf den Schultern.', weight: 3,
    },
    {
      id: 'salamba_sarvangasana.trunk_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'vertical'),
      range: [0, 18], margin: 10, label: 'Rumpf senkrecht',
      cueBelow: 'Rumpf senkrecht halten.',
      cueAbove: 'Rumpf weiter aufrichten: Hände stützen den Rücken, Brustbein zum Kinn, Becken über die Schultern.',
      why: 'Der Rumpf steht möglichst senkrecht auf den Schultern; Hände stützen, der Nacken trägt kein Gewicht.', weight: 3,
    },
    {
      id: 'salamba_sarvangasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen nach oben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Gestreckte Beine verlängern die Körperlinie und halten das Gleichgewicht.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Halasana (nur robuste Linien)
  halasana: [
    {
      id: 'halasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen wegschieben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Die gestreckten Beine ziehen sich weit über den Kopf und halten das Becken oben.', weight: 3,
    },
    {
      id: 'halasana.trunk_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'vertical'),
      range: [0, 18], margin: 10, label: 'Rumpf senkrecht',
      cueBelow: 'Rumpf senkrecht halten.',
      cueAbove: 'Rumpf aufrichten: Hände am Rücken, Becken über die Schultern, Brustbein zum Kinn.',
      why: 'Der Rumpf steht möglichst senkrecht, die Beine fallen aus dem Becken nach hinten.', weight: 3,
    },
    {
      id: 'halasana.feet_to_floor', view: 'side', measure: offset('mid_ankle', 'mid_shoulder', 'y', 'up'),
      range: [-0.35, 0.15], margin: 0.1, label: 'Füße am Boden',
      cueBelow: 'Füße am Boden lassen.',
      cueAbove: 'Füße weiter zum Boden: Zehen aufstellen, oder Hocker bzw. Stuhl hinter den Kopf stellen und Füße ablegen.',
      why: 'Die Füße erreichen den Boden hinter dem Kopf, ohne dass der Nacken hängt; mit Stütze auf Kopfhöhe ebenso gut.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Karnapidasana (nur robuste Linien)
  karnapidasana: [
    {
      id: 'karnapidasana.trunk_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_hip', 'vertical'),
      range: [0, 18], margin: 10, label: 'Rumpf senkrecht',
      cueBelow: 'Rumpf senkrecht halten.',
      cueAbove: 'Rumpf aufrichten: Hände am Rücken, Becken über die Schultern.',
      why: 'Auch mit gebeugten Knien bleibt der Rumpf möglichst senkrecht über den Schultern.', weight: 3,
    },
    {
      id: 'karnapidasana.knees_bent', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [0, 80], margin: 20, label: 'Knie gebeugt',
      cueBelow: 'Knie vollständig beugen.',
      cueAbove: 'Knie tiefer beugen: Schienbeine zum Boden, Knie zu den Ohren.',
      why: 'Die Knie beugen sich tief neben die Ohren, die Schienbeine liegen am Boden.', weight: 2,
    },
    {
      id: 'karnapidasana.knees_by_ears', view: 'side', measure: offset('mid_knee', 'mid_ear', 'y', undefined, true),
      range: [0, 0.5], margin: 0.15, label: 'Knie neben Ohren',
      cueBelow: 'Knie neben den Ohren halten.',
      cueAbove: 'Knie weiter zu den Ohren sinken lassen, Schienbeine am Boden ablegen.',
      why: 'Die Knie liegen neben den Ohren am Boden; das beruhigt Atem und Sinne.', weight: 1,
    },
  ],

  // ---------------------------------------------------------------- Pincha Mayurasana (nur robuste Linien)
  pincha_mayurasana: [
    {
      id: 'pincha_mayurasana.body_vertical_side', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Körperachse',
      cueBelow: 'Körperachse senkrecht halten.',
      cueAbove: 'Körper in eine senkrechte Linie bringen: Becken über die Schultern, Fersen über das Becken, nicht ins Hohlkreuz kippen.',
      why: 'Im Unterarmstand steht der Körper in einer senkrechten Linie über den Unterarmen.', weight: 3,
    },
    {
      id: 'pincha_mayurasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Fersen nach oben, Oberschenkel fest.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Gestreckte, aktive Beine verlängern die Körperlinie und halten das Gleichgewicht.', weight: 2,
    },
    {
      id: 'pincha_mayurasana.body_vertical_front', view: 'front', measure: tilt('mid_shoulder', 'mid_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Körperachse seitlich',
      cueBelow: 'Körperachse senkrecht halten.',
      cueAbove: 'Nicht zur Seite kippen: Beine und Becken genau über den Schultern.',
      why: 'Die Körperachse steht auch seitlich senkrecht über den Unterarmen.', weight: 3,
    },
  ],
};

export const RULES_EXTRA_3: Record<string, Rule[]> = rules;
