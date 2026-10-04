import type { Measure, Rule } from '../../core/types';

/*
 * Iyengar-Regelwerk, Ergänzung 2 (ENTWURF – fachlich zu prüfen).
 * Gleiche Konventionen wie iyengar.ts: Kameras relativ zur MATTE ('front' = kurze Mattenkante,
 * 'side' = lange Mattenkante), Winkel = Innenwinkel 0..180 (180 = gestreckt), tilt = Abweichung von
 * Senkrechter/Waagrechter, offset in Rumpflängen. In 'side' fallen mid_-Punkte auf die sichtbare Körperseite zurück.
 *
 * Lead/Trail bei Haltungen mit Seite (immer passend zur sideCue der Haltung):
 *  - triang_mukhaikapada_paschimottanasana (sideCue straightKnee): lead = das GESTRECKTE Bein (über das sich der
 *      Rumpf beugt); trail = das zurückgefaltete Bein (Fuß neben der Hüfte).
 *  - krounchasana (higherAnkle): lead = das ANGEHOBENE, gestreckte Bein (mit beiden Händen gehalten);
 *      trail = das am Boden zurückgefaltete Bein (Virasana-Bein).
 *  - marichyasana_1 (straightKnee): lead = das GESTRECKTE Bein am Boden; trail = das aufgestellte Bein (Fuß flach, Schienbein senkrecht).
 *  - marichyasana_3 (bentKnee): lead = das stärker GEBEUGTE, aufgestellte Bein (Drehung zu dieser Seite hin);
 *      trail = das gestreckte Bein am Boden.
 *  - camatkarasana (higherAnkle): lead = das ANGEHOBENE Bein, das sich nach hinten über den Körper wölbt;
 *      trail = Stützseite (Standbein UND Stützarm derselben Körperseite).
 *  - ardha_matsyendrasana (keine sideCue): lead = die im Schritt genannte Seite = Drehseite = das AUFGESTELLTE Bein
 *      (Fuß steht neben dem gegenüberliegenden Oberschenkel, Rumpf dreht zu diesem Knie); trail = das am Boden gefaltete Bein.
 *  - Alle anderen Haltungen sind nicht seitenbezogen und verwenden nur left_/right_/mid_.
 *
 * Kamerahinweise: Fast alle Regeln sind Seitenansicht ('side'): Beinstreckung, Rumpflinie und Bodenkontakt liegen in der
 * Sagittalebene. 'front' wird nur für die Beckenhöhe im Sitz verwendet (beide Sitzbeine gleich schwer).
 *
 * NACH DER PRÜFUNG GESTRICHEN (Falschalarm-Risiko, doppelte Aussage oder Sicherheit):
 *   Zweitregeln zum Bein am Boden (Triang Mukhaikapada, Marichyasana I/III: das gestreckte Knie zeigt die Abweichung schon),
 *   Hand-zum-Fuß (Flexibilitätstest), Rumpf-tief-Dopplung (Kurmasana), verdecktes gefaltetes Knie (Krounchasana, Balasana),
 *   Kopf heben (Bitilasana: Nackenüberstreckung), Hände an den Fersen (Ustrasana: Hände an Hüfte/Kreuz/Blöcken sind gültig),
 *   Hände zu den Füßen (Kapotasana: kein automatischer Cue tiefer in die Rückbeuge; die Tiefenregel bremst nur),
 *   Standbein Camatkarasana, Beine in Makarasana (Ruhehaltung), angehobenes Knie Ardha Matsyendrasana.
 *
 * BEWUSST NICHT KODIERT (mit 33 Punkten aus einer 2D-Kamera nicht messbar) – Input für die fachliche Prüfung:
 *
 * Kurmasana: Arme unter den Oberschenkeln und Schulter-Bodenkontakt (Verdeckung); Fersen zusammen, Fußstellung;
 *   Wirbelsäulenrundung; Kniestreckung nur grob, da die Kniegelenke unter den Armen liegen; Kopf/Kinn am Boden.
 * Triang Mukhaikapada Paschimottanasana: Sitzbeine gleich schwer (nur grob über die Beckenlinie in 'front'); Fuß des gefalteten
 *   Beins direkt neben der Hüfte und Zehen nach hinten; Knie der beiden Beine zusammen; Rundrücken vs. lange Wirbelsäule;
 *   Bauch-zu-Oberschenkel-Reihenfolge; Fußzug des gestreckten Beins; Gurt.
 * Krounchasana: Wirbelsäulenstreckung (konkav) und Beckenkippung; Sitzbeine beide am Boden; Fuß des gefalteten Beins
 *   (Zehen nach hinten, Fußrücken am Boden); Hände an der Fußsohle; Kinn-Knie-Abstand; Beinrotation.
 * Balasana: Gewicht auf Sitzbeinen vs. Fersen; Wirbelsäulenlänge; Arme (Verdeckung, gestreckt oder am Körper);
 *   Stirn am Boden; Schultern entspannt; Knieabstand; Fußrücken am Boden.
 * Uttana Shishosana: Wirbelsäulen-Konkavität und Lendenbogen; Ellbogen-/Schulterbreite (nur 'front'); Stirn/Kinn am Boden;
 *   Schulterblätter; Armrotation; Handflächen gleichmäßig; Hüfte exakt über den Knien (nur grob als Oberschenkel-Senkrechte).
 * Marichyasana I: Bindung (verdeckt); Schulter des Bindearms nach vorn über das Knie; Rundrücken; Rumpfrotation;
 *   Fersen-Sitzbein-Abstand und Fuß des aufgestellten Beins flach (Heel unzuverlässig); Sitzbein des aufgestellten Beins am Boden.
 * Marjaryasana: Krümmung der Wirbelsäule (Rundung der Brust- und Lendenwirbelsäule) – mit Schulter, Hüfte, Ohr nicht messbar;
 *   Steißbein-/Becken-Einrollen; Schulterblätter auseinander; Zehenstellung; Handgelenke; Kopf-Nacken-Entspannung (Kinn zur Brust).
 * Bitilasana: Lendenbogen verteilt vs. Knick; Brustbein-Hebung und Schulterblätter zusammen; Steißbein hoch; Zehenstellung;
 *   Handgelenke; Hals nicht überstreckt (nur grob als Kopfhebung).
 * Ustrasana: Verteilung des Bogens (Lenden vs. Brustwirbelsäule) und Hals; Gewicht auf Schienbeinen und Fußrücken;
 *   Beckengürtel nach vorn (nur grob als Oberschenkel-Senkrechte); Schulterblatt-Aktion; Handdruck auf Fersen;
 *   Knieabstand; Fußrücken-Ausrichtung; Kopfhaltung.
 * Urdhva Dhanurasana: Handabstand und Fingerrichtung; Schulter-Außenrotation und Schulterblattaktion; Verteilung des
 *   Bogens in der Wirbelsäule (Lendenknick); Fuß- und Knieparallelität; Oberschenkelrotation; Fersengewicht; Kopf hängt/Nacken;
 *   Beinstreckung wegen Verdeckung nicht kodiert.
 * Matsyasana: Brustkorb-Hebung und Scheitel am Boden (Kopfgewicht auf dem Scheitel, nicht auf dem Nacken); Halswirbelsäule;
 *   Armstellung (Hände an den Füßen oder unter dem Gesäß); Beinstellung (Padmasana ist nicht vom gestreckten Bein unterscheidbar,
 *   daher Beinstreckung nicht kodiert); Schulterblätter.
 * Purvottanasana: Handstellung (Finger zu den Füßen) und Handgelenke; Fußflächen flach am Boden (Heel/Foot-Index unzuverlässig);
 *   Kopf/Nacken (Kopf weich zurück vs. Kinn zur Brust); Brustkorbbreite; Gesäßspannung; Oberschenkelrotation.
 * Kapotasana: praktisch alles jenseits von Oberschenkel-Senkrechte und grober Bogentiefe: Verteilung des Bogens, Kopf-Fuß-Kontakt,
 *   Ellbogen- und Handposition, Schulterblatt-Aktion, Knieabstand (Überlagerung von Kopf, Armen und Beinen).
 * Camatkarasana: Rumpfdrehung nach oben (Brustbein zur Decke) und Rippenöffnung; Schultern über Stützhand (Tiefe);
 *   Fuß des angehobenen Beins (Lage auf dem Boden, Zehenrichtung); Stützhandgelenk; Blick; Armbogen des freien Arms.
 * Bhujangasana: Schambein und Oberschenkel am Boden (nur grob über Beinlinie); Schulterblätter in den Rücken und Brustbein vor;
 *   Ellbogen eng; Nackenbogen/Kehle; Verteilung des Bogens in der Wirbelsäule (Lenden- vs. Brustwirbelsäule); Zehen/Fußrücken;
 *   Gesäß hart oder weich; Armstreckung vs. Beugung (Hände je nach Stufe).
 * Salamba Bhujangasana: Ellbogen exakt unter den Schultern und parallele Unterarme (nur grob als Oberarm-Senkrechte);
 *   Schulterblatt-Aktion; Verteilung des Bogens; Nacken; Schambein am Boden; Gesäß.
 * Salabhasana: Hebung des Brustkorbs vs. Hebung der Beine (Verteilung) – nur Summe grob; Beinschluss und Innenrotation;
 *   Arme gestreckt und parallel (Verdeckung); Becken-/Schambeinkontakt; Kopfstellung (Nacken lang); Gesäß; Beinhöhe individuell.
 * Dhanurasana: Griff an den Knöcheln (Hände/Füße überlagern sich); Knieabstand (hüftbreit); Hebung von Oberschenkeln und
 *   Brust im Verhältnis; Schulterblatt-Aktion; Verteilung des Bogens; Kopf/Nacken; Bauchatmung/Gewicht am Bauch.
 * Makarasana: Kopfablage (Stirn auf Händen) und Ellbogenabstand; Beinabstand und Fußrotation (nach außen); Becken entspannt;
 *   Schultern; Atmung. Im Grunde keine Ausrichtung zu bewerten – bewusst nur drei grobe Regeln.
 * Ardha Matsyendrasana: Drehung des Rumpfes (Brustbein zur Seite) und der Bauchdrehung; Fuß des aufgestellten Beins neben dem
 *   Oberschenkel (Verdeckung); Arm um das Knie / Bindung; Höhe des Ellbogens und Schulterstellung; Kopfdrehung und Blickrichtung;
 *   Sitzbein des aufgestellten Beins am Boden (nur grob Beckenlinie in 'front'); Fersen-Gesäß-Abstand des gefalteten Beins; welche
 *   Seite sich dreht (reine 2D-Kamera).
 * Marichyasana III: Drehung (Brustbein zum aufgestellten Knie) und Bindung; Achsel über dem Knie; gestrecktes Bein aktiv
 *   (Fuß, Ferse); Fußstellung des aufgestellten Beins (Ferse, Zehen); Rumpfstreckung vor der Drehung.
 */

const angle = (a: string, b: string, c: string): Measure => ({ kind: 'angle', a, b, c });
const tilt = (from: string, to: string, axis: 'vertical' | 'horizontal'): Measure => ({ kind: 'tilt', from, to, axis });
const offset = (a: string, b: string, axis: 'x' | 'y', toward?: string, abs?: boolean): Measure => ({
  kind: 'offset', a, b, axis, ...(toward ? { toward } : {}), ...(abs ? { abs: true } : {}),
});

/** Beide Arme gestreckt (links/rechts getrennt, da die abgewandte Seite von der Seite oft verdeckt ist). */
function armsStraight(
  poseId: string, range: [number, number], weight: 1 | 2 | 3, cueBelow: string, cueAbove: string, why: string,
): Rule[] {
  return (['left', 'right'] as const).map((s) => ({
    id: `${poseId}.${s}_arm_straight`, view: 'side' as const,
    measure: angle(`${s}_shoulder`, `${s}_elbow`, `${s}_wrist`),
    range, label: s === 'left' ? 'Linker Arm' : 'Rechter Arm', cueBelow, cueAbove, why, weight,
  }));
}

const rules: Record<string, Rule[]> = {
  // ---------------------------------------------------------------- Kurmasana
  kurmasana: [
    {
      id: 'kurmasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [150, 180], margin: 12, label: 'Beine',
      cueBelow: 'Beine strecken: Fersen vorschieben, Oberschenkel in die Arme drücken.',
      cueAbove: 'Knie nicht überstrecken, Kniescheiben hoch.',
      why: 'Die gestreckten Beine ruhen auf den Oberarmen; Hüfte und Rumpf sinken dazwischen ab.', weight: 1,
    },
    {
      id: 'kurmasana.hip_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_knee'),
      range: [0, 60], margin: 20, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Aus der Hüfte tiefer nach vorn beugen: Brustbein nach vorn zwischen die Beine schieben.',
      why: 'Der Rumpf faltet sich aus den Hüftgelenken zwischen den Beinen nach vorn.', weight: 2,
    },
  ],

  // ----------------------- Triang Mukhaikapada Paschimottanasana (lead = GESTRECKTES Bein, trail = gefaltetes Bein)
  triang_mukhaikapada_paschimottanasana: [
    {
      id: 'triang_mukhaikapada_paschimottanasana.straight_leg', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie strecken: Oberschenkel in den Boden drücken, Ferse vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein ist fest und aktiv, über ihm streckt sich der Rumpf nach vorn.', weight: 3,
    },
    {
      id: 'triang_mukhaikapada_paschimottanasana.hip_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'lead_ankle'),
      range: [0, 80], margin: 20, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Aus der Hüfte weiter über das gestreckte Bein nach vorn beugen: Bauch zuerst, Brustbein zum Fuß, nicht den Rücken runden.',
      why: 'Der Rumpf beugt aus der Hüfte über das gestreckte Bein; Bauch und Brustkorb folgen nacheinander.', weight: 3,
    },
    {
      id: 'triang_mukhaikapada_paschimottanasana.folded_knee', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [10, 60], margin: 15, label: 'Gefaltetes Bein',
      cueBelow: 'Gefaltetes Bein nicht mehr zusammenziehen.',
      cueAbove: 'Unterschenkel des gebeugten Beins nach hinten falten: Ferse neben die Hüfte, Fußrücken auf den Boden.',
      why: 'Das Knie ist voll gebeugt, der Fuß liegt neben der Hüfte – so bleibt das Becken mittig über dem Boden.', weight: 1,
    },
    {
      id: 'triang_mukhaikapada_paschimottanasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken: Gesäß auf der Seite des gefalteten Beins nicht anheben.',
      why: 'Beide Sitzbeine bleiben gleich schwer am Boden – das ist das Kennzeichen dieser Haltung.', weight: 2,
    },
  ],

  // -------------------------------------- Krounchasana (lead = ANGEHOBENES Bein, trail = gefaltetes Bein)
  krounchasana: [
    {
      id: 'krounchasana.lifted_leg_straight', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [160, 180], margin: 10, label: 'Angehobenes Bein',
      cueBelow: 'Angehobenes Knie strecken: Ferse nach oben schieben, Fuß in die Hände drücken.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein hebt sich wie der Schnabel des Reihers – nur so kann der Rumpf lang bleiben.', weight: 3,
    },
    {
      id: 'krounchasana.leg_to_trunk', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'lead_ankle'),
      range: [10, 75], margin: 15, label: 'Bein zum Rumpf',
      cueBelow: 'Bein nicht noch näher zum Gesicht ziehen: Rumpf lang halten.',
      cueAbove: 'Bein weiter zum Rumpf heranziehen, Brustbein dem Bein entgegen.',
      why: 'Bein und Rumpf kommen einander entgegen, ohne dass der Rücken rund wird.', weight: 2,
    },
    {
      id: 'krounchasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 30], margin: 12, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten, Brustbein heben, nicht in das Bein hineinsinken.',
      why: 'Die Wirbelsäule bleibt lang und aufrecht, damit das Bein ohne Rundrücken nach oben kommt.', weight: 2,
    },
  ],

  // ---------------------------------------------------------------- Balasana
  balasana: [
    {
      id: 'balasana.hips_to_heels', view: 'side', measure: offset('mid_hip', 'mid_ankle', 'x', undefined, true),
      range: [0, 0.4], margin: 0.15, label: 'Gesäß zu den Fersen',
      cueBelow: 'Gesäß auf den Fersen ablegen.',
      cueAbove: 'Gesäß zurück zu den Fersen schieben.',
      why: 'Das Gesäß sinkt zu den Fersen; der Rücken wird dadurch lang und entspannt.', weight: 2,
    },
    {
      id: 'balasana.trunk_low', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 45], margin: 15, label: 'Rumpf abgelegt',
      cueBelow: 'Rumpf ablegen.',
      cueAbove: 'Rumpf über die Oberschenkel sinken lassen, Stirn zum Boden.',
      why: 'In der Kindhaltung ruht der Rumpf schwer auf den Oberschenkeln, der Atem fließt in den Rücken.', weight: 1,
    },
  ],

  // ------------------------------------------------------- Uttana Shishosana
  uttana_shishosana: [
    {
      id: 'uttana_shishosana.thighs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'vertical'),
      range: [0, 18], margin: 10, label: 'Oberschenkel senkrecht',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Hüfte über die Knie bringen: Oberschenkel senkrecht, Gesäß hoch.',
      why: 'Die Hüfte bleibt über den Knien, so wird der Rücken lang und die Brust sinkt zum Boden.', weight: 3,
    },
    ...armsStraight(
      'uttana_shishosana', [160, 180], 2,
      'Arm ganz strecken, Hände weit nach vorn.',
      'Ellbogen nicht überstrecken, Oberarme aktiv.',
      'Die langen Arme ziehen die Schultern vom Becken weg und strecken die Wirbelsäule.',
    ),
    {
      id: 'uttana_shishosana.chest_low', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [10, 55], margin: 12, label: 'Brust tief',
      cueBelow: 'Hüfte nicht zu tief absinken lassen: Gesäß über die Knie.',
      cueAbove: 'Brustbein zum Boden sinken lassen, Schlüsselbeine breit.',
      why: 'Die Brust sinkt zwischen den langen Armen zum Boden, während die Hüfte oben bleibt.', weight: 2,
    },
  ],

  // ------------------------------------- Marichyasana I (lead = GESTRECKTES Bein, trail = aufgestelltes Bein)
  marichyasana_1: [
    {
      id: 'marichyasana_1.straight_leg', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie strecken: Oberschenkel in den Boden drücken, Ferse vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein ist fest und aktiv, über ihm streckt sich der Rumpf nach vorn.', weight: 3,
    },
    {
      id: 'marichyasana_1.bent_knee', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [20, 75], margin: 15, label: 'Aufgestelltes Knie',
      cueBelow: 'Ferse etwas vom Gesäß wegschieben, Fuß flach lassen.',
      cueAbove: 'Ferse näher ans Gesäß ziehen, Fuß flach auf den Boden.',
      why: 'Die Ferse des aufgestellten Beins steht nahe am Gesäß, der Oberschenkel stützt den Rumpf.', weight: 2,
    },
    {
      id: 'marichyasana_1.shin_vertical', view: 'side', measure: tilt('trail_knee', 'trail_ankle', 'vertical'),
      range: [0, 25], margin: 10, label: 'Schienbein senkrecht',
      cueBelow: 'Schienbein senkrecht halten.',
      cueAbove: 'Schienbein senkrecht stellen: Fuß flach, Ferse unter das Knie.',
      why: 'Der Fuß steht flach unter dem Knie; so kann der Oberschenkel die Rumpfbeuge begleiten.', weight: 1,
    },
    {
      id: 'marichyasana_1.hip_fold', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'lead_ankle'),
      range: [0, 80], margin: 20, label: 'Vorbeuge',
      cueBelow: 'Rumpf lang halten.',
      cueAbove: 'Aus der Hüfte weiter über das gestreckte Bein nach vorn beugen: Bauch zuerst, Brustbein zum Fuß, nicht den Rücken runden.',
      why: 'Der Rumpf beugt aus der Hüfte über das gestreckte Bein; Bauch und Brustkorb folgen nacheinander.', weight: 3,
    },
    {
      id: 'marichyasana_1.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen.',
      why: 'Beide Sitzbeine bleiben gleich schwer am Boden, auch wenn ein Knie aufgestellt ist.', weight: 2,
    },
  ],

  // -------------------------------------------------------------- Marjaryasana
  marjaryasana: [
    {
      id: 'marjaryasana.thighs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'vertical'),
      range: [0, 15], margin: 10, label: 'Oberschenkel senkrecht',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Hüfte genau über die Knie bringen.',
      why: 'Der Vierfüßlerstand ist die Basis: Hüfte über den Knien, Schultern über den Händen.', weight: 3,
    },
    {
      id: 'marjaryasana.arms_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 15], margin: 10, label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Schultern genau über die Handgelenke bringen.',
      why: 'Die senkrechten Arme tragen den Rumpf, ohne dass der Schultergürtel einsinkt.', weight: 3,
    },
    ...armsStraight(
      'marjaryasana', [165, 180], 2,
      'Arme ganz strecken, Hände fest in den Boden.',
      'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      'Fest in den Boden gedrückte, gestreckte Arme machen die Rundung des Rückens frei.',
    ),
  ],

  // ---------------------------------------------------------------- Bitilasana
  bitilasana: [
    {
      id: 'bitilasana.thighs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'vertical'),
      range: [0, 15], margin: 10, label: 'Oberschenkel senkrecht',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Hüfte genau über die Knie bringen.',
      why: 'Der Vierfüßlerstand ist die Basis: Hüfte über den Knien, Schultern über den Händen.', weight: 3,
    },
    {
      id: 'bitilasana.arms_vertical', view: 'side', measure: tilt('mid_shoulder', 'mid_wrist', 'vertical'),
      range: [0, 15], margin: 10, label: 'Arme senkrecht',
      cueBelow: 'Arme senkrecht halten.',
      cueAbove: 'Schultern genau über die Handgelenke bringen.',
      why: 'Die senkrechten Arme tragen den Rumpf, ohne dass der Schultergürtel einsinkt.', weight: 3,
    },
    ...armsStraight(
      'bitilasana', [165, 180], 2,
      'Arme ganz strecken, Hände fest in den Boden.',
      'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      'Fest in den Boden gedrückte, gestreckte Arme tragen die Brust, die sich nach vorn hebt.',
    ),
  ],

  // ----------------------------------------------------------------- Ustrasana
  ustrasana: [
    {
      id: 'ustrasana.thighs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'vertical'),
      range: [0, 20], margin: 10, label: 'Oberschenkel senkrecht',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Hüfte nach vorn über die Knie schieben: Oberschenkel senkrecht, Gesäß fest.',
      why: 'Die Oberschenkel stehen senkrecht, damit der Bogen aus dem ganzen Rücken kommt und nicht nur aus dem unteren.', weight: 3,
    },
    ...armsStraight(
      'ustrasana', [160, 180], 2,
      'Arme ganz strecken, Handflächen auf die Fersen.',
      'Ellbogen nicht überstrecken, Arme aktiv.',
      'Die langen, aktiven Arme heben den Brustkorb nach oben und hinten.',
    ),
    {
      id: 'ustrasana.hip_extension', view: 'side', measure: angle('mid_knee', 'mid_hip', 'mid_shoulder'),
      range: [130, 175], margin: 12, label: 'Rückbeuge',
      cueBelow: 'Rückbeuge nicht übertreiben: Brustbein heben, Hüfte vorschieben.',
      cueAbove: 'Brustbein heben und nach hinten öffnen, Hüfte nach vorn schieben.',
      why: 'Die Hüfte schiebt nach vorn, der Brustkorb folgt in einem großen Bogen nach hinten.', weight: 2,
    },
  ],

  // -------------------------------------------------------- Urdhva Dhanurasana
  urdhva_dhanurasana: [
    ...armsStraight(
      'urdhva_dhanurasana', [160, 180], 3,
      'Arme ganz strecken, Hände fest in den Boden.',
      'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      'Die gestreckten Arme tragen den Körper; ohne sie bleibt der Rücken im Bogen eingeklemmt.',
    ),
    {
      id: 'urdhva_dhanurasana.hips_high', view: 'side', measure: offset('mid_hip', 'mid_shoulder', 'y', 'up'),
      range: [0.25, 1.5], margin: 0.12, label: 'Becken hoch',
      cueBelow: 'Becken höher heben: Oberschenkel und Gesäß aktiv, Fersen in den Boden.',
      cueAbove: 'Brust weiter nach vorn über die Hände ziehen.',
      why: 'Das Becken ist der höchste Punkt, der Bogen verteilt sich auf den ganzen Rücken.', weight: 3,
    },
  ],

  // ----------------------------------------------------------------- Matsyasana
  matsyasana: [
    {
      id: 'matsyasana.thighs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'horizontal'),
      range: [0, 20], margin: 10, label: 'Oberschenkel am Boden',
      cueBelow: 'Oberschenkel am Boden lassen.',
      cueAbove: 'Oberschenkel zum Boden sinken lassen, Knie nicht anheben.',
      why: 'Die Oberschenkel bleiben ruhig am Boden und geben dem angehobenen Brustkorb eine feste Basis.', weight: 2,
    },
    {
      id: 'matsyasana.trunk_lying', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 40], margin: 12, label: 'Rumpf liegend',
      cueBelow: 'Rumpf liegend halten.',
      cueAbove: 'Rumpf ablegen: Gewicht auf Ellbogen und Scheitel, nicht aufsetzen.',
      why: 'Der Fisch ist eine liegende Rückbeuge, der Brustkorb hebt sich über den Armen.', weight: 2,
    },
  ],

  // -------------------------------------------------------------- Purvottanasana
  purvottanasana: [
    ...armsStraight(
      'purvottanasana', [165, 180], 3,
      'Arme ganz strecken, Hände fest in den Boden.',
      'Ellbogen nicht überstrecken, Oberarmmuskeln aktiv.',
      'Die gestreckten Arme tragen das Gewicht, so kann die Brust sich öffnen.',
    ),
    {
      id: 'purvottanasana.shoulders_over_wrists', view: 'side', measure: offset('mid_shoulder', 'mid_wrist', 'x', undefined, true),
      range: [0, 0.25], margin: 0.1, label: 'Schultern über Händen',
      cueBelow: 'Schultern über den Handgelenken halten.',
      cueAbove: 'Hände näher an die Hüfte setzen, Schultern über die Handgelenke bringen.',
      why: 'Die Hände stehen unter den Schultern, damit die Arme senkrecht tragen.', weight: 2,
    },
    {
      id: 'purvottanasana.body_line', view: 'side', measure: angle('mid_shoulder', 'mid_hip', 'mid_ankle'),
      range: [160, 180], margin: 10, label: 'Körperlinie',
      cueBelow: 'Becken höher heben: Schultern, Hüfte und Fersen in eine Linie.',
      cueAbove: 'Becken nicht überstrecken, Gesäß fest, Linie gerade halten.',
      why: 'Der Körper bildet eine lange, gerade schräge Linie von den Schultern bis zu den Füßen.', weight: 3,
    },
    {
      id: 'purvottanasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen, Fersen in den Boden.',
      cueAbove: 'Knie nicht überstrecken.',
      why: 'Fest gestreckte Beine halten das Becken oben und entlasten Handgelenke und Schultern.', weight: 2,
    },
  ],

  // ------------------------------------------------------------------ Kapotasana
  kapotasana: [
    {
      id: 'kapotasana.thighs_vertical', view: 'side', measure: tilt('mid_hip', 'mid_knee', 'vertical'),
      range: [0, 25], margin: 10, label: 'Oberschenkel senkrecht',
      cueBelow: 'Oberschenkel senkrecht halten.',
      cueAbove: 'Hüfte nach vorn über die Knie schieben, bevor der Rücken sich zurückbeugt.',
      why: 'Die Hüfte bleibt vorn, so verteilt sich der tiefe Bogen auf den ganzen Rücken.', weight: 3,
    },
    {
      id: 'kapotasana.deep_backbend', view: 'side', measure: angle('mid_knee', 'mid_hip', 'mid_shoulder'),
      range: [70, 175], margin: 15, label: 'Tiefe Rückbeuge',
      cueBelow: 'Nicht tiefer zurück: Brustbein heben, Hüfte vorn halten.',
      cueAbove: 'Brustbein heben, Hüfte vorn halten: die Rückbeuge langsam und ohne Druck aufbauen.',
      why: 'Die Rückbeuge verteilt sich auf den ganzen Rücken; die Regel bremst nur zu tiefes Zurückfallen und treibt niemanden tiefer.', weight: 1,
    },
  ],

  // ------------------------------------- Camatkarasana (lead = ANGEHOBENES Bein, trail = Stützseite)
  camatkarasana: [
    {
      id: 'camatkarasana.support_arm_straight', view: 'side', measure: angle('trail_shoulder', 'trail_elbow', 'trail_wrist'),
      range: [160, 180], margin: 10, label: 'Stützarm',
      cueBelow: 'Stützarm ganz strecken, Hand fest in den Boden.',
      cueAbove: 'Ellbogen des Stützarms nicht überstrecken.',
      why: 'Der gestreckte Stützarm trägt den Körper und lässt die Brust sich nach oben öffnen.', weight: 3,
    },
    {
      id: 'camatkarasana.hips_high', view: 'side', measure: offset('mid_hip', 'mid_wrist', 'y', 'up'),
      range: [0.3, 1.6], margin: 0.12, label: 'Becken hoch',
      cueBelow: 'Becken höher heben: Hüfte zur Decke.',
      cueAbove: 'Becken ruhig halten, Brust nach oben öffnen.',
      why: 'Das Becken ist der höchste Punkt; von dort wölbt sich der Körper wie ein Bogen.', weight: 2,
    },
  ],

  // ----------------------------------------------------------------- Bhujangasana
  bhujangasana: [
    {
      id: 'bhujangasana.legs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Beine am Boden',
      cueBelow: 'Beine am Boden lassen.',
      cueAbove: 'Beine und Oberschenkel in den Boden drücken, Knie nicht anheben.',
      why: 'Fest am Boden liegende Beine sind die Basis, von der sich der Brustkorb hebt.', weight: 3,
    },
    {
      id: 'bhujangasana.chest_lifted', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [25, 65], margin: 10, label: 'Brust gehoben',
      cueBelow: 'Brustbein heben: Brustkorb nach vorn und oben ziehen, Schultern zurück.',
      cueAbove: 'Brustkorb weiter nach vorn öffnen, Rumpf nicht zu steil aufrichten.',
      why: 'Die Brust hebt und öffnet sich, ohne dass der untere Rücken einknickt.', weight: 3,
    },
    ...armsStraight(
      'bhujangasana', [140, 180], 2,
      'Arme weiter strecken, Hände fest in den Boden.',
      'Ellbogen nicht überstrecken.',
      'Die Arme unterstützen die Hebung des Brustkorbs, ohne dass Schultern zu den Ohren steigen.',
    ),
  ],

  // ------------------------------------------------------------ Salamba Bhujangasana
  salamba_bhujangasana: [
    {
      id: 'salamba_bhujangasana.legs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Beine am Boden',
      cueBelow: 'Beine am Boden lassen.',
      cueAbove: 'Beine und Oberschenkel in den Boden drücken, Knie nicht anheben.',
      why: 'Fest am Boden liegende Beine sind die Basis, von der sich der Brustkorb hebt.', weight: 3,
    },
    {
      id: 'salamba_bhujangasana.chest_lifted', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [20, 55], margin: 10, label: 'Brust gehoben',
      cueBelow: 'Brustbein heben: Brustkorb nach vorn und oben ziehen, Schultern zurück.',
      cueAbove: 'Brustkorb weiter nach vorn öffnen, Rumpf nicht zu steil aufrichten.',
      why: 'Die Brust hebt und öffnet sich über den Unterarmen, ohne dass der untere Rücken einknickt.', weight: 3,
    },
    ...(['left', 'right'] as const).map((s): Rule => ({
      id: `salamba_bhujangasana.${s}_upper_arm_vertical`, view: 'side',
      measure: tilt(`${s}_shoulder`, `${s}_elbow`, 'vertical'),
      range: [0, 20], margin: 10, label: s === 'left' ? 'Linker Oberarm' : 'Rechter Oberarm',
      cueBelow: 'Oberarm senkrecht halten.',
      cueAbove: 'Ellbogen genau unter die Schulter setzen, Unterarme in den Boden.',
      why: 'Die Ellbogen stehen unter den Schultern, damit die Unterarme tragen und der Nacken lang bleibt.', weight: 2,
    })),
  ],

  // ------------------------------------------------------------------ Salabhasana
  salabhasana: [
    {
      id: 'salabhasana.legs_lifted', view: 'side', measure: offset('mid_ankle', 'mid_hip', 'y', 'up'),
      range: [0.1, 1.2], margin: 0.08, label: 'Beine gehoben',
      cueBelow: 'Beine vom Boden heben, Knie fest gestreckt.',
      cueAbove: 'Beine ruhig halten, Brust gleichmäßig mitheben.',
      why: 'Die gestreckten Beine heben sich aus dem Gesäß, ohne dass das Becken vom Boden abhebt.', weight: 3,
    },
    {
      id: 'salabhasana.legs_straight', view: 'side', measure: angle('mid_hip', 'mid_knee', 'mid_ankle'),
      range: [165, 180], margin: 10, label: 'Beine',
      cueBelow: 'Knie strecken: Oberschenkel hochziehen.',
      cueAbove: 'Knie nicht überstrecken.',
      why: 'Fest gestreckte Beine tragen die Hebung und entlasten den unteren Rücken.', weight: 2,
    },
    {
      id: 'salabhasana.chest_lifted', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [5, 45], margin: 10, label: 'Brust gehoben',
      cueBelow: 'Brustbein heben: Brustkorb nach vorn und oben ziehen.',
      cueAbove: 'Brust nicht zu steil aufrichten, Länge in der Wirbelsäule halten.',
      why: 'Brust und Beine heben sich gemeinsam; der Bogen verteilt sich auf den ganzen Rücken.', weight: 2,
    },
  ],

  // ------------------------------------------------------------------ Dhanurasana
  dhanurasana: [
    ...armsStraight(
      'dhanurasana', [160, 180], 3,
      'Arme ganz strecken, Füße in die Hände drücken.',
      'Ellbogen nicht überstrecken.',
      'Die gestreckten Arme sind die Bogensehne; die Füße ziehen sie, die Brust öffnet sich.',
    ),
    {
      id: 'dhanurasana.thighs_lifted', view: 'side', measure: offset('mid_knee', 'mid_hip', 'y', 'up'),
      range: [0.1, 1.2], margin: 0.1, label: 'Oberschenkel gehoben',
      cueBelow: 'Oberschenkel vom Boden heben: Füße kräftig nach oben in die Hände drücken.',
      cueAbove: 'Beine ruhig halten, Brust gleichmäßig mitheben.',
      why: 'Die Oberschenkel heben sich gleichzeitig mit der Brust – der Körper spannt sich wie ein Bogen.', weight: 2,
    },
    {
      id: 'dhanurasana.chest_lifted', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [15, 65], margin: 12, label: 'Brust gehoben',
      cueBelow: 'Brustbein heben: Brustkorb nach vorn und oben ziehen.',
      cueAbove: 'Brust nicht zu steil aufrichten, Länge in der Wirbelsäule halten.',
      why: 'Brust und Beine heben sich gemeinsam; der Bogen verteilt sich auf den ganzen Rücken.', weight: 2,
    },
  ],

  // ------------------------------------------------------------------- Makarasana
  makarasana: [
    {
      id: 'makarasana.trunk_flat', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'horizontal'),
      range: [0, 15], margin: 8, label: 'Rumpf flach',
      cueBelow: 'Rumpf flach halten.',
      cueAbove: 'Brust zum Boden sinken lassen, Schultern entspannen.',
      why: 'Der Rumpf ruht flach am Boden; so entspannt sich der ganze Rücken.', weight: 2,
    },
    {
      id: 'makarasana.legs_on_floor', view: 'side', measure: tilt('mid_hip', 'mid_ankle', 'horizontal'),
      range: [0, 15], margin: 8, label: 'Beine am Boden',
      cueBelow: 'Beine am Boden lassen.',
      cueAbove: 'Beine ganz am Boden ablegen und entspannen.',
      why: 'Die Beine liegen schwer und entspannt am Boden.', weight: 1,
    },
  ],

  // ----------------------------- Ardha Matsyendrasana (lead = Drehseite = AUFGESTELLTES Bein, trail = gefaltetes Bein)
  ardha_matsyendrasana: [
    {
      id: 'ardha_matsyendrasana.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 20], margin: 10, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, Wirbelsäule lang, nicht nach hinten sinken.',
      why: 'Erst wird die Wirbelsäule lang, dann dreht sich der Rumpf um die senkrechte Achse.', weight: 3,
    },
    {
      id: 'ardha_matsyendrasana.trunk_not_leaning', view: 'front', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 12], margin: 8, label: 'Rumpf mittig',
      cueBelow: 'Rumpf mittig halten.',
      cueAbove: 'Rumpf nicht zur Seite kippen: beide Sitzbeine gleichmäßig belasten, Wirbelsäule lang.',
      why: 'Eine senkrechte Wirbelsäule ermöglicht eine gleichmäßige Drehung.', weight: 2,
    },
    {
      id: 'ardha_matsyendrasana.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], margin: 6, label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen (Decke unter das Gesäß, wenn nötig).',
      why: 'Beide Sitzbeine bleiben am Boden, damit die Drehung aus der Wirbelsäule und nicht aus dem Becken kommt.', weight: 2,
    },
  ],

  // ------------------------------- Marichyasana III (lead = AUFGESTELLTES gebeugtes Bein, trail = gestrecktes Bein)
  marichyasana_3: [
    {
      id: 'marichyasana_3.straight_leg', view: 'side', measure: angle('trail_hip', 'trail_knee', 'trail_ankle'),
      range: [165, 180], label: 'Gestrecktes Bein',
      cueBelow: 'Gestrecktes Knie strecken: Oberschenkel in den Boden drücken, Ferse vorschieben.',
      cueAbove: 'Knie nicht überstrecken: Kniescheibe hoch.',
      why: 'Das gestreckte Bein bleibt fest am Boden und ist der Gegenpol der Drehung.', weight: 3,
    },
    {
      id: 'marichyasana_3.bent_knee', view: 'side', measure: angle('lead_hip', 'lead_knee', 'lead_ankle'),
      range: [15, 70], margin: 15, label: 'Aufgestelltes Knie',
      cueBelow: 'Ferse etwas vom Gesäß wegschieben, Fuß flach lassen.',
      cueAbove: 'Ferse näher ans Gesäß ziehen, Fuß flach auf den Boden.',
      why: 'Die Ferse des aufgestellten Beins steht nahe am Gesäß, der Oberschenkel stützt die Drehung.', weight: 2,
    },
    {
      id: 'marichyasana_3.trunk_upright', view: 'side', measure: tilt('mid_hip', 'mid_shoulder', 'vertical'),
      range: [0, 20], margin: 10, label: 'Rumpf aufrecht',
      cueBelow: 'Rumpf aufrecht halten.',
      cueAbove: 'Rumpf aufrichten: Brustbein heben, Wirbelsäule lang, nicht nach hinten sinken.',
      why: 'Erst wird die Wirbelsäule lang, dann dreht sich der Rumpf um die senkrechte Achse.', weight: 3,
    },
    {
      id: 'marichyasana_3.hips_level', view: 'front', measure: tilt('left_hip', 'right_hip', 'horizontal'),
      range: [0, 10], margin: 8, label: 'Becken',
      cueBelow: 'Becken waagrecht halten.',
      cueAbove: 'Beide Sitzbeine gleichmäßig in den Boden drücken, Becken ausgleichen.',
      why: 'Beide Sitzbeine bleiben am Boden, damit die Drehung aus der Wirbelsäule und nicht aus dem Becken kommt.', weight: 2,
    },
  ],
};

export const RULES_EXTRA_2: Record<string, Rule[]> = rules;
