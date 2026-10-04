import type { Measure, Rule } from '../../core/types';

/*
 * Iyengar-Regelwerk, Ergänzung 1 (ENTWURF – fachlich zu prüfen).
 * Gleiche Konventionen wie in iyengar.ts: Kameras relativ zur MATTE ('front' = kurze Mattenkante,
 * 'side' = lange Mattenkante), Winkel = Innenwinkel 0..180 (180 = gestreckt), tilt = Abweichung von
 * Senkrechter/Waagrechter, offset in Rumpflängen. Gemessen wird nur in der 2D-Bildebene EINER Kamera.
 *
 * Lead/Trail pro Pose (Seitenwahl passend zum sideCue der Pose; nicht seitige Posen haben kein lead_/trail_):
 *   Parsvottanasana (ohne sideCue): lead = das VORDERE Bein, über das sich der Rumpf beugt ("Parsvottanasana rechts" =
 *     rechtes Bein vorn); trail = hinteres Bein.
 *   Parivrtta Trikonasana (lowerWrist): lead = Seite der UNTEREN Hand. Die untere Hand liegt auf der Gegenseite des
 *     vorderen Fußes, also ist lead das HINTERE Bein und trail das VORDERE Bein; lead_wrist = untere Hand,
 *     trail_wrist = obere Hand.
 *   Parivrtta Parsvakonasana (bentKnee): lead = das stärker gebeugte vordere Knie; trail = gestrecktes hinteres Bein.
 *   Skandasana (bentKnee): lead = das gebeugte Bein (Körpergewicht darauf); trail = das gestreckte Bein.
 *   Utthita Hasta Padangusthasana (higherAnkle): lead = das ANGEHOBENE Bein (Hand am Zeh); trail = Standbein.
 *   Garudasana (higherAnkle): lead = das obenliegende, umschlingende Bein; trail = Standbein.
 *   Natarajasana (higherAnkle): lead = das nach hinten angehobene Bein (Hand am Fuß); trail = Standbein.
 *   Viparita Virabhadrasana (bentKnee): lead = das gebeugte vordere Knie (der Arm über diesem Bein geht nach oben);
 *     trail = gestrecktes hinteres Bein (die hintere Hand gleitet am Bein hinab).
 *   Urdhva Prasarita Eka Padasana (lowerAnkle): lead = STANDBEIN; trail = angehobenes Bein.
 *   Ardha Baddha Padmottanasana (higherAnkle): lead = das angehobene Bein im halben Lotus; trail = Standbein.
 *   Parighasana (straightKnee): lead = das gestreckte Bein (zur Seite); trail = das kniende, gebeugte Bein.
 *   Nicht seitig (nur left_/right_/mid_): Prasarita Padottanasana, Malasana, Utkata Konasana, Padangusthasana,
 *     Padahastasana, Upavistha Konasana.
 *
 * BEWUSST NICHT KODIERT (mit 33 Punkten aus einer 2D-Kamera nicht messbar) – Input für die fachliche Prüfung:
 *
 * Parsvottanasana: Gebetshände hinter dem Rücken (Handflächen, Schulterblätter, Ellbogen – verdeckt); Beckenrotation
 *   (hintere Hüfte nach vorn) nur grob über die Hüftlinie in 'front'; Fußstellung (hinterer Fuß ca. 75–80° einwärts)
 *   und Ferse am Boden; Wirbelsäulenkonkavität; Brustbein zum Schienbein/Kopf zum Knie bei gestreckter Wirbelsäule;
 *   Kniescheiben hoch; Gewicht auf beiden Füßen.
 * Prasarita Padottanasana: Außenkanten der Füße parallel, Fußgewölbe; Gewicht auf den Fersen (Ferse/Ballen);
 *   Wirbelsäule konkav in der halben Vorbeuge; Scheitel zum Boden/Kopfkontakt; Hände auf Höhe der Füße (Tiefe, Bogen
 *   der Arme, Ellbogen); Oberschenkel-Außenrotation; Tiefe des Rumpfes bei Kamera 'front' wegen Verkürzung nicht sicher.
 * Parivrtta Trikonasana: Drehung des Rumpfes (Brustbein/Rippen nach oben gedreht) und Beckenstellung (hintere Hüfte
 *   zurück, Quadratstellung) – Rumpfdrehung ist in 2D nicht erkennbar; Hand außen am vorderen Fuß/Block (Kontakt);
 *   Fußstellung; Kopfdrehung zur oberen Hand; Gewicht gleichmäßig auf beiden Füßen; Gleichgewicht.
 * Parivrtta Parsvakonasana: Rumpfdrehung, Brustkorb nach oben, Ellbogen/Achsel außen am vorderen Knie, Hände in
 *   Namaskar; hinteres Bein: Ferse hoch/Fußrücken, Fußstellung; Beckenhöhe und Beckenrotation; Kopfdrehung;
 *   Tiefe der Beugung der Wirbelsäule; Schulterlinie vertikal.
 * Skandasana: Fußstellung (Zehen des gestreckten Beins nach oben, Ferse am Boden – Heel/Foot-Index zu unsicher);
 *   Wirbelsäulenlänge und Hohlkreuz/Beckenkippung; Knie über Fuß in der Tiefenachse (nur frontal, Außenrotation
 *   nicht erkennbar); Handhaltung; Gewichtsverteilung Ferse/Ballen; Brustbein.
 * Utthita Hasta Padangusthasana: Hüfte des angehobenen Beins nach unten drehen (Beckenrotation); Zehengriff und
 *   Handgelenk; gestreckter Arm; Fuß des Standbeins; Schulterlage (Schulter nicht hochziehen); Blick/Kopf; Rücken
 *   (Hohlkreuz); Kniescheibe hoch am Standbein; Variationen (Bein seitlich oder Stirn zum Knie) nicht unterschieden.
 * Garudasana: Beinverschlingung (Fuß hinter der Wade, Zehen am Standbein) – verdeckt; Armverschlingung
 *   (Handflächen aneinander, Ellbogen auf Schulterhöhe, Daumen zur Nase) – verdeckt und überlagert; Beckenneigung und
 *   Steißbein; Knie des Standbeins nach innen/außen in der Tiefenachse; Rundrücken; Blick.
 * Natarajasana: Griff am Fuß (Handgelenk, Innenrotation der Schulter); Becken nach vorn (Steißbein ein) und
 *   Brustbein nach oben; Ellbogen/Greifarm; vorderer Arm und Blick; Kniegelenk des angehobenen Beins (Knie nicht seitlich
 *   öffnen, Knieparallelität); Hohlkreuz vs. Brustbogen (Verteilung der Rückbeuge) – in 2D nur über wenige Winkel
 *   erkennbar; Bein-Höhe/Tiefe der Rückbeuge nicht bewertet, weil sehr verschieden.
 * Malasana: Fersen am Boden (Heel-Punkte unzuverlässig); Wirbelsäulenlänge, Beckenkippung (Steißbein) und Rundrücken;
 *   Knie nach außen offen – in 2D gegen die Tiefenachse; Handflächen im Anjali Mudra, Ellbogen gegen Knie; Fußstellung
 *   (Zehen nach außen); Oberschenkel-Außenrotation; Kopf/Nacken.
 * Utkata Konasana: Fußstellung (Zehen ca. 45–60° nach außen) und Knieausrichtung über der zweiten Zehe in der
 *   Tiefenachse; Beckenkippung (Steißbein ein, Hohlkreuz); Oberschenkel-Außenrotation; Arme (Gebetshände oder
 *   Kaktus-Arme, Ellbogen auf Schulterhöhe); Brustbein; Gewicht auf den Fersen; Kniescheiben über Zehen.
 * Viparita Virabhadrasana: Rotation des Brustkorbs nach oben; Beckenstellung; Fußstellung (hinterer Fuß ca. 90°);
 *   hintere Hand auf dem Oberschenkel/Schienbein (Kontakt, Tiefe); Kopfdrehung nach oben; Seitdehnung und Brustbein
 *   (Rippenöffnung); vorderer Arm hinter dem Ohr (Armrotation); Schulterblätter; Knie über zweitem Zeh in der Tiefenachse.
 * Urdhva Prasarita Eka Padasana: Hüfte des angehobenen Beins nach unten drehen (Quadratstellung); Fuß des angehobenen
 *   Beins (Zehen, Ferse); Hände am Boden/Griff am Knöchel; Kopf am Standbein; Wirbelsäulenlänge; Standfuß-Gewölbe;
 *   Gewicht auf den Fersen; Rumpf-zu-Bein-Abstand und Stirn zum Schienbein (Kopf/Arme überlagern das Standbein);
 *   Spreizwinkel nur grob, weil Hüft- und Rumpflage verdeckt sind.
 * Ardha Baddha Padmottanasana: Bindung hinter dem Rücken (Hand fasst den Zeh des Lotusfußes) – verdeckt; Position des
 *   Lotusfußes (Ferse am Bauch), Knieöffnung des Lotusbeins (in 2D nicht erkennbar); Fuß-Auflage am Oberschenkel; Rundung
 *   des Rückens (konkav vs. rund); Fingergriff; Hand des freien Arms am Boden/Block; Kniescheibe am Standbein; Gleichgewicht.
 * Parighasana: Beckenstellung und Hüftbeuger des knienden Beins (Hüfte über Knie nur grob); Brustbein nach oben
 *   gedreht; Fußstellung des gestreckten Beins (Zehen nach vorn/oben) und Ferse; Arm hinter dem Ohr und Hand am Fuß
 *   (Griff); Kopfstellung; Rumpfdrehung; Gewicht auf Knie (Polster); untere Rippen; Rumpf über dem gestreckten Bein statt
 *   zusammengesunken – nur über Neigung grob.
 * Padangusthasana: Griff am großen Zeh (Hände, Ellbogen, Zeigefinger–Daumen–Mittelfinger); Wirbelsäulenkonkavität
 *   (halbe Vorbeuge) und Beckenkippung; Gewicht auf Fersen vs. Ballen; Nacken; Kopf zu den Schienbeinen; Ellbogen
 *   abgewinkelt und nach außen; Kniescheiben hoch; Fußparallelität.
 * Padahastasana: Hände unter den Füßen (Handflächen nach oben, Zehen auf den Fingern) – verdeckt; Gewichtsverlagerung
 *   auf die Ballen (nur grob über Hüfte-Fuß-Offset); Wirbelsäulenlänge (rund vs. konkav); Nackenverlängerung; Ellbogen
 *   nach außen; Kniescheiben hoch; Fußparallelität; Schulterblätter.
 * Upavistha Konasana: Kniescheiben und Zehen zur Decke (Beinrotation); Fersenstreckung/Fußaktion; Rumpfaufrichtung
 *   und Hohlkreuz/Beckenkippung (Sitzbeine); Wirbelsäulenkonkavität in der Vorbeuge; Hände an den Füßen/Brust zum
 *   Boden; Beinwinkel bei Kamera 'side' verkürzt; Gewicht auf beiden Sitzbeinen (Beckenrotation); Gleichmäßigkeit der Spreizung.
 */

const angle = (a: string, b: string, c: string): Measure => ({ kind: 'angle', a, b, c });
const tilt = (from: string, to: string, axis: 'vertical' | 'horizontal'): Measure => ({ kind: 'tilt', from, to, axis });
const offset = (a: string, b: string, axis: 'x' | 'y', toward?: string, abs?: boolean): Measure => ({
  kind: 'offset', a, b, axis, ...(toward ? { toward } : {}), ...(abs ? { abs: true } : {}),
});

export const RULES_EXTRA_1: Record<string, Rule[]> = {
  // ------------------------------------------- Parsvottanasana (lead = vorderes Bein, trail = hinteres Bein)
  parsvottanasana: [
    {
      id: 'parsvottanasana.front_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Vorderes Bein',
      cueBelow: 'Vorderes Knie strecken: Oberschenkel hochziehen, Kniescheibe hoch.',
      cueAbove: 'Vorderes Knie nicht überstrecken: Kniescheibe hoch, Oberschenkel zurück.',
      why: 'Das vordere Bein bleibt fest, damit die Vorbeuge aus dem Hüftgelenk kommt und nicht aus dem Rücken.', weight: 3,
    },
    {
      id: 'parsvottanasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Ferse in den Boden.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte hintere Bein verankert die Haltung und gibt den Gegendruck zur Vorbeuge.', weight: 3,
    },
    {
      id: 'parsvottanasana.trunk_fold', view: 'side', measure: angle('mid_shoulder', 'lead_hip', 'lead_knee'),
      range: [10, 100], margin: 12, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten und nicht auf das Bein fallen lassen: Brustbein vorstrecken.',
      cueAbove: 'Tiefer aus der Hüfte beugen: Rumpf über das vordere Bein strecken, Brustbein zum Schienbein.',
      why: 'Die Beuge entsteht in der Hüfte; der Rumpf legt sich lang über das vordere Bein.', weight: 2,
    },
    {
      id: 'parsvottanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken quadratisch nach vorn stellen: die hintere Hüfte nach vorn, beide Hüftknochen gleich hoch.',
      why: 'Das Becken bleibt zum vorderen Bein ausgerichtet; so fällt die Beuge nicht in eine Seite.', weight: 3,
    },
    {
      id: 'parsvottanasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 10], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich weit nach vorn strecken, Rumpf nicht verdrehen.',
      why: 'Gleichmäßig lange Rumpfseiten sind das Zeichen einer sauberen, nicht verdrehten Vorbeuge.', weight: 1,
    },
  ],

  // ------------------------------------------------------- Prasarita Padottanasana (nicht seitig)
  prasarita_padottanasana: [
    {
      id: 'prasarita_padottanasana.left_leg_straight', view: 'front', measure: angle('left_hip', 'left_knee', 'left_ankle'),
      range: [165, 180], label: 'Linkes Bein',
      cueBelow: 'Linkes Knie strecken: Kniescheibe hochziehen, Oberschenkel zurück.',
      cueAbove: 'Linkes Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Feste, gestreckte Beine tragen die Vorbeuge und lassen den Rumpf frei hängen.', weight: 3,
    },
    {
      id: 'prasarita_padottanasana.right_leg_straight', view: 'front', measure: angle('right_hip', 'right_knee', 'right_ankle'),
      range: [165, 180], label: 'Rechtes Bein',
      cueBelow: 'Rechtes Knie strecken: Kniescheibe hochziehen, Oberschenkel zurück.',
      cueAbove: 'Rechtes Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Feste, gestreckte Beine tragen die Vorbeuge und lassen den Rumpf frei hängen.', weight: 3,
    },
    {
      id: 'prasarita_padottanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüften gleich hoch, Gewicht gleichmäßig auf beide Füße.',
      why: 'Das Becken beugt symmetrisch aus den Hüftgelenken; ein schiefes Becken zeigt ungleiche Beinarbeit.', weight: 3,
    },
    {
      id: 'prasarita_padottanasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich tief, Rumpf nicht seitlich drehen.',
      why: 'Der Rumpf hängt mittig zwischen den Beinen und wird nicht verdreht.', weight: 2,
    },
    {
      id: 'prasarita_padottanasana.leg_spread', view: 'front', measure: angle('left_ankle', 'mid_hip', 'right_ankle'),
      range: [55, 110], margin: 10, label: 'Grätschwinkel',
      cueBelow: 'Füße weiter auseinander stellen, etwa eine Beinlänge Abstand.',
      cueAbove: 'Füße etwas näher zusammen: die Beine sollen nicht überspreizen, damit das Becken sicher über den Füßen bleibt.',
      why: 'Eine weite, aber kontrollierte Grätsche gibt Raum für den Rumpf, ohne die Beine zu überlasten.', weight: 1,
    },
    {
      id: 'prasarita_padottanasana.hip_over_feet_side', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.2], margin: 0.1, label: 'Becken über Füßen',
      cueBelow: 'Becken über den Füßen halten.',
      cueAbove: 'Becken zurück über die Fersen bringen: Gewicht von den Zehen zu den Fersen, Sitzbeine nach oben.',
      why: 'Das Becken bleibt über den Füßen, damit die Beuge aus der Hüfte kommt und das Gewicht nicht nach vorn kippt.', weight: 2,
    },
  ],

  // ------------------------------------------------- Parivrtta Trikonasana (lead = HINTERES Bein = Seite der unteren Hand)
  parivrtta_trikonasana: [
    {
      id: 'parivrtta_trikonasana.front_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Vorderes Bein',
      cueBelow: 'Vorderes Knie strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Vorderes Knie nicht überstrecken: Kniescheibe hoch, Oberschenkel leicht zurück.',
      why: 'Beide Beine sind fest gestreckt, damit der Rumpf sich über dem vorderen Bein drehen kann.', weight: 3,
    },
    {
      id: 'parivrtta_trikonasana.back_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Ferse in den Boden drücken.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das hintere Bein verankert die Haltung und gibt den Gegendruck zur Drehung.', weight: 3,
    },
    {
      id: 'parivrtta_trikonasana.arms_line_vertical', view: 'side', measure: tilt('lead_wrist', 'trail_wrist', 'vertical'),
      range: [0, 15], margin: 10, label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Oberen Arm senkrecht über die untere Hand ziehen: Schultern übereinander drehen, beide Arme in einer senkrechten Linie.',
      why: 'Die senkrechte Armlinie zeigt, dass sich der Rumpf wirklich dreht und die Schultern übereinander stehen.', weight: 3,
    },
    {
      id: 'parivrtta_trikonasana.arms_straight_line', view: 'side', measure: angle('lead_wrist', 'mid_shoulder', 'trail_wrist'),
      range: [155, 180], margin: 10, label: 'Arme in einer Linie',
      cueBelow: 'Beide Arme zu einer geraden Linie strecken: Ellbogen fest, Schultern auseinander.',
      cueAbove: 'Arme in einer Linie halten, Schultern auseinander ziehen.',
      why: 'Die gestreckten Arme verlängern die Wirbelsäule nach oben und unten.', weight: 2,
    },
    {
      id: 'parivrtta_trikonasana.trunk_forward', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 40], margin: 10, label: 'Rumpf waagrecht',
      cueBelow: 'Rumpf lang nach vorn über das vordere Bein strecken.',
      cueAbove: 'Rumpf weiter aus der Hüfte nach vorn beugen, Brustbein vorstrecken: nicht aufrichten.',
      why: 'Der Rumpf streckt sich aus dem Becken lang nach vorn, bevor er sich dreht – nicht aus dem Rücken eingerollt.', weight: 2,
    },
  ],

  // ------------------------------------------------- Parivrtta Parsvakonasana (lead = gebeugtes vorderes Bein)
  parivrtta_parsvakonasana: [
    {
      id: 'parivrtta_parsvakonasana.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [80, 108], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter öffnen oder Becken höher.',
      cueAbove: 'Vorderes Knie tiefer beugen, bis der Oberschenkel waagrecht ist.',
      why: 'Der Oberschenkel liegt waagrecht, das Schienbein steht senkrecht – die stabile Basis für die Drehung.', weight: 3,
    },
    {
      id: 'parivrtta_parsvakonasana.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht: Schritt weiter öffnen.',
      why: 'Das Knie bleibt über der Ferse, damit das Gelenk geschützt ist und der Oberschenkel tragen kann.', weight: 3,
    },
    {
      id: 'parivrtta_parsvakonasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Ferse nach hinten schieben.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte hintere Bein ist die lange Basis der Drehung und gibt dem Rumpf Gegenspannung.', weight: 3,
    },
    {
      id: 'parivrtta_parsvakonasana.back_line', view: 'side', measure: angle('trail_ankle', 'mid_hip', 'mid_shoulder'),
      range: [135, 180], margin: 10, label: 'Hinteres Bein und Rumpf',
      cueBelow: 'Hinteres Bein und Rumpf zu einer langen Linie strecken: Becken nicht hochschieben, Brustbein vorstrecken.',
      cueAbove: 'Linie halten, Taille lang, nicht nach hinten durchhängen.',
      why: 'Von der hinteren Ferse bis zum Scheitel läuft eine lange Linie; die Drehung verkürzt sie nicht.', weight: 2,
    },
    {
      id: 'parivrtta_parsvakonasana.trunk_lean', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [10, 65], margin: 10, label: 'Rumpfneigung',
      cueBelow: 'Rumpf höher nehmen, nicht auf dem Oberschenkel ablegen.',
      cueAbove: 'Rumpf weiter nach vorn über das vordere Bein strecken, Brustbein vorstrecken.',
      why: 'Der Rumpf liegt nicht auf dem Oberschenkel, sondern bleibt lang und dreht sich aus der Mitte heraus.', weight: 2,
    },
    {
      id: 'parivrtta_parsvakonasana.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie über den zweiten Zeh ausrichten: nicht nach innen oder außen fallen lassen.',
      why: 'Das Knie folgt der Richtung der Zehen, damit das Gelenk bei der Drehung nicht verdreht wird.', weight: 3,
    },
  ],

  // ------------------------------------------------------- Skandasana (lead = gebeugtes Bein, trail = gestrecktes Bein)
  skandasana: [
    {
      id: 'skandasana.bent_knee_angle', view: 'front', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [50, 105], margin: 10, label: 'Gebeugtes Knie',
      cueBelow: 'Nicht tiefer sinken, als die Ferse am Boden bleibt: Gesäß etwas höher.',
      cueAbove: 'Gebeugtes Knie tiefer beugen: Gesäß zur Ferse senken, Oberschenkel in Richtung Waagrechte.',
      why: 'Das tiefe Beugen des einen Beins öffnet die Hüfte des anderen und kräftigt die Oberschenkel.', weight: 3,
    },
    {
      id: 'skandasana.straight_leg_straight', view: 'front', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie durchstrecken: Oberschenkel hochziehen, Ferse fest in den Boden.',
      cueAbove: 'Gestrecktes Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein bleibt fest und lang; die Dehnung der Innenseite entsteht nur, wenn das Knie nicht nachgibt.', weight: 3,
    },
    {
      id: 'skandasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 12], margin: 8, label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: Hüften nicht seitlich absacken lassen, Gewicht über dem gebeugten Bein halten.',
      why: 'Ein ruhiges Becken zeigt, dass der Schwerpunkt kontrolliert über dem gebeugten Bein liegt.', weight: 2,
    },
    {
      id: 'skandasana.trunk_upright', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], margin: 8, label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht über das gebeugte Bein fallen lassen.',
      why: 'Der Rumpf bleibt senkrecht und lang; das Becken sinkt, nicht der Brustkorb.', weight: 2,
    },
    {
      id: 'skandasana.bent_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Knie über Fuß',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Gebeugtes Knie über den zweiten Zeh nach außen drücken, nicht nach innen fallen lassen.',
      why: 'Das Knie bleibt über dem Fuß, damit das Gelenk bei der tiefen Beuge geschützt ist.', weight: 3,
    },
  ],

  // ---------------------------------------- Utthita Hasta Padangusthasana (lead = angehobenes Bein, trail = Standbein)
  utthita_hasta_padangusthasana: [
    {
      id: 'utthita_hasta_padangusthasana.standing_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel zurück.',
      why: 'Das Standbein ist fest wie in Tadasana und trägt die ganze Haltung.', weight: 3,
    },
    {
      id: 'utthita_hasta_padangusthasana.lifted_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [158, 180], margin: 10, label: 'Angehobenes Bein',
      cueBelow: 'Angehobenes Knie strecken: Ferse nach vorn drücken, Oberschenkel aktiv; Gurt oder Bein tiefer, wenn nötig.',
      cueAbove: 'Angehobenes Knie nicht überstrecken.',
      why: 'Das gehaltene Bein bleibt lang und aktiv, es hängt nicht in der Hand.', weight: 3,
    },
    {
      id: 'utthita_hasta_padangusthasana.leg_lift', view: 'side', measure: angle('trail_ankle', 'lead_hip', 'lead_ankle'),
      range: [25, 105], margin: 10, label: 'Beinhöhe',
      cueBelow: 'Bein nicht über das Können hinaus heben, Standbein und Rumpf bleiben aufrecht.',
      cueAbove: 'Bein höher heben, bis der Oberschenkel mindestens waagrecht ist; Gurt benutzen, wenn nötig.',
      why: 'Das Bein wird etwa bis zur Waagrechten gehoben, ohne dass Standbein oder Rumpf dafür nachgeben.', weight: 2,
    },
    {
      id: 'utthita_hasta_padangusthasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], margin: 8, label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht zurücklehnen oder zum Bein beugen.',
      why: 'Der Rumpf steht senkrecht wie in Tadasana; das Bein hebt sich, ohne dass der Rumpf ausweicht.', weight: 3,
    },
    {
      id: 'utthita_hasta_padangusthasana.standing_leg_vertical', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'vertical'),
      range: [0, 8], label: 'Standbein senkrecht',
      cueBelow: 'Standbein senkrecht halten.',
      cueAbove: 'Standbein senkrecht aufrichten: Hüfte über den Standfuß, nicht zurückschieben.',
      why: 'Ein senkrechtes Standbein ist die Achse der Balance.', weight: 2,
    },
    {
      id: 'utthita_hasta_padangusthasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: die Hüfte des angehobenen Beins nach unten drehen, beide Hüften gleich hoch.',
      why: 'Das Becken bleibt waagrecht; die angehobene Hüfte darf nicht mitwandern.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Garudasana (lead = umschlingendes Bein, trail = Standbein)
  garudasana: [
    {
      id: 'garudasana.standing_knee_bend', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [95, 165], margin: 10, label: 'Standknie',
      cueBelow: 'Etwas höher kommen: Standknie weniger beugen, Rumpf aufrecht.',
      cueAbove: 'Standknie stärker beugen: Gesäß zurück und nach unten, wie in einen Stuhl setzen.',
      why: 'Das gebeugte Standbein trägt die Verschlingung und hält das Gleichgewicht; Gewicht bleibt auf der ganzen Fußsohle.', weight: 2,
    },
    {
      id: 'garudasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 25], margin: 10, label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht über das Standbein fallen lassen.',
      why: 'Der Rumpf bleibt lang und aufrecht, auch wenn Arme und Beine verschlungen sind.', weight: 2,
    },
    {
      id: 'garudasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: die Hüfte des umschlingenden Beins nicht hochziehen, beide Hüften gleich hoch.',
      why: 'Ein waagrechtes Becken zeigt, dass das Standbein sauber arbeitet.', weight: 2,
    },
    {
      id: 'garudasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich hoch, Schulterblätter nach unten.',
      why: 'Gleich hohe Schultern verhindern, dass die Armverschlingung den Rumpf schief zieht.', weight: 1,
    },
    {
      id: 'garudasana.balance_line', view: 'front', measure: offset('mid_hip', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.15], margin: 0.1, label: 'Becken über Standfuß',
      cueBelow: 'Schwerpunkt über dem Standfuß halten.',
      cueAbove: 'Becken über den Standfuß bringen: nicht zur Seite lehnen.',
      why: 'Die Schwerlinie fällt durch den Standfuß, erst dann steht die Verschlingung ruhig.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Natarajasana (lead = angehobenes Bein, trail = Standbein)
  natarajasana: [
    {
      id: 'natarajasana.standing_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel fest.',
      why: 'Das Standbein ist fest wie in Tadasana und trägt Rückbeuge und Gleichgewicht.', weight: 3,
    },
    {
      id: 'natarajasana.standing_leg_vertical', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'vertical'),
      range: [0, 10], margin: 8, label: 'Standbein senkrecht',
      cueBelow: 'Standbein senkrecht halten.',
      cueAbove: 'Standbein senkrecht aufrichten: Hüfte über den Standfuß schieben, nicht nach hinten ausweichen.',
      why: 'Ein senkrechtes Standbein ist die Achse, um die sich die Rückbeuge ausbalanciert.', weight: 2,
    },
    {
      id: 'natarajasana.lifted_thigh_back', view: 'side', measure: tilt('lead_hip', 'lead_knee', 'horizontal'),
      range: [0, 50], margin: 12, label: 'Angehobener Oberschenkel',
      cueBelow: 'Oberschenkel nicht höher als die Waagrechte nach hinten ziehen, Knie nicht öffnen.',
      cueAbove: 'Angehobenes Bein weiter nach hinten und oben heben: Fuß in die Hand drücken, Oberschenkel bis zur Waagrechten.',
      why: 'Der Fuß drückt in die Hand, das Bein hebt sich aus der Hüfte – nicht die Hand zieht den Fuß.', weight: 2,
    },
    {
      id: 'natarajasana.trunk_lean', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 35], margin: 10, label: 'Rumpfneigung',
      cueBelow: 'Brustbein heben und leicht nach hinten öffnen, der Rumpf darf etwas nach vorn kommen.',
      cueAbove: 'Brustbein heben, Rumpf aufrichten: Rückbeuge aus dem ganzen Rücken, nicht aus der Lendenwirbelsäule.',
      why: 'Die Rückbeuge verteilt sich über die ganze Wirbelsäule, während das Becken nach vorn bleibt.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Malasana (nicht seitig)
  malasana: [
    {
      id: 'malasana.knee_angle', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [20, 80], margin: 10, label: 'Knie',
      cueBelow: 'Etwas höher kommen, Fersen am Boden: Gesäß nicht zu tief hängen lassen.',
      cueAbove: 'Tiefer in die Hocke sinken: Gesäß zu den Fersen, Knie weit beugen.',
      why: 'Die tiefe Hocke öffnet Hüften und Beckenboden; die Fersen bleiben am Boden.', weight: 3,
    },
    {
      id: 'malasana.hip_depth', view: 'side', measure: offset('mid_hip', 'mid_knee', 'y', 'down'),
      range: [-0.1, 1.0], margin: 0.15, label: 'Hüfte unter Knie',
      cueBelow: 'Becken tiefer sinken lassen: Gesäß unter Kniehöhe, Oberschenkel mindestens waagrecht.',
      cueAbove: 'Etwas höher kommen: Becken nicht auf den Fersen ablegen, Rumpf lang halten.',
      why: 'Das Becken sinkt bis zu oder unter die Kniehöhe; so wird die Hocke zur Dehnung.', weight: 2,
    },
    {
      id: 'malasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 45], margin: 12, label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht nach vorn rollen.',
      why: 'Der Rumpf bleibt lang und aufrecht, das Gewicht liegt zwischen den Beinen.', weight: 2,
    },
    {
      id: 'malasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: Gewicht gleichmäßig auf beide Füße.',
      why: 'Ein waagrechtes Becken zeigt gleichmäßiges Gewicht auf beiden Beinen.', weight: 2,
    },
    {
      id: 'malasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich hoch, Rumpf nicht zur Seite kippen.',
      why: 'Der Rumpf bleibt mittig zwischen den Knien.', weight: 1,
    },
  ],

  // ------------------------------------------------------- Utkata Konasana (nicht seitig)
  utkata_konasana: [
    {
      id: 'utkata_konasana.left_knee_angle', view: 'front', measure: angle('left_hip', 'left_knee', 'left_ankle'),
      range: [85, 135], margin: 10, label: 'Linkes Knie',
      cueBelow: 'Etwas höher kommen: Oberschenkel waagrecht, nicht tiefer.',
      cueAbove: 'Linkes Knie tiefer beugen: Becken senken, Oberschenkel zur Waagrechten.',
      why: 'Die Oberschenkel arbeiten kräftig und nähern sich der Waagrechten; die Knie folgen den Zehen.', weight: 3,
    },
    {
      id: 'utkata_konasana.right_knee_angle', view: 'front', measure: angle('right_hip', 'right_knee', 'right_ankle'),
      range: [85, 135], margin: 10, label: 'Rechtes Knie',
      cueBelow: 'Etwas höher kommen: Oberschenkel waagrecht, nicht tiefer.',
      cueAbove: 'Rechtes Knie tiefer beugen: Becken senken, Oberschenkel zur Waagrechten.',
      why: 'Die Oberschenkel arbeiten kräftig und nähern sich der Waagrechten; die Knie folgen den Zehen.', weight: 3,
    },
    {
      id: 'utkata_konasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüften gleich hoch, Gewicht gleichmäßig auf beide Beine.',
      why: 'Gleichmäßiges Beugen beider Beine hält das Becken waagrecht.', weight: 3,
    },
    {
      id: 'utkata_konasana.trunk_vertical', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf mittig über das Becken heben: nicht zur Seite kippen, Brustbein heben.',
      why: 'Die Mittelachse bleibt senkrecht, der Rumpf steigt gerade aus dem Becken.', weight: 3,
    },
    {
      id: 'utkata_konasana.left_shin_vertical', view: 'front', measure: tilt('left_knee', 'left_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Linkes Schienbein',
      cueBelow: 'Linkes Knie über den Fuß halten.',
      cueAbove: 'Linkes Knie über den Knöchel drücken: Schienbein senkrecht, Knie nicht nach innen fallen lassen.',
      why: 'Die Schienbeine stehen senkrecht, damit die Knie geschützt sind und die Oberschenkel arbeiten.', weight: 2,
    },
    {
      id: 'utkata_konasana.right_shin_vertical', view: 'front', measure: tilt('right_knee', 'right_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Rechtes Schienbein',
      cueBelow: 'Rechtes Knie über den Fuß halten.',
      cueAbove: 'Rechtes Knie über den Knöchel drücken: Schienbein senkrecht, Knie nicht nach innen fallen lassen.',
      why: 'Die Schienbeine stehen senkrecht, damit die Knie geschützt sind und die Oberschenkel arbeiten.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Viparita Virabhadrasana (lead = gebeugtes vorderes Knie)
  viparita_virabhadrasana: [
    {
      id: 'viparita_virabhadrasana.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [82, 108], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter öffnen oder Becken höher.',
      cueAbove: 'Vorderes Knie tiefer beugen, bis der Oberschenkel waagrecht ist.',
      why: 'Wie in Virabhadrasana II bildet das vordere Knie einen rechten Winkel; die Beine bleiben die Basis der Rückneigung.', weight: 3,
    },
    {
      id: 'viparita_virabhadrasana.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht.',
      why: 'Das Knie bleibt über der Ferse, damit das Gelenk bei der Rückneigung nicht überlastet wird.', weight: 3,
    },
    {
      id: 'viparita_virabhadrasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Außenkante des hinteren Fußes fest in den Boden.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das hintere Bein bleibt fest gestreckt und erdet die Haltung, während sich der Rumpf zurückneigt.', weight: 3,
    },
    {
      id: 'viparita_virabhadrasana.trunk_lean_back', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [8, 45], margin: 10, label: 'Rumpf zurückgeneigt',
      cueBelow: 'Rumpf weiter über das hintere Bein zurückneigen: Brustbein öffnen, Seitrumpf lang.',
      cueAbove: 'Rumpf weniger zurückfallen lassen: Taille lang, Brustbein heben, Gewicht in den Beinen.',
      why: 'Der Rumpf neigt sich aus dem Becken lang über das hintere Bein; er fällt nicht in die Lendenwirbelsäule.', weight: 2,
    },
    {
      id: 'viparita_virabhadrasana.front_arm_up', view: 'side', measure: angle('lead_hip', 'lead_shoulder', 'lead_wrist'),
      range: [140, 180], margin: 10, label: 'Oberer Arm',
      cueBelow: 'Oberen Arm lang nach oben und zurück strecken, neben dem Ohr, in Linie mit dem Rumpf.',
      cueAbove: 'Oberen Arm in Linie mit dem Rumpf halten, Schulter weg vom Ohr.',
      why: 'Der gestreckte Arm verlängert die Seitenlinie des Rumpfes bis in die Fingerspitzen.', weight: 2,
    },
    {
      id: 'viparita_virabhadrasana.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie nach außen über den zweiten Zeh drücken: Oberschenkel nach außen rotieren.',
      why: 'Das Knie bleibt über dem Fuß und fällt nicht nach innen.', weight: 3,
    },
  ],

  // ------------------------------------------------------- Urdhva Prasarita Eka Padasana (lead = Standbein, trail = angehobenes Bein)
  urdhva_prasarita_eka_padasana: [
    {
      id: 'urdhva_prasarita_eka_padasana.standing_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel hochziehen, Kniescheibe hoch.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel zurück.',
      why: 'Das Standbein bleibt fest und gestreckt; nur so kann sich das andere Bein frei heben.', weight: 3,
    },
    {
      id: 'urdhva_prasarita_eka_padasana.standing_leg_vertical', view: 'side', measure: tilt('lead_hip', 'lead_ankle', 'vertical'),
      range: [0, 12], margin: 8, label: 'Standbein senkrecht',
      cueBelow: 'Standbein senkrecht halten.',
      cueAbove: 'Standbein senkrecht aufrichten: Hüfte über den Standfuß schieben, Gewicht in die Fersen.',
      why: 'Ein senkrechtes Standbein ist die Achse des Gleichgewichts.', weight: 2,
    },
    {
      id: 'urdhva_prasarita_eka_padasana.lifted_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [160, 180], margin: 10, label: 'Angehobenes Bein',
      cueBelow: 'Angehobenes Knie strecken: Oberschenkel aktiv, Ferse zur Decke drücken.',
      cueAbove: 'Angehobenes Knie nicht überstrecken.',
      why: 'Das angehobene Bein bleibt lang und aktiv bis in die Ferse.', weight: 2,
    },
    {
      id: 'urdhva_prasarita_eka_padasana.leg_lift', view: 'side', measure: angle('lead_ankle', 'mid_hip', 'trail_ankle'),
      range: [110, 180], margin: 12, label: 'Beinhöhe',
      cueBelow: 'Angehobenes Bein höher strecken, Richtung Decke; Becken über dem Standbein halten.',
      cueAbove: 'Bein in einer Linie mit dem Standbein halten, nicht weiter nach hinten kippen.',
      why: 'Das angehobene Bein steigt aus der Hüfte in einer Linie mit dem Standbein; je höher, desto klarer die Spreizung.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Ardha Baddha Padmottanasana (lead = Lotusbein, trail = Standbein)
  ardha_baddha_padmottanasana: [
    {
      id: 'ardha_baddha_padmottanasana.standing_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel hochziehen, Kniescheibe hoch.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel fest.',
      why: 'Das Standbein bleibt fest wie in Tadasana, damit der Rumpf mit dem Lotusbein sicher nach vorn falten kann.', weight: 3,
    },
    {
      id: 'ardha_baddha_padmottanasana.hip_over_ankle', view: 'side', measure: offset('mid_hip', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.2], margin: 0.1, label: 'Hüfte über Standfuß',
      cueBelow: 'Becken über dem Standfuß halten.',
      cueAbove: 'Becken über den Standfuß bringen: Gewicht in die Ferse, nicht nach vorn auf die Zehen kippen.',
      why: 'Das Becken bleibt über dem Standfuß, damit das Gleichgewicht ruhig ist und die Beuge aus der Hüfte kommt.', weight: 2,
    },
    {
      id: 'ardha_baddha_padmottanasana.trunk_fold', view: 'side', measure: angle('mid_shoulder', 'trail_hip', 'trail_knee'),
      range: [15, 115], margin: 12, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten und nicht über das Standbein fallen lassen.',
      cueAbove: 'Tiefer aus der Hüfte beugen: Rumpf lang über das Standbein strecken.',
      why: 'Die Vorbeuge kommt aus der Hüfte des Standbeins; der Rumpf legt sich lang darüber.', weight: 2,
    },
    {
      id: 'ardha_baddha_padmottanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: die Hüfte des Lotusbeins nicht hochziehen, beide Hüften gleich hoch.',
      why: 'Ein waagrechtes Becken zeigt, dass das Standbein sauber trägt und das Lotusbein aus der Hüfte öffnet.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Parighasana (lead = gestrecktes Bein, trail = kniendes Bein)
  parighasana: [
    {
      id: 'parighasana.extended_leg_straight', view: 'front', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie durchstrecken: Oberschenkel hochziehen, Ferse nach außen schieben.',
      cueAbove: 'Gestrecktes Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein ist die lange Seitenlinie des Tores; die Seitdehnung braucht diese feste Verlängerung.', weight: 3,
    },
    {
      id: 'parighasana.kneeling_thigh_vertical', view: 'front', measure: tilt('trail_hip', 'trail_knee', 'vertical'),
      range: [0, 12], margin: 8, label: 'Kniender Oberschenkel',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Oberschenkel des knienden Beins senkrecht aufrichten: Hüfte über das Knie.',
      why: 'Der kniende Oberschenkel steht senkrecht und bildet die stabile Basis für die Seitneigung.', weight: 3,
    },
    {
      id: 'parighasana.hip_over_knee', view: 'front', measure: offset('trail_hip', 'trail_knee', 'x', undefined, true),
      range: [0, 0.12], margin: 0.08, label: 'Hüfte über Knie',
      cueBelow: 'Hüfte über dem Knie halten.',
      cueAbove: 'Hüfte über das kniende Knie schieben: nicht zur Seite wegschieben.',
      why: 'Die Hüfte bleibt über dem Knie; die Seitneigung kommt aus der Taille, nicht aus verschobenem Becken.', weight: 2,
    },
    {
      id: 'parighasana.trunk_side_bend', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [15, 80], margin: 10, label: 'Seitneigung',
      cueBelow: 'Rumpf weiter zur Seite über das gestreckte Bein strecken, Taille lang.',
      cueAbove: 'Rumpf aufrichten und lang halten: nicht auf das Bein fallen lassen.',
      why: 'Der Rumpf streckt sich lang zur Seite über das gestreckte Bein, die Brust öffnet sich nach oben.', weight: 2,
    },
  ],

  // ------------------------------------------------------- Padangusthasana (nicht seitig)
  padangusthasana: [
    {
      id: 'padangusthasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Kniescheiben hoch.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel zurückdrücken.',
      why: 'Die Beine bleiben fest und gestreckt, damit die Dehnung der Beinrückseite in der Hüfte beginnt.', weight: 3,
    },
    {
      id: 'padangusthasana.hip_over_ankle', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.2], margin: 0.1, label: 'Hüfte über Knöchel',
      cueBelow: 'Becken über den Knöcheln halten.',
      cueAbove: 'Becken nach oben und über die Knöchel bringen: Gewicht von den Zehen zu den Fersen.',
      why: 'Das Becken bleibt über den Fersen, damit die Beuge aus der Hüfte kommt und nicht aus dem Rücken.', weight: 3,
    },
    {
      id: 'padangusthasana.trunk_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [10, 110], margin: 12, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten und nicht über die Beine fallen lassen.',
      cueAbove: 'Tiefer aus der Hüfte beugen: Brustbein zu den Oberschenkeln, Zehen greifen und Rumpf verlängern.',
      why: 'Die Vorbeuge kommt aus den Hüftgelenken; der Rumpf legt sich lang über die Beine.', weight: 2,
    },
    {
      id: 'padangusthasana.hands_at_feet', view: 'side', measure: offset('mid_wrist', 'mid_ankle', 'y', undefined, true),
      range: [0, 0.45], margin: 0.15, label: 'Hände an den Füßen',
      cueBelow: 'Hände nicht unter die Füße ziehen: große Zehen greifen.',
      cueAbove: 'Hände zu den großen Zehen bringen oder Gurt benutzen; nicht den Rücken runden.',
      why: 'Die Hände greifen die großen Zehen und geben Widerstand, um den Rumpf zu verlängern.', weight: 1,
    },
  ],

  // ------------------------------------------------------- Padahastasana (nicht seitig)
  padahastasana: [
    {
      id: 'padahastasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Kniescheiben hoch.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel zurückdrücken.',
      why: 'Die Beine bleiben fest und gestreckt, damit die Beuge aus den Hüften kommt.', weight: 3,
    },
    {
      id: 'padahastasana.hip_over_feet', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', 'forward'),
      range: [-0.15, 0.4], margin: 0.12, label: 'Hüfte über Füßen',
      cueBelow: 'Becken etwas nach vorn über die Fußmitte bringen, damit die Hände unter die Füße kommen.',
      cueAbove: 'Becken zurück über die Füße ziehen: Gewicht nicht zu weit auf die Zehen kippen.',
      why: 'Das Gewicht wandert leicht nach vorn, damit die Hände unter die Füße kommen, ohne das Gleichgewicht zu verlieren.', weight: 2,
    },
    {
      id: 'padahastasana.trunk_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [10, 90], margin: 12, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten und nicht über die Beine fallen lassen.',
      cueAbove: 'Tiefer aus der Hüfte beugen: Rumpf an die Oberschenkel legen, Brustbein vorstrecken.',
      why: 'Die tiefe Vorbeuge kommt aus den Hüftgelenken; der Rumpf legt sich lang an die Beine.', weight: 2,
    },
    {
      id: 'padahastasana.hands_under_feet', view: 'side', measure: offset('mid_wrist', 'mid_ankle', 'y', undefined, true),
      range: [0, 0.35], margin: 0.15, label: 'Hände an den Füßen',
      cueBelow: 'Hände genau unter die Füße schieben.',
      cueAbove: 'Hände weiter zu den Füßen bringen oder die Knie leicht beugen; nicht den Rücken runden.',
      why: 'Die Hände unter den Füßen geben Widerstand, um den Rumpf zu verlängern und tiefer zu falten.', weight: 1,
    },
  ],

  // ------------------------------------------------------- Upavistha Konasana (nicht seitig)
  upavistha_konasana: [
    {
      id: 'upavistha_konasana.left_leg_straight', view: 'front', measure: angle('left_hip', 'left_knee', 'left_ankle'),
      range: [165, 180], label: 'Linkes Bein',
      cueBelow: 'Linkes Knie strecken: Oberschenkel auf den Boden drücken, Ferse wegschieben.',
      cueAbove: 'Linkes Knie nicht überstrecken: Kniescheibe zur Decke.',
      why: 'Gestreckte Beine lassen die Dehnung der Beininnenseiten entstehen und stützen das Becken.', weight: 3,
    },
    {
      id: 'upavistha_konasana.right_leg_straight', view: 'front', measure: angle('right_hip', 'right_knee', 'right_ankle'),
      range: [165, 180], label: 'Rechtes Bein',
      cueBelow: 'Rechtes Knie strecken: Oberschenkel auf den Boden drücken, Ferse wegschieben.',
      cueAbove: 'Rechtes Knie nicht überstrecken: Kniescheibe zur Decke.',
      why: 'Gestreckte Beine lassen die Dehnung der Beininnenseiten entstehen und stützen das Becken.', weight: 3,
    },
    {
      id: 'upavistha_konasana.leg_spread', view: 'front', measure: angle('left_ankle', 'mid_hip', 'right_ankle'),
      range: [80, 180], margin: 12, label: 'Grätschwinkel',
      cueBelow: 'Beine weiter spreizen, so weit das Becken aufrecht bleibt.',
      cueAbove: 'Spreizung nicht erzwingen: lieber das Becken aufrecht halten als die Beine überdehnen.',
      why: 'Die Beine öffnen sich so weit, wie das Becken aufrecht bleibt; Zwang überlastet die Innenseiten.', weight: 2,
    },
    {
      id: 'upavistha_konasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: Gewicht gleichmäßig auf beide Sitzbeine.',
      why: 'Beide Sitzbeine tragen gleich, das Becken bleibt gerade für eine symmetrische Beuge.', weight: 3,
    },
    {
      id: 'upavistha_konasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich hoch, Rumpf nicht verdrehen.',
      why: 'Gleich hohe Schultern zeigen, dass der Rumpf mittig zwischen den Beinen bleibt.', weight: 1,
    },
  ],
};
