import type { Measure, Rule, School } from '../../core/types';

/*
 * ENTWURF – Iyengar-Regelwerk. Fachlich zu prüfen durch Christof.
 *
 * Konventionen
 *  - Kameras relativ zur MATTE: 'front' = kurze Mattenkante (Blick entlang der Matte),
 *    'side' = lange Mattenkante (Blick quer zur Matte).
 *  - Gespreizte Stände (Krieger I/II, Trikonasana, Parsvakonasana, Ardha Chandrasana):
 *    'side' sieht die Frontalebene des Körpers (Brust, Arme, Beinspreizung) UND die
 *    Beugung des vorderen Knies; 'front' sieht nur die seitliche Spur der Knie (Mattenbreite).
 *  - 'lead' = die im Schritt genannte Seite:
 *      Krieger I/II, Trikonasana, Parsvakonasana: vorderes (gebeugtes bzw. vorderes) Bein.
 *      Vrksasana: das ANGEHOBENE Bein ("Baum rechts" = rechter Fuß am linken Oberschenkel, wie in Light on Yoga);
 *        trail = Standbein.
 *      Ardha Chandrasana: STANDBEIN (kommt aus Trikonasana derselben Seite); trail = angehobenes Bein.
 *      Anjaneyasana: vorderes (gebeugtes) Bein; trail = hinteres Bein mit dem Knie am Boden.
 *      Virabhadrasana III: STANDBEIN; trail = angehobenes Bein.
 *      Janu Sirsasana: das GESTRECKTE Bein (über das sich der Rumpf beugt); trail = gebeugtes Bein.
 *  - Winkel = Innenwinkel 0..180 (180 = gestreckt), tilt = Abweichung von Senkrechter/Waagrechter,
 *    offset in Rumpflängen.
 *
 * BEWUSST NICHT KODIERT (mit 33 Punkten aus einer 2D-Kamera nicht messbar) – Input für die fachliche Prüfung:
 *
 * Tadasana: Gewichtsverteilung Innen-/Außenkante und Ballen/Ferse; Fußgewölbe, Zehen gespreizt;
 *   Kniescheiben hochgezogen und Oberschenkel zurück (Überstreckung nur grob); Beckenneigung
 *   (Steißbein ein, Schambein hoch); Brustkorb/Rippen; Schulterblätter in den Rücken; Kinn parallel zum Boden.
 * Utkatasana: Wirbelsäule konkav/Rundrücken; Beckenkippung; Knie parallel (Abstand) und nicht nach innen;
 *   Gewicht auf den Fersen (nur grob über Knie-Offset); Schulterblattlage, Handflächen/Ellbogen gestreckt.
 * Vrksasana: Fußsohle am Oberschenkel (Druckverteilung); Beckenrotation, Becken frontal;
 *   Standfuß-Gewölbe; Knie des Standbeins nicht überstreckt; Handflächen zusammen; Blickpunkt.
 * Utthita Trikonasana: Drehung von Becken und Brustbein nach oben; Rippenöffnung oben;
 *   Fußstellung (vorderer Fuß 90°, hinterer leicht nach innen); Kniescheibe hoch, Knie nicht überstreckt;
 *   Ausrichtung der Wirbelsäule in einer Ebene (Tiefe); Kopfdrehung; Hand-Bodenkontakt.
 * Virabhadrasana II: Oberschenkel-Außenrotation, Knie über zweiter Zehe (nur seitliche Spur kodiert);
 *   Fußstellung und Fersen-Gewölbe-Linie; hinteres Fußgewölbe; Beckenebene (Rotation);
 *   Schultergürtel/Schulterblätter; Kopfdrehung zum vorderen Arm; Handflächen/Fingerstreckung.
 * Virabhadrasana I: Beckenrotation nach vorn (Quadratstellung), hintere Hüfte vor; hintere Ferse am Boden
 *   und Fußwinkel (Heel/Foot-Index zu unsicher); Lendenwirbelsäule/Hohlkreuz; Oberarme am Kopf, Handflächen zusammen;
 *   Kopf nach hinten (Nacken).
 * Utthita Parsvakonasana: Rumpfdrehung und Brustkorb nach oben; Achsel am Knie / Oberarm gegen das Knie;
 *   Rippenöffnung; Fußstellung; Kopfstellung; hintere Fußaußenkante am Boden.
 * Ardha Chandrasana: Beckenübereinanderstellung (Rotation); Brustbein nach oben gedreht;
 *   Fuß-/Zehenstellung des angehobenen Beins (Ferse, Zehen nach vorn); Standknie-Überstreckung; Hand-Boden-Abstand/Block;
 *   Kopfdrehung.
 * Uttanasana: Wirbelsäulenstreckung (konkav vs. rund) und Beckenkippung; Gewicht auf Fersen vs. Ballen;
 *   Oberschenkel-Rotation; Kniescheiben hoch; Nacken entspannt; Fußabstand (nur frontal grob).
 * Adho Mukha Svanasana: Handflächenverteilung, Zeigefingergrundgelenk; Außen-/Innenrotation der Oberarme;
 *   Schulterblätter breit/nach unten; Wirbelsäule gerade (Rundrücken nur grob); Fußparallelität; Sitzbeine zur Decke;
 *   Fersen-Bodenkontakt nur indirekt (Heel-Punkte unzuverlässig).
 * Chaturanga Dandasana: Schulterblattstellung, Ellbogen nah am Körper (seitlich nur in 'front');
 *   Brustbeinhöhe, Bauchspannung; Handgelenkstellung, Zehenposition; Kopf nicht fallen lassen.
 * Urdhva Mukha Svanasana: Brustbeinhebung und Rippenöffnung; Schulterblattaktivierung; Oberarmrotation;
 *   Oberschenkelrotation und Fußrücken am Boden; Nacken/Kehle weich; Lendenbogen verteilt vs. Knick.
 * Dandasana: Schambein/Sitzbeine (Becken aufrecht); Wirbelsäulen-Konkavität; Fußwinkel, Zehen/Fersen;
 *   Oberschenkel-Innenrotation, Kniescheiben; Brustbein; Hände flach beim Hüft-Stützen.
 * Paschimottanasana: Wirbelsäulenlänge (rund vs. konkav) und Bauchnabel-zu-Oberschenkel-Ausdehnung;
 *   Beckenkippung und Sitzbein-Gewicht; Fußstellung, Zehenzug; Ellbogen-Außenseite breit;
 *   Gleichmäßigkeit rechts/links (Rumpf-Seitneigung ist nur frontal messbar, Kamera 'front' sieht den Rumpf kaum).
 * Setu Bandha Sarvangasana: Nacken-/Halswirbelsäule flach, Kinn zum Brustbein (Kinnlage);
 *   Schulterblätter unterstützt / Schultern untergerollt; Brustbein-Hebung und Brustkorbbreite;
 *   Schienbein-/Fußparallelität; Oberarm-Rotation; Sakrum/Lendenbogen verteilt; Handgelenk-Verschränkung.
 * Urdhva Hastasana: Handflächen zusammen oder schulterbreit parallel; Oberarm-Außenrotation und Schulterblätter
 *   nach unten (Schultern nicht zu den Ohren); Rippen/unterer Rücken (Hohlkreuz) nur über Rumpfneigung grob;
 *   Fingerstreckung; Kopfhaltung/Blick; Gewichtsverteilung der Füße.
 * Ardha Uttanasana: Wirbelsäulen-Konkavität (lange, hohle Wirbelsäule vs. Rundrücken) – mit 33 Punkten nicht messbar,
 *   nur Nacken-Linie und Rumpfwinkel kodiert; Beckenkippung (Sitzbeine nach oben); Gewicht auf den Fersen;
 *   Schulterblätter in den Rücken; Handdruck auf Schienbeine/Boden; Kniescheiben hoch.
 * Anjaneyasana: Lage des hinteren Knies und Fußrückens am Boden (Bodenkontakt, Polster) und Fußstellung hinten;
 *   Beckenkippung (Steißbein ein) und Hohlkreuz; Hüftbeuger-Dehnung des hinteren Beins; Beckenrotation (Quadratstellung);
 *   Handflächen zusammen; Kopf zurück (Nacken); Gewicht gleichmäßig zwischen den Beinen.
 * Virabhadrasana III: Beckenrotation (angehobene Hüfte nach unten drehen) nur grob über die Hüftlinie in 'front';
 *   Fuß des angehobenen Beins (Zehen nach unten, Ferse aktiv) und Innenrotation des angehobenen Oberschenkels;
 *   Standfuß-Gewölbe; Standknie-Überstreckung; Wirbelsäulenstreckung; Handflächen zusammen; Blickpunkt.
 * Janu Sirsasana: Wirbelsäulenrundung beim Vorbeugen (konkav vs. rund) und Bauchnabel-zu-Oberschenkel; Rumpfdrehung
 *   zum gestreckten Bein (Brustbein über die Beinmitte); Ferse am Damm, Knieöffnung (Außenrotation) in 2D kaum;
 *   Sitzbeingewicht und Beckenkippung; Fußzug des gestreckten Beins (Zehen, Ferse); Kopf/Nacken entspannt.
 */

const angle = (a: string, b: string, c: string): Measure => ({ kind: 'angle', a, b, c });
const tilt = (from: string, to: string, axis: 'vertical' | 'horizontal'): Measure => ({ kind: 'tilt', from, to, axis });
const offset = (a: string, b: string, axis: 'x' | 'y', toward?: string, abs?: boolean): Measure => ({
  kind: 'offset', a, b, axis, ...(toward ? { toward } : {}), ...(abs ? { abs: true } : {}),
});

const rules: Record<string, Rule[]> = {
  // ---------------------------------------------------------------- Tadasana
  tadasana: [
    {
      id: 'tadasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 5], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Eine Schulter sinkt: beide Schultern gleich hoch, Schulterblätter nach unten in den Rücken.',
      why: 'Gleich hohe Schultern zeigen, dass der Brustkorb beidseitig gleich getragen wird.', weight: 2,
    },
    {
      id: 'tadasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 5], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüftknochen auf gleiche Höhe, Gewicht gleichmäßig auf beide Beine.',
      why: 'Ein schiefes Becken verrät ungleiche Beinarbeit – Tadasana ist die Grundlage aller Haltungen.', weight: 3,
    },
    {
      id: 'tadasana.left_leg_straight', view: 'front', measure: angle('left_hip', 'left_knee', 'left_ankle'),
      range: [168, 180], label: 'Linkes Bein',
      cueBelow: 'Linkes Knie strecken: Oberschenkel zurück, Kniescheibe hochziehen.',
      cueAbove: 'Linkes Knie nicht überstrecken: Kniescheibe hoch, Oberschenkel zurückdrücken.',
      why: 'Aktive, gestreckte Beine tragen die Haltung; die Kniescheiben ziehen die Oberschenkelmuskeln hoch.', weight: 3,
    },
    {
      id: 'tadasana.right_leg_straight', view: 'front', measure: angle('right_hip', 'right_knee', 'right_ankle'),
      range: [168, 180], label: 'Rechtes Bein',
      cueBelow: 'Rechtes Knie strecken: Oberschenkel zurück, Kniescheibe hochziehen.',
      cueAbove: 'Rechtes Knie nicht überstrecken: Kniescheibe hoch, Oberschenkel zurückdrücken.',
      why: 'Aktive, gestreckte Beine tragen die Haltung; die Kniescheiben ziehen die Oberschenkelmuskeln hoch.', weight: 3,
    },
    {
      id: 'tadasana.trunk_vertical', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 5], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf nicht zur Seite kippen: Brustbein mittig über das Becken heben.',
      why: 'Die Mittelachse steht senkrecht, damit die Wirbelsäule gleichmäßig lang werden kann.', weight: 3,
    },
    {
      id: 'tadasana.weight_centered', view: 'front', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.1], label: 'Becken über Füßen',
      cueBelow: 'Gewicht mittig halten.',
      cueAbove: 'Gewicht gleichmäßig auf beide Füße verteilen: Becken mittig über die Füße schieben.',
      why: 'Gleichmäßiges Stehen auf beiden Füßen ist die Basis der Berghaltung.', weight: 3,
    },
    {
      id: 'tadasana.ears_level', view: 'front', measure: tilt('left_ear', 'right_ear', 'horizontal'),
      range: [0, 6], label: 'Kopf',
      cueBelow: 'Kopf gerade halten.',
      cueAbove: 'Kopf nicht zur Seite neigen: Kinn mittig, Ohren auf gleicher Höhe.',
      why: 'Ein gerade getragener Kopf entlastet den Nacken und folgt der Mittelachse.', weight: 1,
    },
    {
      id: 'tadasana.ear_over_shoulder', view: 'side', measure: offset('mid_ear', 'mid_shoulder', 'x', undefined, true),
      range: [0, 0.15], label: 'Ohr über Schulter',
      cueBelow: 'Kopf aufrecht halten.',
      cueAbove: 'Kopf zurück über die Schultern: Nacken lang, Kinn leicht einziehen.',
      why: 'Der Kopf sitzt über den Schultern, damit der Nacken nicht das Gewicht des Kopfes halten muss.', weight: 2,
    },
    {
      id: 'tadasana.shoulder_over_hip', view: 'side', measure: offset('mid_shoulder', 'mid_hip', 'x', undefined, true),
      range: [0, 0.12], label: 'Schulter über Hüfte',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Brustbein heben, Schultern über die Hüften: weder zurücklehnen noch vorbeugen.',
      why: 'Schulter, Hüfte und Knöchel stehen in einer Linie – die Wirbelsäule trägt, ohne zu ziehen.', weight: 3,
    },
    {
      id: 'tadasana.hip_over_ankle', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Hüfte über Knöchel',
      cueBelow: 'Becken über den Fersen halten.',
      cueAbove: 'Becken über die Knöchel bringen: Oberschenkel zurück, Gewicht in die Fersenmitte.',
      why: 'Die Schwerelinie läuft durch das Fußgelenk; so steht der Körper ohne Muskelhalten.', weight: 3,
    },
    {
      id: 'tadasana.legs_straight_side', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [168, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel zurück, Kniescheiben hochziehen.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Schienbeine nach vorn.',
      why: 'Gestreckte Beine mit aktiven Oberschenkeln bilden das Fundament.', weight: 2,
    },
  ],

  // -------------------------------------------------------------- Utkatasana
  utkatasana: [
    {
      id: 'utkatasana.knee_angle', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [90, 130], label: 'Knie',
      cueBelow: 'Etwas höher kommen: Oberschenkel möglichst waagrecht, Knie nicht tiefer als Hüfte.',
      cueAbove: 'Knie tiefer beugen: Oberschenkel Richtung Waagrechte, Gesäß zurück.',
      why: 'Die Oberschenkel arbeiten kräftig; der Stuhlwinkel bleibt, ohne dass die Knie nach vorn ausweichen.', weight: 3,
    },
    {
      id: 'utkatasana.knee_over_ankle', view: 'side', measure: offset('mid_knee', 'mid_ankle', 'x', 'forward'),
      range: [-0.05, 0.6], margin: 0.12, label: 'Knie über Fuß',
      cueBelow: 'Knie etwas mehr nach vorn beugen.',
      cueAbove: 'Gewicht in die Fersen, Gesäß weiter zurück: Knie nicht zu weit über die Zehen schieben.',
      why: 'Das Gewicht bleibt auf den Fersen, damit die Kniegelenke nicht überlastet werden.', weight: 2,
    },
    {
      id: 'utkatasana.trunk_lean', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [5, 40], margin: 10, label: 'Rumpfneigung',
      cueBelow: 'Rumpf leicht nach vorn neigen, damit die Wirbelsäule im Gleichgewicht über dem Becken bleibt.',
      cueAbove: 'Brustbein heben: Rumpf aufrichten, nicht über die Oberschenkel fallen lassen.',
      why: 'Der Rumpf hebt sich lang aus dem Becken; die Wirbelsäule bleibt aktiv statt zusammenzusinken.', weight: 2,
    },
    {
      id: 'utkatasana.arms_in_line', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [150, 180], label: 'Arme',
      cueBelow: 'Arme weiter nach oben strecken, in Verlängerung des Rumpfes, neben den Ohren.',
      cueAbove: 'Arme nicht hinter den Kopf kippen: Brustkorb heben, Arme in Linie mit dem Rumpf.',
      why: 'Arme und Rumpf bilden eine Linie nach oben und verlängern die Wirbelsäule.', weight: 2,
    },
    {
      id: 'utkatasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf mittig halten: nicht zur Seite kippen, Brustbein über das Becken.',
      why: 'Eine symmetrische Haltung zeigt gleiche Arbeit in beiden Beinen.', weight: 2,
    },
    {
      id: 'utkatasana.left_shin_vertical', view: 'front', measure: tilt('left_knee', 'left_ankle', 'vertical'),
      range: [0, 12], label: 'Linkes Schienbein',
      cueBelow: 'Linkes Knie über den Fuß halten.',
      cueAbove: 'Linkes Knie nicht nach innen oder außen fallen lassen: Knie über die Mitte des Fußes.',
      why: 'Die Knie folgen der Richtung der Füße; so bleiben die Gelenke geschützt.', weight: 2,
    },
    {
      id: 'utkatasana.right_shin_vertical', view: 'front', measure: tilt('right_knee', 'right_ankle', 'vertical'),
      range: [0, 12], label: 'Rechtes Schienbein',
      cueBelow: 'Rechtes Knie über den Fuß halten.',
      cueAbove: 'Rechtes Knie nicht nach innen oder außen fallen lassen: Knie über die Mitte des Fußes.',
      why: 'Die Knie folgen der Richtung der Füße; so bleiben die Gelenke geschützt.', weight: 2,
    },
  ],

  // --------------------------------------------------------------- Vrksasana (lead = angehobenes Bein, trail = Standbein)
  vrksasana: [
    {
      id: 'vrksasana.standing_leg_straight', view: 'front', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Kniescheibe hochziehen, Oberschenkel zurück.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel fest.',
      why: 'Das Standbein ist wie bei Tadasana fest und gestreckt – es trägt die gesamte Haltung.', weight: 3,
    },
    {
      id: 'vrksasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: die Hüfte des angehobenen Beins nicht hochziehen, beide Hüften gleich hoch.',
      why: 'Ein waagrechtes Becken zeigt, dass das Standbein sauber arbeitet und das Knie außen frei öffnet.', weight: 3,
    },
    {
      id: 'vrksasana.trunk_upright', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf über das Standbein zentrieren: nicht zur Seite lehnen, Brustbein heben.',
      why: 'Die Mittelachse bleibt senkrecht, auch wenn das Gewicht auf einem Bein ruht.', weight: 3,
    },
    {
      id: 'vrksasana.balance_line', view: 'front', measure: offset('mid_shoulder', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.2], label: 'Schwerlinie',
      cueBelow: 'Schwerpunkt über dem Standfuß halten.',
      cueAbove: 'Rumpf über den Standfuß bringen: Schultern senkrecht über das Standbein.',
      why: 'Die Schwerlinie fällt durch den Standfuß, erst dann ist das Gleichgewicht ruhig.', weight: 2,
    },
    {
      id: 'vrksasana.bent_knee_open', view: 'front', measure: tilt('lead_hip', 'lead_knee', 'horizontal'),
      range: [0, 50], margin: 12, label: 'Gebeugtes Knie',
      cueBelow: 'Knie in der Hüftlinie öffnen, nicht über Hüfthöhe heben.',
      cueAbove: 'Knie weiter nach außen öffnen: Oberschenkel zur Seite zurück, Fuß gegen das Bein drücken.',
      why: 'Die Außenrotation im Hüftgelenk öffnet die Hüfte, ohne das Knie zu verdrehen.', weight: 2,
    },
    {
      id: 'vrksasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 6], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich hoch, Schulterblätter nach unten.',
      why: 'Gleich hohe Schultern geben dem Rumpf Ruhe über dem einen Standbein.', weight: 1,
    },
    {
      id: 'vrksasana.arms_up', view: 'front', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 12], label: 'Arme',
      cueBelow: 'Arme senkrecht nach oben strecken.',
      cueAbove: 'Arme gerade über den Kopf strecken, Handflächen zusammen, Ellbogen fest.',
      why: 'Die senkrecht gestreckten Arme verlängern die Mittelachse nach oben.', weight: 1,
    },
    {
      id: 'vrksasana.standing_leg_side', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel zurück.',
      cueAbove: 'Standknie nicht nach hinten durchdrücken: Kniescheibe hoch.',
      why: 'Auch von der Seite bleibt das Standbein gestreckt und fest.', weight: 2,
    },
    {
      id: 'vrksasana.trunk_upright_side', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: nicht vorbeugen oder zurücklehnen, Brustbein heben.',
      why: 'Wie in Tadasana steht der Rumpf lang und senkrecht über dem Becken.', weight: 3,
    },
    {
      id: 'vrksasana.hip_over_ankle_side', view: 'side', measure: offset('mid_hip', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Hüfte über Standfuß',
      cueBelow: 'Becken über dem Standfuß halten.',
      cueAbove: 'Becken über den Standfuß bringen: Hüfte nicht zurückschieben, Steißbein einrollen.',
      why: 'Hüfte über Knöchel hält das Gleichgewicht ohne Ausweichbewegung.', weight: 2,
    },
  ],

  // --------------------------------------------------- Utthita Trikonasana (lead = vorderes Bein)
  utthita_trikonasana: [
    {
      id: 'utthita_trikonasana.lead_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Vorderes Bein',
      cueBelow: 'Vorderes Knie strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Vorderes Knie nicht überstrecken: Kniescheibe hoch, Oberschenkel leicht zurück.',
      why: 'Beide Beine sind fest gestreckt, damit der Rumpf frei seitlich ausschwingen kann.', weight: 3,
    },
    {
      id: 'utthita_trikonasana.trail_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Ferse in den Boden drücken.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das hintere Bein verankert die Haltung und gibt den Gegendruck zur Seitstreckung.', weight: 3,
    },
    {
      id: 'utthita_trikonasana.arms_line_vertical', view: 'side', measure: tilt('lead_wrist', 'trail_wrist', 'vertical'),
      range: [0, 12], label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Oberen Arm senkrecht über den unteren Arm drehen: beide Arme in einer senkrechten Linie.',
      why: 'Die Arme bilden eine senkrechte Linie; die Schultern öffnen sich und der Brustkorb dreht nach oben.', weight: 3,
    },
    {
      id: 'utthita_trikonasana.arms_straight_line', view: 'side', measure: angle('lead_wrist', 'mid_shoulder', 'trail_wrist'),
      range: [160, 180], label: 'Arme in einer Linie',
      cueBelow: 'Beide Arme zu einer geraden Linie strecken: Ellbogen fest, Schultern auseinander.',
      cueAbove: 'Arme in einer Linie halten, Schultern auseinander ziehen.',
      why: 'Die gestreckten Arme verlängern die Wirbelsäule nach oben und unten.', weight: 2,
    },
    {
      id: 'utthita_trikonasana.trunk_lateral', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 45], margin: 10, label: 'Rumpf seitlich',
      cueBelow: 'Rumpf in die Seitstreckung schieben, Taille lang.',
      cueAbove: 'Rumpf mehr zur Seite über das vordere Bein strecken, nicht aufrichten oder hängen lassen.',
      why: 'Die Seitstreckung kommt aus der Hüfte, nicht aus der Taille: der Rumpf verlängert sich über das vordere Bein.', weight: 2,
    },
    {
      id: 'utthita_trikonasana.lead_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.12], label: 'Vorderes Knie',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie nach außen zur Mitte des Fußes drehen: Kniescheibe über den zweiten Zeh.',
      why: 'Die Kniescheibe zeigt in Richtung der Zehen, damit das Gelenk geschont und die Beinmuskeln sauber arbeiten.', weight: 2,
    },
    {
      id: 'utthita_trikonasana.feet_in_line', view: 'front', measure: offset('lead_ankle', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.25], label: 'Fußlinie',
      cueBelow: 'Füße auf einer Linie halten.',
      cueAbove: 'Füße auf eine Linie stellen: Ferse des vorderen Fußes in Linie mit dem Gewölbe des hinteren Fußes.',
      why: 'Die Füße auf einer Linie schaffen eine stabile, aber offene Basis für die Seitstreckung.', weight: 1,
    },
  ],

  // --------------------------------------------------- Virabhadrasana II (lead = gebeugtes vorderes Bein)
  virabhadrasana_2: [
    {
      id: 'virabhadrasana_2.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [82, 105], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter oder Becken etwas höher.',
      cueAbove: 'Vorderes Knie tiefer beugen, bis der Oberschenkel waagrecht ist.',
      why: 'Der Oberschenkel liegt parallel zum Boden, das Knie bildet einen rechten Winkel – so arbeiten Bein und Hüfte maximal.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen: Becken weniger zurück.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht: Schritt weiter öffnen.',
      why: 'Das Schienbein steht senkrecht; das Knie schiebt nicht über den Fuß hinaus und wird nicht überlastet.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Außenkante des hinteren Fußes fest in den Boden.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte hintere Bein erdet die Haltung und gibt Gegenspannung zum gebeugten Knie.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.arms_line', view: 'side', measure: angle('lead_wrist', 'mid_shoulder', 'trail_wrist'),
      range: [165, 180], label: 'Arme in einer Linie',
      cueBelow: 'Beide Arme zu einer geraden Linie strecken: Ellbogen und Handgelenke fest.',
      cueAbove: 'Arme in einer Linie halten, Schultern zurück.',
      why: 'Die Arme ziehen in entgegengesetzte Richtungen und halten den Rumpf in der Mitte.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.arms_horizontal', view: 'side', measure: tilt('lead_wrist', 'trail_wrist', 'horizontal'),
      range: [0, 8], label: 'Arme waagrecht',
      cueBelow: 'Arme waagrecht halten.',
      cueAbove: 'Arme auf Schulterhöhe heben: beide Arme waagrecht, nichts hängen lassen.',
      why: 'Waagrechte Arme auf Schulterhöhe zeigen gleichmäßige Streckung beider Seiten.', weight: 2,
    },
    {
      id: 'virabhadrasana_2.trunk_vertical', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 10], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf senkrecht über das Becken: nicht zum vorderen Bein lehnen, Brustbein heben.',
      why: 'Der Rumpf bleibt mittig über dem Becken, damit die Beine die Arbeit leisten.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie nach außen über den zweiten Zeh drücken: Oberschenkel nach außen rotieren.',
      why: 'Das Knie bleibt über dem Fuß und fällt nicht nach innen, damit das Gelenk nicht verdreht wird.', weight: 3,
    },
    {
      id: 'virabhadrasana_2.shoulder_over_hip_front', view: 'front', measure: offset('mid_shoulder', 'mid_hip', 'x', undefined, true),
      range: [0, 0.15], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf mittig halten.',
      cueAbove: 'Rumpf mittig über das Becken ziehen: nicht zur Seite kippen.',
      why: 'Der Rumpf liegt mittig über der Beinebene und wird nicht verschoben.', weight: 1,
    },
    {
      id: 'virabhadrasana_2.feet_in_line', view: 'front', measure: offset('lead_ankle', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.25], label: 'Fußlinie',
      cueBelow: 'Füße auf einer Linie halten.',
      cueAbove: 'Füße auf eine Linie stellen: vordere Ferse in Linie mit dem hinteren Fußgewölbe.',
      why: 'Die Füße auf einer Linie geben eine breite, stabile Basis.', weight: 1,
    },
  ],

  // --------------------------------------------------- Virabhadrasana I (lead = gebeugtes vorderes Bein)
  virabhadrasana_1: [
    {
      id: 'virabhadrasana_1.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [82, 105], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter öffnen oder Becken höher.',
      cueAbove: 'Vorderes Knie tiefer beugen, bis der Oberschenkel waagrecht ist.',
      why: 'Der Oberschenkel liegt parallel zum Boden; das Knie bildet einen rechten Winkel über der Ferse.', weight: 3,
    },
    {
      id: 'virabhadrasana_1.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht: Schritt weiter.',
      why: 'Das Schienbein steht senkrecht, das Knie bleibt über der Ferse und das Gelenk geschützt.', weight: 3,
    },
    {
      id: 'virabhadrasana_1.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel zurückdrücken, Ferse in den Boden.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte hintere Bein erdet die Haltung, während der Rumpf aufsteigt.', weight: 3,
    },
    {
      id: 'virabhadrasana_1.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 10], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: nicht zum vorderen Bein lehnen, Brustbein heben, Taille lang.',
      why: 'Der Rumpf steigt senkrecht aus dem Becken, das nach vorn gerichtet ist.', weight: 3,
    },
    {
      id: 'virabhadrasana_1.arms_overhead', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [150, 180], label: 'Arme über Kopf',
      cueBelow: 'Arme weiter nach oben strecken, neben den Ohren, in Verlängerung des Rumpfes.',
      cueAbove: 'Arme nicht zu weit nach hinten ziehen: Rippen weich, Arme in Linie mit dem Rumpf.',
      why: 'Die Arme verlängern die Wirbelsäule nach oben; der Brustkorb öffnet sich ohne Hohlkreuz.', weight: 2,
    },
    {
      id: 'virabhadrasana_1.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 6], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich hoch, Brustbein nach vorn heben.',
      why: 'Die Brust zeigt frontal nach vorn, die Schultern liegen auf einer Linie.', weight: 2,
    },
    {
      id: 'virabhadrasana_1.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüftknochen gleich hoch und frontal nach vorn drehen.',
      why: 'Das Becken blickt gerade nach vorn; hierin liegt die Schwierigkeit von Virabhadrasana I.', weight: 3,
    },
    {
      id: 'virabhadrasana_1.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf mittig halten.',
      cueAbove: 'Rumpf mittig über das Becken ziehen: nicht zur Seite kippen.',
      why: 'Der Rumpf steigt mittig aus dem Becken.', weight: 2,
    },
    {
      id: 'virabhadrasana_1.arms_vertical_front', view: 'front', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 10], label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Arme parallel nach oben strecken, Handflächen gegeneinander.',
      why: 'Die parallel gestreckten Arme verlängern die Mittelachse.', weight: 1,
    },
    {
      id: 'virabhadrasana_1.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.12], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie über den zweiten Zeh ausrichten, nicht nach innen sinken lassen.',
      why: 'Das Knie bleibt in Richtung der Zehen, damit das Gelenk nicht verdreht wird.', weight: 2,
    },
  ],

  // --------------------------------------------------- Utthita Parsvakonasana (lead = gebeugtes vorderes Bein)
  utthita_parsvakonasana: [
    {
      id: 'utthita_parsvakonasana.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [82, 105], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter öffnen.',
      cueAbove: 'Vorderes Knie tiefer beugen, bis der Oberschenkel waagrecht ist.',
      why: 'Der Oberschenkel liegt parallel zum Boden, das Schienbein steht senkrecht – die Basis für die lange Seitenlinie.', weight: 3,
    },
    {
      id: 'utthita_parsvakonasana.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht.',
      why: 'Das Knie bleibt über der Ferse, damit der Oberschenkel waagrecht tragen kann.', weight: 3,
    },
    {
      id: 'utthita_parsvakonasana.back_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [168, 180], label: 'Hinteres Bein',
      cueBelow: 'Hinteres Knie strecken: Oberschenkel hochziehen, Außenkante des Fußes in den Boden.',
      cueAbove: 'Hinteres Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das hintere Bein bildet die Verlängerung der Seitenlinie bis zum Fuß.', weight: 3,
    },
    {
      id: 'utthita_parsvakonasana.side_line', view: 'side', measure: angle('trail_ankle', 'trail_shoulder', 'trail_wrist'),
      range: [160, 180], margin: 10, label: 'Seitenlinie',
      cueBelow: 'Hinteres Bein, Rumpf und oberen Arm zu einer langen schrägen Linie strecken: Arm neben dem Ohr nach vorn.',
      cueAbove: 'Oberen Arm in Linie mit dem Rumpf halten, nicht über den Kopf hängen lassen.',
      why: 'Fuß, Hüfte, Schulter und Hand liegen auf einer langen Linie – das Wesen der Seitstreckung.', weight: 3,
    },
    {
      id: 'utthita_parsvakonasana.trunk_diagonal', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [25, 70], margin: 10, label: 'Rumpfneigung',
      cueBelow: 'Rumpf höher nehmen, nicht auf dem Oberschenkel ablegen.',
      cueAbove: 'Rumpf weiter zur Seite über das vordere Bein strecken.',
      why: 'Der Rumpf lehnt sich nicht auf den Schenkel, sondern bleibt lang nach vorn und oben gestreckt.', weight: 2,
    },
    {
      id: 'utthita_parsvakonasana.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie nach außen drücken, über den zweiten Zeh – der Oberarm hilft dabei.',
      why: 'Das Knie bleibt über dem Fuß und fällt nicht nach innen.', weight: 3,
    },
    {
      id: 'utthita_parsvakonasana.feet_in_line', view: 'front', measure: offset('lead_ankle', 'trail_ankle', 'x', undefined, true),
      range: [0, 0.25], label: 'Fußlinie',
      cueBelow: 'Füße auf einer Linie halten.',
      cueAbove: 'Füße auf eine Linie stellen: vordere Ferse in Linie mit dem hinteren Fußgewölbe.',
      why: 'Die Füße auf einer Linie schaffen eine stabile Basis für die Seitstreckung.', weight: 1,
    },
  ],

  // --------------------------------------------------- Ardha Chandrasana (lead = Standbein)
  ardha_chandrasana: [
    {
      id: 'ardha_chandrasana.standing_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel leicht zurück.',
      why: 'Das Standbein ist fest und gestreckt, nur so kann sich das andere Bein frei heben.', weight: 3,
    },
    {
      id: 'ardha_chandrasana.standing_leg_vertical', view: 'side', measure: tilt('lead_hip', 'lead_ankle', 'vertical'),
      range: [0, 12], label: 'Standbein senkrecht',
      cueBelow: 'Standbein senkrecht halten.',
      cueAbove: 'Standbein senkrecht aufrichten: Hüfte über den Standfuß, nicht seitlich wegdriften.',
      why: 'Ein senkrechtes Standbein ist die Achse, um die sich Rumpf und angehobenes Bein ausbalancieren.', weight: 2,
    },
    {
      id: 'ardha_chandrasana.lifted_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Angehobenes Bein',
      cueBelow: 'Angehobenes Knie strecken: Oberschenkel aktiv, Ferse nach außen drücken.',
      cueAbove: 'Angehobenes Knie nicht überstrecken.',
      why: 'Das angehobene Bein bleibt aktiv und lang bis in die Ferse, es ist kein bloßes Gewicht.', weight: 2,
    },
    {
      id: 'ardha_chandrasana.lifted_leg_horizontal', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'horizontal'),
      range: [0, 15], label: 'Angehobenes Bein waagrecht',
      cueBelow: 'Angehobenes Bein waagrecht halten.',
      cueAbove: 'Angehobenes Bein höher heben, bis es parallel zum Boden ist.',
      why: 'Das waagrechte Bein bildet mit dem Standbein einen rechten Winkel und gibt dem Halbmond seine Form.', weight: 3,
    },
    {
      id: 'ardha_chandrasana.trunk_horizontal', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 25], margin: 10, label: 'Rumpf waagrecht',
      cueBelow: 'Rumpf waagrecht halten.',
      cueAbove: 'Rumpf weiter nach vorn öffnen: Brustbein zur Seite, Rumpf parallel zum Boden.',
      why: 'Rumpf und angehobenes Bein bilden eine waagrechte Linie über dem Standbein.', weight: 2,
    },
    {
      id: 'ardha_chandrasana.arms_line_vertical', view: 'side', measure: tilt('lead_wrist', 'trail_wrist', 'vertical'),
      range: [0, 12], label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Oberen Arm senkrecht über den unteren Arm drehen: beide Arme in einer senkrechten Linie.',
      why: 'Die senkrechten Arme öffnen den Brustkorb nach oben und stabilisieren die Balance.', weight: 3,
    },
    {
      id: 'ardha_chandrasana.standing_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.12], label: 'Standknie',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Standknie über den zweiten Zeh ausrichten, Kniescheibe hoch.',
      why: 'Das Standknie folgt der Fußrichtung und wird nicht verdreht.', weight: 2,
    },
  ],

  // -------------------------------------------------------------- Uttanasana
  uttanasana: [
    {
      id: 'uttanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Kniescheiben hoch.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel zurückdrücken.',
      why: 'Die Beine sind fest gestreckt, damit die Dehnung der Beinrückseite und des Rückens in den Hüften beginnt.', weight: 3,
    },
    {
      id: 'uttanasana.hip_over_ankle', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.2], margin: 0.1, label: 'Hüfte über Knöchel',
      cueBelow: 'Becken über den Knöcheln halten.',
      cueAbove: 'Becken nach oben und über die Knöchel bringen: Gewicht von den Zehen zu den Fersen.',
      why: 'Das Becken bleibt über den Fersen, damit die Beuge aus der Hüfte kommt und nicht aus dem Rücken.', weight: 3,
    },
    {
      id: 'uttanasana.trunk_folded', view: 'side', measure: offset('mid_shoulder', 'mid_hip', 'y', 'down'),
      range: [0.4, 1.3], margin: 0.15, label: 'Rumpf gefaltet',
      cueBelow: 'Rumpf weiter nach unten falten: Brustbein zu den Schienbeinen.',
      cueAbove: 'Schultern etwas heben, Rumpf lang halten, nicht hängen lassen.',
      why: 'Der Rumpf hängt aus den Hüften über die Beine, die Wirbelsäule bleibt lang.', weight: 2,
    },
    {
      id: 'uttanasana.hands_reach_floor', view: 'side', measure: offset('mid_wrist', 'mid_ankle', 'y', undefined, true),
      range: [0, 0.5], margin: 0.15, label: 'Hände am Boden',
      cueBelow: 'Hände neben die Füße stellen.',
      cueAbove: 'Hände Richtung Boden bringen oder Blöcke benutzen; nicht den Rücken runden.',
      why: 'Die Hände auf dem Boden geben einen Widerstand zum Verlängern des Rumpfes.', weight: 1,
    },
    {
      id: 'uttanasana.head_released', view: 'side', measure: offset('mid_ear', 'mid_shoulder', 'y', 'down'),
      range: [-0.1, 1.0], margin: 0.15, label: 'Kopf',
      cueBelow: 'Kopf loslassen, Nacken lang, Ohren Richtung Boden.',
      cueAbove: 'Kopf in Verlängerung der Wirbelsäule halten.',
      why: 'Der Kopf hängt entspannt, der Nacken bleibt weich und verlängert die Wirbelsäule.', weight: 1,
    },
    {
      id: 'uttanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüftknochen gleich hoch, Gewicht gleichmäßig auf beide Füße.',
      why: 'Das Becken beugt symmetrisch aus den Hüftgelenken.', weight: 2,
    },
    {
      id: 'uttanasana.left_leg_vertical', view: 'front', measure: tilt('left_hip', 'left_ankle', 'vertical'),
      range: [0, 10], label: 'Linkes Bein',
      cueBelow: 'Bein senkrecht halten.',
      cueAbove: 'Linkes Bein senkrecht ausrichten: Oberschenkel nicht nach außen kippen lassen.',
      why: 'Parallele, senkrechte Beine geben der Vorbeuge eine klare Basis.', weight: 2,
    },
    {
      id: 'uttanasana.right_leg_vertical', view: 'front', measure: tilt('right_hip', 'right_ankle', 'vertical'),
      range: [0, 10], label: 'Rechtes Bein',
      cueBelow: 'Bein senkrecht halten.',
      cueAbove: 'Rechtes Bein senkrecht ausrichten: Oberschenkel nicht nach außen kippen lassen.',
      why: 'Parallele, senkrechte Beine geben der Vorbeuge eine klare Basis.', weight: 2,
    },
  ],

  // ----------------------------------------------------- Adho Mukha Svanasana
  adho_mukha_svanasana: [
    {
      id: 'adho_mukha_svanasana.arms_trunk_line', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [150, 180], label: 'Arme und Rumpf',
      cueBelow: 'Arme und Rumpf zu einer Linie strecken: Brustbein zu den Oberschenkeln, Schultern von den Händen wegschieben.',
      cueAbove: 'Brustkorb nicht durchhängen lassen: Rippen zurück, Arme und Rumpf in Linie.',
      why: 'Arme und Wirbelsäule bilden eine lange gerade Linie von den Händen bis zum Becken.', weight: 3,
    },
    {
      id: 'adho_mukha_svanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Fersen Richtung Boden.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Gestreckte Beine mit aktiven Oberschenkeln heben das Becken und verlängern die Wirbelsäule.', weight: 3,
    },
    {
      id: 'adho_mukha_svanasana.hip_apex', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [55, 100], margin: 10, label: 'Hüftwinkel',
      cueBelow: 'Becken nicht zu steil nach oben schieben, Beine lang lassen.',
      cueAbove: 'Sitzbeine höher heben: Becken nach oben und hinten, Oberschenkel zurück.',
      why: 'Das Becken ist der höchste Punkt; von dort laufen Rumpf und Beine in langen Linien nach unten.', weight: 2,
    },
    {
      id: 'adho_mukha_svanasana.heels_down', view: 'side', measure: offset('mid_ankle', 'mid_wrist', 'y', 'up'),
      range: [-0.25, 0.3], margin: 0.1, label: 'Fersen',
      cueBelow: 'Beine weiter strecken, Fersen vom Becken wegschieben.',
      cueAbove: 'Fersen Richtung Boden drücken: Oberschenkel zurück und Wade verlängern.',
      why: 'Die Fersen ziehen zum Boden und lenken die Beinrückseite nach hinten unten.', weight: 1,
    },
    {
      id: 'adho_mukha_svanasana.head_between_arms', view: 'side', measure: offset('mid_ear', 'mid_shoulder', 'y', 'down'),
      range: [-0.1, 0.8], margin: 0.15, label: 'Kopf',
      cueBelow: 'Kopf zwischen die Oberarme sinken lassen, Nacken lang.',
      cueAbove: 'Kopf entspannen, Hals lang.',
      why: 'Der Kopf hängt zwischen den Armen, der Nacken ist lang und entspannt.', weight: 1,
    },
    {
      id: 'adho_mukha_svanasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 6], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Beide Hände gleichmäßig in den Boden drücken: Schultern auf gleiche Höhe bringen.',
      why: 'Gleichmäßiger Druck auf beide Hände hält den Schultergürtel waagrecht.', weight: 2,
    },
    {
      id: 'adho_mukha_svanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Sitzbeine gleich hoch zur Decke.',
      why: 'Ein waagrechtes Becken zeigt gleichmäßige Beinarbeit.', weight: 2,
    },
    {
      id: 'adho_mukha_svanasana.hands_level', view: 'front', measure: tilt('left_wrist', 'right_wrist', 'horizontal'),
      range: [0, 6], label: 'Hände',
      cueBelow: 'Hände auf einer Höhe halten.',
      cueAbove: 'Hände parallel auf gleicher Höhe, Zeigefinger nach vorn.',
      why: 'Die Hände stehen schulterbreit und gleich hoch als stabile Basis.', weight: 1,
    },
  ],

  // ----------------------------------------------------- Chaturanga Dandasana
  chaturanga_dandasana: [
    {
      id: 'chaturanga_dandasana.left_elbow_angle', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [80, 105], margin: 10, label: 'Linker Ellbogen',
      cueBelow: 'Nicht tiefer sinken: Ellbogen nicht unter 90° beugen.',
      cueAbove: 'Ellbogen tiefer beugen, bis die Oberarme parallel zum Boden sind.',
      why: 'Der Ellbogen bildet einen rechten Winkel, der Oberarm liegt parallel zum Boden.', weight: 3,
    },
    {
      id: 'chaturanga_dandasana.right_elbow_angle', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [80, 105], margin: 10, label: 'Rechter Ellbogen',
      cueBelow: 'Nicht tiefer sinken: Ellbogen nicht unter 90° beugen.',
      cueAbove: 'Ellbogen tiefer beugen, bis die Oberarme parallel zum Boden sind.',
      why: 'Der Ellbogen bildet einen rechten Winkel, der Oberarm liegt parallel zum Boden.', weight: 3,
    },
    {
      id: 'chaturanga_dandasana.body_line', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [165, 180], label: 'Körperlinie',
      cueBelow: 'Becken weder hängen lassen noch hochschieben: Steißbein Richtung Fersen, Bauch fest.',
      cueAbove: 'Körper zu einer geraden Linie strecken.',
      why: 'Kopf, Rumpf und Fersen bilden ein gerades Brett, wie ein Stock.', weight: 3,
    },
    {
      id: 'chaturanga_dandasana.body_horizontal', view: 'side', measure: tilt('mid_shoulder', 'mid_ankle', 'horizontal'),
      range: [0, 12], label: 'Körper waagrecht',
      cueBelow: 'Körper waagrecht halten.',
      cueAbove: 'Körper parallel zum Boden halten: Brust und Becken gleich hoch.',
      why: 'Der gesamte Körper schwebt parallel zum Boden und wird von den Armen getragen.', weight: 2,
    },
    {
      id: 'chaturanga_dandasana.neck_neutral', view: 'side', measure: angle('mid_ear', 'mid_shoulder', 'mid_hip'),
      range: [140, 180], margin: 10, label: 'Nacken',
      cueBelow: 'Nacken lang halten, Blick zum Boden vor die Hände, Kopf nicht hochreißen.',
      cueAbove: 'Kopf in Verlängerung der Wirbelsäule halten.',
      why: 'Der Nacken bleibt in der Linie der Wirbelsäule und wird nicht überstreckt.', weight: 1,
    },
  ],

  // ----------------------------------------------------- Urdhva Mukha Svanasana
  urdhva_mukha_svanasana: [
    {
      id: 'urdhva_mukha_svanasana.left_arm_straight', view: 'side', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [165, 180], label: 'Linker Arm',
      cueBelow: 'Arm vollständig strecken: Hände fest in den Boden, Ellbogen fest.',
      cueAbove: 'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      why: 'Die gestreckten Arme tragen den Rumpf und heben den Brustkorb.', weight: 3,
    },
    {
      id: 'urdhva_mukha_svanasana.right_arm_straight', view: 'side', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [165, 180], label: 'Rechter Arm',
      cueBelow: 'Arm vollständig strecken: Hände fest in den Boden, Ellbogen fest.',
      cueAbove: 'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      why: 'Die gestreckten Arme tragen den Rumpf und heben den Brustkorb.', weight: 3,
    },
    {
      id: 'urdhva_mukha_svanasana.shoulders_over_wrists', view: 'side', measure: offset('mid_shoulder', 'mid_wrist', 'x', undefined, true),
      range: [0, 0.25], margin: 0.1, label: 'Schultern über Händen',
      cueBelow: 'Schultern über den Handgelenken halten.',
      cueAbove: 'Brustkorb zwischen den Armen nach vorn ziehen: Schultern über die Handgelenke schieben.',
      why: 'Die Hände stehen unter den Schultern, damit die Arme senkrecht tragen und die Brust sich heben kann.', weight: 3,
    },
    {
      id: 'urdhva_mukha_svanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen.',
      cueAbove: 'Knie nicht überstrecken.',
      why: 'Fest gestreckte Beine halten die Oberschenkel vom Boden und stützen den unteren Rücken.', weight: 2,
    },
    {
      id: 'urdhva_mukha_svanasana.thighs_lifted', view: 'side', measure: offset('mid_knee', 'mid_ankle', 'y', 'up'),
      range: [0.08, 1.0], margin: 0.08, label: 'Oberschenkel gehoben',
      cueBelow: 'Oberschenkel und Knie vom Boden heben, Beine fest strecken.',
      cueAbove: 'Beine ruhig halten, Becken tiefer lassen.',
      why: 'Nur die Hände und die Fußrücken berühren den Boden; die Oberschenkel sind aktiv gehoben.', weight: 2,
    },
    {
      id: 'urdhva_mukha_svanasana.chest_lifted', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [20, 75], margin: 10, label: 'Brust gehoben',
      cueBelow: 'Brustbein heben: Brustkorb nach vorn und oben ziehen, Schultern zurück.',
      cueAbove: 'Brustkorb weiter nach vorn öffnen, Rumpf nicht zu steil aufrichten.',
      why: 'Die Brust hebt und öffnet sich, ohne dass der untere Rücken einknickt.', weight: 2,
    },
  ],

  // ----------------------------------------------------- Dandasana
  dandasana: [
    {
      id: 'dandasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [168, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel in den Boden drücken, Fersen vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Beide Beine sind fest gestreckt und aktiv, sie bilden die Basis für den Rumpf.', weight: 3,
    },
    {
      id: 'dandasana.legs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 10], label: 'Beine am Boden',
      cueBelow: 'Beine am Boden lassen.',
      cueAbove: 'Beine auf den Boden senken, Oberschenkel in den Boden drücken.',
      why: 'Die Beine ruhen gestreckt auf dem Boden und geben dem Becken sicheren Halt.', weight: 2,
    },
    {
      id: 'dandasana.trunk_vertical', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 10], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten, nicht zurücklehnen oder vorbeugen: Sitzbeine in den Boden, Brustbein hoch.',
      why: 'Der Rumpf steigt senkrecht aus dem Becken, wie in Tadasana.', weight: 3,
    },
    {
      id: 'dandasana.hip_angle', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [80, 100], margin: 10, label: 'Hüftwinkel',
      cueBelow: 'Rumpf aufrichten, Becken nach vorn über die Sitzbeine rollen.',
      cueAbove: 'Nicht zurücklehnen: Becken aufrichten, Sitzbeine nach hinten.',
      why: 'Der rechte Winkel zwischen Rumpf und Beinen zeigt, dass das Becken aufrecht steht.', weight: 3,
    },
    {
      id: 'dandasana.ear_over_shoulder', view: 'side', measure: offset('mid_ear', 'mid_shoulder', 'x', undefined, true),
      range: [0, 0.15], label: 'Ohr über Schulter',
      cueBelow: 'Kopf aufrecht halten.',
      cueAbove: 'Kopf zurück über die Schultern, Kinn leicht einziehen, Nacken lang.',
      why: 'Der Kopf sitzt über dem Rumpf, so bleibt die Wirbelsäule bis oben lang.', weight: 1,
    },
    {
      id: 'dandasana.arms_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 20], margin: 10, label: 'Arme neben Hüften',
      cueBelow: 'Hände neben den Hüften halten.',
      cueAbove: 'Hände neben die Hüften stellen, Arme senkrecht strecken, Brustbein heben.',
      why: 'Die Hände neben dem Becken stützen und helfen, den Brustkorb zu heben.', weight: 1,
    },
  ],

  // ----------------------------------------------------- Paschimottanasana
  paschimottanasana: [
    {
      id: 'paschimottanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel in den Boden drücken, Fersen vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch.',
      why: 'Gestreckte, feste Beine erlauben die Vorbeuge aus der Hüfte.', weight: 3,
    },
    {
      id: 'paschimottanasana.legs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 12], label: 'Beine am Boden',
      cueBelow: 'Beine am Boden lassen.',
      cueAbove: 'Beine auf den Boden drücken, Knie nicht anheben.',
      why: 'Die Beine bleiben am Boden, damit die Dehnung der Rückseite gleichmäßig ist.', weight: 2,
    },
    {
      id: 'paschimottanasana.hip_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [0, 50], margin: 15, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Aus den Hüften weiter nach vorn beugen: Bauch zuerst, Brustbein zu den Füßen, nicht den Rücken runden.',
      why: 'Der Rumpf beugt aus den Hüften über die Beine; Bauch und Brustkorb folgen nacheinander.', weight: 3,
    },
    {
      id: 'paschimottanasana.hands_reach_feet', view: 'side', measure: offset('mid_wrist', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.6], margin: 0.2, label: 'Hände zu den Füßen',
      cueBelow: 'Hände an den Füßen halten.',
      cueAbove: 'Hände weiter zu den Füßen strecken (oder Gurt benutzen), Arme lang.',
      why: 'Die Hände greifen die Füße und geben Widerstand für die Rumpfstreckung.', weight: 2,
    },
    {
      id: 'paschimottanasana.neck_long', view: 'side', measure: angle('mid_ear', 'mid_shoulder', 'mid_hip'),
      range: [140, 180], margin: 10, label: 'Nacken',
      cueBelow: 'Nacken lang halten, Kopf nicht fallen lassen oder hochreißen.',
      cueAbove: 'Kopf in Verlängerung der Wirbelsäule.',
      why: 'Der Nacken bleibt in der Verlängerung der Wirbelsäule.', weight: 1,
    },
  ],

  // ----------------------------------------------------- Setu Bandha Sarvangasana
  setu_bandha_sarvangasana: [
    {
      id: 'setu_bandha_sarvangasana.knee_angle', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [80, 110], margin: 10, label: 'Knie',
      cueBelow: 'Füße etwas weiter weg vom Gesäß stellen, damit die Knie über den Fersen sind.',
      cueAbove: 'Füße näher zum Gesäß stellen, Knie über die Fersen.',
      why: 'Die Knie bilden etwa einen rechten Winkel, damit die Beine das Becken kräftig tragen.', weight: 3,
    },
    {
      id: 'setu_bandha_sarvangasana.shin_vertical', view: 'side', measure: tilt('mid_knee', 'mid_ankle', 'vertical'),
      range: [0, 15], label: 'Schienbein',
      cueBelow: 'Schienbeine senkrecht halten.',
      cueAbove: 'Schienbeine senkrecht stellen: Knie genau über die Fersen.',
      why: 'Senkrechte Schienbeine stützen die Hebung des Beckens und schonen die Knie.', weight: 3,
    },
    {
      id: 'setu_bandha_sarvangasana.hip_height', view: 'side', measure: offset('mid_hip', 'mid_knee', 'y', 'up'),
      range: [-0.05, 0.5], margin: 0.1, label: 'Beckenhöhe',
      cueBelow: 'Becken höher heben: Oberschenkel mindestens waagrecht, Gesäß fest.',
      cueAbove: 'Becken nicht übermäßig hochschieben, Brustbein zum Kinn heben.',
      why: 'Die Oberschenkel liegen waagrecht oder steigen zu den Hüften an, so hebt sich die Wirbelsäule gleichmäßig.', weight: 2,
    },
    {
      id: 'setu_bandha_sarvangasana.body_extension', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [120, 180], margin: 10, label: 'Hüftstreckung',
      cueBelow: 'Becken weiter heben: Hüften nach oben, Brustbein zum Kinn.',
      cueAbove: 'Rumpf und Oberschenkel in Linie, nicht überstrecken.',
      why: 'Brustkorb und Hüfte öffnen sich zu einem langen Bogen, ohne dass der Lendenbereich einknickt.', weight: 2,
    },
    {
      id: 'setu_bandha_sarvangasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüften gleich hoch heben.',
      why: 'Das Becken hebt symmetrisch; ungleiche Hebung verrät ungleiche Beinarbeit.', weight: 2,
    },
    {
      id: 'setu_bandha_sarvangasana.left_knee_tracking', view: 'front', measure: offset('left_knee', 'left_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Linkes Knie',
      cueBelow: 'Knie über dem Fuß halten.',
      cueAbove: 'Linkes Knie über die Mitte des Fußes ausrichten, weder nach innen noch außen kippen.',
      why: 'Die Knie bleiben parallel über den Füßen und geben dem Becken eine gerade Basis.', weight: 2,
    },
    {
      id: 'setu_bandha_sarvangasana.right_knee_tracking', view: 'front', measure: offset('right_knee', 'right_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Rechtes Knie',
      cueBelow: 'Knie über dem Fuß halten.',
      cueAbove: 'Rechtes Knie über die Mitte des Fußes ausrichten, weder nach innen noch außen kippen.',
      why: 'Die Knie bleiben parallel über den Füßen und geben dem Becken eine gerade Basis.', weight: 2,
    },
  ],

  // ----------------------------------------------------- Urdhva Hastasana
  urdhva_hastasana: [
    {
      id: 'urdhva_hastasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [168, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel zurück, Kniescheiben hochziehen.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Schienbeine nach vorn.',
      why: 'Die Beine stehen wie in Tadasana fest und gestreckt – sie tragen die Streckung der Arme.', weight: 3,
    },
    {
      id: 'urdhva_hastasana.hip_over_ankle', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.15], label: 'Hüfte über Knöchel',
      cueBelow: 'Becken über den Fersen halten.',
      cueAbove: 'Becken über die Knöchel bringen: Gewicht in die Fersenmitte, nicht ins Hohlkreuz schieben.',
      why: 'Auch mit erhobenen Armen läuft die Schwerelinie durch das Fußgelenk.', weight: 2,
    },
    {
      id: 'urdhva_hastasana.trunk_vertical', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 8], label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: nicht zurücklehnen, Brustbein heben, untere Rippen zurück.',
      why: 'Der Rumpf bleibt senkrecht; die Arme verlängern ihn, ohne dass der untere Rücken einknickt.', weight: 3,
    },
    {
      id: 'urdhva_hastasana.arms_in_line', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [155, 180], margin: 10, label: 'Arme in Linie',
      cueBelow: 'Arme in Verlängerung des Rumpfes strecken, Oberarme neben die Ohren.',
      cueAbove: 'Arme in Linie mit dem Rumpf halten.',
      why: 'Die Oberarme liegen neben den Ohren; Arme und Rumpf bilden eine lange senkrechte Linie.', weight: 3,
    },
    {
      id: 'urdhva_hastasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf nicht zur Seite kippen: Brustbein mittig über das Becken heben.',
      why: 'Die Mittelachse steht senkrecht, damit die Wirbelsäule gleichmäßig lang wird.', weight: 3,
    },
    {
      id: 'urdhva_hastasana.arms_vertical', view: 'front', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 10], label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Arme parallel senkrecht nach oben strecken, Handflächen einander zugewandt.',
      why: 'Die parallel gestreckten Arme verlängern die Mittelachse nach oben.', weight: 2,
    },
    {
      id: 'urdhva_hastasana.left_arm_straight', view: 'front', measure: angle('left_shoulder', 'left_elbow', 'left_wrist'),
      range: [165, 180], label: 'Linker Arm',
      cueBelow: 'Linken Ellbogen strecken: Finger weit nach oben, Oberarm neben das Ohr.',
      cueAbove: 'Linken Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      why: 'Die Arme sind bis in die Fingerspitzen gestreckt, damit sich die Seiten des Rumpfes heben.', weight: 2,
    },
    {
      id: 'urdhva_hastasana.right_arm_straight', view: 'front', measure: angle('right_shoulder', 'right_elbow', 'right_wrist'),
      range: [165, 180], label: 'Rechter Arm',
      cueBelow: 'Rechten Ellbogen strecken: Finger weit nach oben, Oberarm neben das Ohr.',
      cueAbove: 'Rechten Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      why: 'Die Arme sind bis in die Fingerspitzen gestreckt, damit sich die Seiten des Rumpfes heben.', weight: 2,
    },
  ],

  // ----------------------------------------------------- Ardha Uttanasana
  ardha_uttanasana: [
    {
      id: 'ardha_uttanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Kniescheiben hoch.',
      cueAbove: 'Knie nicht überstrecken: Kniescheiben hoch, Oberschenkel zurückdrücken.',
      why: 'Fest gestreckte Beine sind die Basis, damit der Rumpf aus den Hüften nach vorn schwingen kann.', weight: 3,
    },
    {
      id: 'ardha_uttanasana.legs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'vertical'),
      range: [0, 12], label: 'Beine senkrecht',
      cueBelow: 'Beine senkrecht halten.',
      cueAbove: 'Becken über die Knöchel bringen: Sitzbeine nach oben und hinten, Gewicht in die Fersen.',
      why: 'Die senkrechten Beine tragen das Becken; die Beuge kommt aus den Hüften, nicht aus dem Rücken.', weight: 3,
    },
    {
      id: 'ardha_uttanasana.trunk_horizontal', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Rumpf waagrecht',
      cueBelow: 'Rumpf waagrecht halten.',
      cueAbove: 'Rumpf weiter aus den Hüften nach vorn strecken, bis er etwa parallel zum Boden ist.',
      why: 'Der Rumpf liegt lang und waagrecht, die Wirbelsäule streckt sich nach vorn statt nach unten zu hängen.', weight: 3,
    },
    {
      id: 'ardha_uttanasana.neck_long', view: 'side', measure: angle('mid_ear', 'mid_shoulder', 'mid_hip'),
      range: [140, 180], margin: 10, label: 'Nacken',
      cueBelow: 'Nacken lang halten, Blick zum Boden vor die Füße, Kopf nicht hochreißen oder hängen lassen.',
      cueAbove: 'Kopf in Verlängerung der Wirbelsäule halten.',
      why: 'Der Nacken bleibt in der Linie der Wirbelsäule, die konkav und lang bleibt.', weight: 1,
    },
    {
      id: 'ardha_uttanasana.hands_down', view: 'side', measure: offset('mid_wrist', 'mid_hip', 'y', 'down'),
      range: [0.3, 2.0], margin: 0.2, label: 'Hände',
      cueBelow: 'Hände tiefer auf die Schienbeine oder den Boden legen, Arme lang.',
      cueAbove: 'Hände etwas höher auf die Schienbeine oder Blöcke stützen, um den Rücken nicht zu runden.',
      why: 'Die Hände stützen auf Schienbeinen oder Boden und geben Widerstand, um den Rumpf zu verlängern.', weight: 1,
    },
    {
      id: 'ardha_uttanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 6], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüftknochen gleich hoch, Gewicht gleichmäßig auf beide Füße.',
      why: 'Das Becken beugt symmetrisch aus den Hüftgelenken.', weight: 2,
    },
    {
      id: 'ardha_uttanasana.left_leg_vertical', view: 'front', measure: tilt('left_hip', 'left_ankle', 'vertical'),
      range: [0, 10], label: 'Linkes Bein',
      cueBelow: 'Bein senkrecht halten.',
      cueAbove: 'Linkes Bein senkrecht ausrichten: Oberschenkel nicht nach außen kippen lassen.',
      why: 'Parallele, senkrechte Beine geben der Vorbeuge eine klare Basis.', weight: 2,
    },
    {
      id: 'ardha_uttanasana.right_leg_vertical', view: 'front', measure: tilt('right_hip', 'right_ankle', 'vertical'),
      range: [0, 10], label: 'Rechtes Bein',
      cueBelow: 'Bein senkrecht halten.',
      cueAbove: 'Rechtes Bein senkrecht ausrichten: Oberschenkel nicht nach außen kippen lassen.',
      why: 'Parallele, senkrechte Beine geben der Vorbeuge eine klare Basis.', weight: 2,
    },
  ],

  // --------------------------------------------------- Anjaneyasana (lead = vorderes gebeugtes Bein, trail = hinteres Bein, Knie am Boden)
  anjaneyasana: [
    {
      id: 'anjaneyasana.front_knee_angle', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [82, 105], margin: 10, label: 'Vorderes Knie',
      cueBelow: 'Vorderes Knie nicht weiter als 90° beugen: Schritt weiter öffnen.',
      cueAbove: 'Vorderes Knie tiefer beugen, Becken nach vorn und unten sinken lassen.',
      why: 'Das vordere Knie bildet etwa einen rechten Winkel, das Becken sinkt tief zwischen die Beine.', weight: 3,
    },
    {
      id: 'anjaneyasana.knee_over_heel', view: 'side', measure: offset('lead_knee', 'lead_ankle', 'x', 'forward'),
      range: [-0.15, 0.12], margin: 0.1, label: 'Knie über Ferse',
      cueBelow: 'Knie nach vorn über die Ferse bringen.',
      cueAbove: 'Knie zurück über die Ferse, Schienbein senkrecht: Schritt weiter öffnen.',
      why: 'Das Schienbein steht senkrecht; das Knie schiebt nicht über den Fuß hinaus und wird nicht überlastet.', weight: 3,
    },
    {
      id: 'anjaneyasana.back_thigh', view: 'side', measure: tilt('trail_hip', 'trail_knee', 'vertical'),
      range: [0, 30], margin: 12, label: 'Hinterer Oberschenkel',
      cueBelow: 'Hinteren Oberschenkel senkrecht halten.',
      cueAbove: 'Hinteres Knie näher unter die Hüfte bringen, Becken nach vorn sinken lassen.',
      why: 'Das hintere Knie liegt am Boden, der Oberschenkel streckt sich nach unten, während das Becken nach vorn sinkt.', weight: 2,
    },
    {
      id: 'anjaneyasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], margin: 10, label: 'Rumpf',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, nicht zum vorderen Bein lehnen.',
      why: 'Der Rumpf steigt lang aus dem Becken auf, die Hüftbeuger des hinteren Beins dehnen sich.', weight: 3,
    },
    {
      id: 'anjaneyasana.arms_overhead', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [150, 180], label: 'Arme über Kopf',
      cueBelow: 'Arme weiter nach oben strecken, neben den Ohren, in Verlängerung des Rumpfes.',
      cueAbove: 'Arme nicht zu weit nach hinten ziehen: Rippen weich, Arme in Linie mit dem Rumpf.',
      why: 'Die Arme verlängern die Wirbelsäule nach oben; der Brustkorb öffnet sich ohne Hohlkreuz.', weight: 2,
    },
    {
      id: 'anjaneyasana.front_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.12], label: 'Knie über Fuß (seitlich)',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Vorderes Knie über den zweiten Zeh ausrichten, nicht nach innen oder außen sinken lassen.',
      why: 'Das Knie bleibt in Richtung der Zehen, damit das Gelenk nicht verdreht wird.', weight: 3,
    },
    {
      id: 'anjaneyasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: beide Hüftknochen gleich hoch und nach vorn gerichtet.',
      why: 'Das Becken blickt gerade nach vorn und sinkt gleichmäßig ab.', weight: 2,
    },
    {
      id: 'anjaneyasana.trunk_vertical_front', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 6], label: 'Rumpf seitlich',
      cueBelow: 'Rumpf mittig halten.',
      cueAbove: 'Rumpf mittig über das Becken ziehen: nicht zur Seite kippen.',
      why: 'Der Rumpf steigt mittig aus dem Becken.', weight: 2,
    },
  ],

  // --------------------------------------------------- Virabhadrasana III (lead = STANDBEIN, trail = angehobenes Bein)
  virabhadrasana_3: [
    {
      id: 'virabhadrasana_3.standing_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Standbein',
      cueBelow: 'Standbein strecken: Oberschenkel anspannen, Kniescheibe hochziehen.',
      cueAbove: 'Standknie nicht überstrecken: Kniescheibe hoch, Oberschenkel leicht zurück.',
      why: 'Das Standbein ist fest und gestreckt – es trägt Rumpf, Arme und das angehobene Bein.', weight: 3,
    },
    {
      id: 'virabhadrasana_3.standing_leg_vertical', view: 'side', measure: tilt('lead_hip', 'lead_ankle', 'vertical'),
      range: [0, 12], label: 'Standbein senkrecht',
      cueBelow: 'Standbein senkrecht halten.',
      cueAbove: 'Standbein senkrecht aufrichten: Hüfte über den Standfuß, nicht vor oder hinter den Fuß driften.',
      why: 'Ein senkrechtes Standbein ist die Achse, um die sich Rumpf und angehobenes Bein ausbalancieren.', weight: 3,
    },
    {
      id: 'virabhadrasana_3.lifted_leg_straight', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Angehobenes Bein',
      cueBelow: 'Angehobenes Knie strecken: Oberschenkel aktiv, Ferse nach hinten drücken.',
      cueAbove: 'Angehobenes Knie nicht überstrecken.',
      why: 'Das angehobene Bein bleibt aktiv und lang bis in die Ferse, es ist kein bloßes Gewicht.', weight: 2,
    },
    {
      id: 'virabhadrasana_3.lifted_leg_horizontal', view: 'side', measure: tilt('trail_hip', 'trail_ankle', 'horizontal'),
      range: [0, 15], label: 'Angehobenes Bein waagrecht',
      cueBelow: 'Angehobenes Bein waagrecht halten.',
      cueAbove: 'Angehobenes Bein höher heben, bis es parallel zum Boden ist.',
      why: 'Das waagrechte Bein bildet mit dem Standbein einen rechten Winkel und gibt der Haltung ihre Form.', weight: 3,
    },
    {
      id: 'virabhadrasana_3.trunk_horizontal', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 15], margin: 10, label: 'Rumpf waagrecht',
      cueBelow: 'Rumpf waagrecht halten.',
      cueAbove: 'Rumpf weiter nach vorn senken, bis er parallel zum Boden ist; Brustbein nach vorn ziehen.',
      why: 'Rumpf und angehobenes Bein bilden eine waagrechte Linie über dem Standbein.', weight: 3,
    },
    {
      id: 'virabhadrasana_3.arms_in_line', view: 'side', measure: angle('mid_hip', 'mid_shoulder', 'mid_wrist'),
      range: [155, 180], margin: 10, label: 'Arme in Linie',
      cueBelow: 'Arme neben den Ohren in Verlängerung des Rumpfes nach vorn strecken.',
      cueAbove: 'Arme in Linie mit dem Rumpf halten.',
      why: 'Arme, Rumpf und angehobenes Bein bilden eine einzige lange Linie, die in entgegengesetzte Richtungen zieht.', weight: 2,
    },
    {
      id: 'virabhadrasana_3.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Becken ausgleichen: die Hüfte des angehobenen Beins nach unten drehen, beide Hüftknochen gleich hoch.',
      why: 'Ein waagrechtes Becken zeigt, dass das angehobene Bein aus der Hüfte nach hinten streckt und nicht nach außen kippt.', weight: 3,
    },
    {
      id: 'virabhadrasana_3.standing_knee_tracking', view: 'front', measure: offset('lead_knee', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.12], label: 'Standknie',
      cueBelow: 'Knie über die Mitte des Fußes halten.',
      cueAbove: 'Standknie über den zweiten Zeh ausrichten, Kniescheibe hoch.',
      why: 'Das Standknie folgt der Fußrichtung und wird nicht verdreht.', weight: 2,
    },
  ],

  // --------------------------------------------------- Janu Sirsasana (lead = GESTRECKTES Bein, trail = gebeugtes Bein)
  janu_sirsasana: [
    {
      id: 'janu_sirsasana.straight_leg', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie strecken: Oberschenkel in den Boden drücken, Ferse vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein ist fest und aktiv, über ihm streckt sich der Rumpf nach vorn.', weight: 3,
    },
    {
      id: 'janu_sirsasana.straight_leg_on_floor', view: 'side', measure: tilt('lead_hip', 'lead_ankle', 'horizontal'),
      range: [0, 12], label: 'Bein am Boden',
      cueBelow: 'Bein am Boden lassen.',
      cueAbove: 'Gestrecktes Bein auf den Boden drücken, Knie nicht anheben.',
      why: 'Das gestreckte Bein ruht am Boden und gibt dem Rumpf eine feste Linie für die Vorbeuge.', weight: 2,
    },
    {
      id: 'janu_sirsasana.hip_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'lead_ankle'),
      range: [0, 60], margin: 20, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Aus der Hüfte weiter über das gestreckte Bein nach vorn beugen: Bauch zuerst, Brustbein zum Fuß, nicht den Rücken runden.',
      why: 'Der Rumpf beugt aus der Hüfte über das gestreckte Bein; Bauch und Brustkorb folgen nacheinander.', weight: 3,
    },
    {
      id: 'janu_sirsasana.bent_knee', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [25, 110], margin: 15, label: 'Gebeugtes Knie',
      cueBelow: 'Ferse des gebeugten Beins näher an die Leiste ziehen.',
      cueAbove: 'Gebeugtes Knie weiter beugen: Ferse zur Leiste ziehen, Knie zur Seite sinken lassen.',
      why: 'Die Ferse des gebeugten Beins liegt nahe der Leiste, das Knie öffnet sich zur Seite.', weight: 2,
    },
    {
      id: 'janu_sirsasana.hands_reach_foot', view: 'side', measure: offset('mid_wrist', 'lead_ankle', 'x', undefined, true),
      range: [0, 0.6], margin: 0.2, label: 'Hände zum Fuß',
      cueBelow: 'Hände am Fuß halten.',
      cueAbove: 'Hände weiter zum Fuß strecken (oder Gurt benutzen), Arme lang.',
      why: 'Die Hände greifen den Fuß des gestreckten Beins und geben Widerstand für die Rumpfstreckung.', weight: 2,
    },
    {
      id: 'janu_sirsasana.neck_long', view: 'side', measure: angle('mid_ear', 'mid_shoulder', 'mid_hip'),
      range: [135, 180], margin: 15, label: 'Nacken',
      cueBelow: 'Nacken lang halten, Kopf nicht fallen lassen oder hochreißen.',
      cueAbove: 'Kopf in Verlängerung der Wirbelsäule.',
      why: 'Der Nacken bleibt in der Verlängerung der Wirbelsäule.', weight: 1,
    },
    {
      id: 'janu_sirsasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 8], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen.',
      why: 'Beide Sitzbeine bleiben gleich schwer am Boden, auch wenn ein Bein gebeugt ist.', weight: 2,
    },
    {
      id: 'janu_sirsasana.shoulders_level', view: 'front', measure: tilt('left_shoulder', 'right_shoulder', 'horizontal'),
      range: [0, 8], label: 'Schultern',
      cueBelow: 'Schultern waagrecht halten.',
      cueAbove: 'Schultern ausgleichen: beide gleich weit über das gestreckte Bein nach vorn bringen.',
      why: 'Der Rumpf faltet sich gerade über das gestreckte Bein, ohne zur Seite zu kippen.', weight: 1,
    },
  ],
};

export const IYENGAR: School = {
  id: 'iyengar',
  name: 'Iyengar',
  description:
    'Präzise, klassische Ausrichtung nach B.K.S. Iyengar: gestreckte Beine mit aktiven Oberschenkeln, ' +
    'senkrechte Rumpfachse, Linien durch Arme und Beine und exakte Winkel in den Gelenken.',
  status: 'Entwurf – fachlich zu prüfen durch Christof',
  rules,
};
