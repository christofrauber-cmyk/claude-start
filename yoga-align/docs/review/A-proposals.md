# Reviewer A (fachliche Korrektheit, Iyengar) – Vorschläge

Gesamtbild: Die Regelsätze sind überwiegend fachlich tragfähig (Beinstreckung, Rumpfachse, Knie über Ferse, Umkehrhaltungen). Echte Fehler: eine vertauschte Cue-Richtung, mehrere Cues, die bei Durchhängen/Hochschieben die falsche Handlung lehren, ein Lead/Trail-Problem bei Parivrtta Trikonasana, doppelte Regeln (gleiche Messung, gleiche Cue) und einige Regeln, deren Cue nicht zur Zahl passt. Alles andere sind Feinschliffe.

---

## ardha_navasana

**A1** – change `ardha_navasana.trunk_lowered` (Cues vertauscht, lehrt die falsche Handlung)
- tilt(mid_hip->mid_shoulder, horizontal) [10,60]: unter 10 = Rumpf fast flach, über 60 = Rumpf zu aufrecht.
- cueBelow -> `Rumpf etwas anheben: Brustbein heben, Rücken lang.`
- cueAbove -> `Rumpf weiter zurücklehnen, aber den Rücken lang halten.`
- Grund: Aktuell steht bei zu aufrechtem Rumpf "Rumpf etwas aufrichten" und bei zu flachem "weiter hinunterlassen" – genau umgekehrt.

## parivrtta_trikonasana

**A2** – change Lead/Trail-Bedeutung (Seitenzuordnung widerspricht Iyengar-Benennung und allen anderen Standhaltungen)
- Aktuell: lead = Seite der UNTEREN Hand = HINTERES Bein, sideCue `lowerWrist`. Im Iyengar-Sprachgebrauch heißt "Parivrtta Trikonasana rechts" aber: rechtes Bein vorn (linke Hand außen am rechten Fuß). Ein Ablauf "Trikonasana rechts -> Parivrtta Trikonasana rechts" würde so das Standbein wechseln lassen.
- Neu: lead = VORDERES Bein, trail = hinteres. In types.ts/side.ts neuen SideCue `higherWrist` (= Seite der oberen Hand liegt auf der Gegenseite des Vorderbeins; praktisch: `score = (cue==='lowerWrist' ? l - r : r - l)/t` mit `part='wrist'`) und `sideCue: 'higherWrist'` für die Pose. Dann in allen Regeln lead_/trail_ tauschen: `front_leg_straight` -> lead_hip/lead_knee/lead_ankle, `back_leg_straight` -> trail_..., `arms_line_vertical` -> tilt(trail_wrist->lead_wrist, vertical), `arms_straight_line` -> angle(trail_wrist, mid_shoulder, lead_wrist).
- Falls der Code-Aufwand nicht gewünscht ist: stattdessen die Zuordnung im Posentext/Kommentar klar benennen ("rechts = rechte Hand unten") und Christof bestätigen lassen. Empfehlung: Umbau, denn eine Seite, die der Lehrer anders versteht, erzeugt falsche "Vorderes Bein"-Cues.

## parsvottanasana

**A3** – change `parsvottanasana.hips_level` weight 3 -> 2
- Gemessen wird nur die Höhendifferenz der Hüftpunkte, nicht die Beckendrehung ("quadratisch"). Bei geraden Beinen in der Vorbeuge sind die Hüften fast immer gleich hoch -> Regel kann das eigentliche Iyengar-Ziel (hintere Hüfte vor) kaum erfassen und darf nicht als Weight-3 Sicherheit vortäuschen.
- cueAbove bleibt; cueBelow ersetzen durch `Hüften gleich hoch halten.` (cueBelow ist ohnehin nicht erreichbar).

## malasana

**A4** – delete `malasana.hip_depth`
- Doppelt zu `knee_angle` (tiefe Hocke = kleiner Kniewinkel); der Cue "etwas höher kommen: Becken nicht auf den Fersen ablegen" ist zudem nicht erreichbar (Wert > 1 Rumpflänge unmöglich) und widerspricht Iyengar (in Malasana sinkt man so tief wie möglich, Fersen am Boden).

**A5** – change `malasana.knee_angle` cueBelow
- Neu: `Fersen am Boden lassen und den Rücken lang halten – nicht tiefer zwingen.` (statt "Gesäß nicht zu tief hängen lassen", was kein Iyengar-Ziel ist).

## viparita_virabhadrasana

**A6** – change `viparita_virabhadrasana.trunk_lean_back` weight 2 -> 3, range [8,45] -> [10,45]
- Die seitliche Rückneigung ist die definierende Handlung der Haltung; ohne sie ist es Krieger II. Weight 3 stellt sie vor die Knieregeln.
- cueBelow neu: `Rumpf über das hintere Bein zurückneigen: Taille lang, Brustbein zur Decke öffnen.`

## padahastasana

**A7** – change `padahastasana.hip_over_feet` range [-0.15,0.4] -> [-0.15,0.25]
- 0.4 Rumpflängen (~20 cm) Hüfte vor dem Knöchel wäre ein Kippen auf die Zehen; die Regel würde das nie melden. Hände unter den Füßen geht mit Hüfte ca. 0-10 cm vor dem Knöchel.

## parighasana

**A8** – delete `parighasana.hip_over_knee`
- Gleiche Aussage wie `kneeling_thigh_vertical` (Hüfte über Knie), mit ±6 cm Toleranz im Rauschen; zwei Cues für dieselbe Handlung.

## navasana

**A9** – delete `navasana.feet_raised`
- Doppelt zu `v_angle`; der Cue sagt "Füße mindestens auf Kopfhöhe", der Wert [0.3,…] relativ zur Hüfte entspricht aber nur einer kleinen Hebung. Cue und Zahl passen nicht zusammen.

## phalakasana

**A10** – change `phalakasana.body_line` cueBelow (lehrt bei Durchhängen die falsche Handlung)
- angle(mid_shoulder, mid_hip, mid_ankle) [165,180] wird sowohl bei hochgeschobener als auch bei durchhängender Hüfte kleiner; der Cue "Hüfte senken" ist bei durchhängender Hüfte (häufigster Fehler) falsch.
- cueBelow neu: `Körper zu einer Linie strecken: Hüfte weder durchhängen lassen noch hochschieben, Bauch fest, Steißbein zu den Fersen.`

## vasisthasana

**A11** – change `vasisthasana.body_line` cueBelow (gleiches Problem)
- cueBelow neu: `Körper zu einer Linie strecken: Hüfte weder absinken lassen noch hochschieben, Fußaußenkante und Hand fest in den Boden.`

## sukhasana / padmasana / siddhasana

**A12** – change `knees_low` cueAbove und cueBelow in allen drei Posen
- cueAbove (Knie über Hüfte, Wert > Obergrenze) neu: `Knie Richtung Boden sinken lassen; Decke oder Block unter die Sitzbeine, bis die Hüften höher sind als die Knie.` (bisher "Knie lassen sich sinken" – kein Imperativ, sagt nichts.)
- cueBelow (praktisch nie erreichbar) neu: `Becken nicht nach hinten wegkippen lassen.`

**A13** – delete `shoulder_over_hip` in sukhasana, padmasana, siddhasana, baddha_konasana, hanumanasana
- Misst praktisch dasselbe wie `trunk_upright_side` / `trunk_upright` (Schulter über Hüfte = Rumpf senkrecht) und gibt fast den gleichen Cue; doppelte Meldung ohne Mehrwert.

## gomukhasana

**A14** – change `gomukhasana.knees_stacked` weight 2 -> 3; change `gomukhasana.hips_level` weight 3 -> 2, range [0,8] -> [0,10]
- Das definierende Iyengar-Merkmal im Sitz sind die übereinander liegenden Knie; die Beckenneigung entsteht dagegen bei verschränkten Beinen natürlich bis ~8° (Rauschen) und würde sonst zu oft falsch alarmieren.

**A15** – change `gomukhasana.shoulders_level` weight 2 -> 1
- Bei der Armbindung stehen die Schultern fachlich bedingt ungleich (obere Schulter höher); eine Abweichung ist kein Fehler, nur ein Hinweis.

## hanumanasana

**A16** – change `hanumanasana.split_angle` margin 15 -> 25
- Der volle Spagat ist das Ziel, aber 140-150° ist eine sehr gute Annäherung und soll "minor", nicht "deutlich daneben" heißen (Falschalarm).

## eka_pada_rajakapotasana

**A17** – change `eka_pada_rajakapotasana.back_leg_straight` weight 3 -> 2, range [160,180] -> [150,180]
- Die Regel bildet nur die Vorstufe (hinteres Bein gestreckt am Boden) ab. In der klassischen Iyengar-Endform ist das hintere Bein gebeugt; ein Fortgeschrittener bekäme sonst "major". Als Vorstufe bleibt sie sinnvoll, darf aber nicht Weight 3 sein.

## jathara_parivartanasana

**A18** – change `jathara_parivartanasana.legs_straight` view `side` -> `front`
- Die Beine werden zur Seite abgesenkt, das liegt in der Bildtiefe der Seitenkamera (Verkürzung). Von der Fußseite (front) liegen die gestreckten Beine in der Bildebene und sind sauber messbar. bestViews entsprechend `['front','side']`.

## bakasana

**A19** – change `bakasana.shoulders_over_wrists` range [-0.05,0.6] -> [0,0.4]
- 0.6 Rumpflängen (~30 cm) ist unrealistisch weit; das Gewicht kommt nur 5-15 cm nach vorn. Obergrenze 0.4 fängt das Vornüberfallen ab, ohne Normalfälle zu treffen.

## parsva_bakasana

**A20** – add rule `parsva_bakasana.arms_straight` (zwei Regeln, links/rechts)
- id `parsva_bakasana.arms_straight_left` / `..._right`, view `side`, angle(left_shoulder,left_elbow,left_wrist) bzw. rechts, range [145,180], margin 12, label `Arm links`/`Arm rechts`, weight 2
- cueBelow `Arme strecken: Hände in den Boden drücken, Schulterblätter breit.`, cueAbove `Ellbogen nicht überstrecken.`
- Grund: Die Haltung hat sonst nur Beinfaltung als Regel; die Armstreckung als Stütz-Aktion fehlt.

## adho_mukha_vrksasana

**A21** – add rule `adho_mukha_vrksasana.shoulder_open`
- view `side`, angle(mid_hip, mid_shoulder, mid_wrist) [155,180], margin 12, label `Schultern offen`, weight 2
- cueBelow `Schultern öffnen: Oberarme am Kopf, Schulterblätter nach oben zu den Füßen ziehen.`, cueAbove `Schultern fest nach oben schieben.`
- Grund: Das zentrale Iyengar-Merkmal im Handstand (Schultern in Streckung, Arme in der Rumpflinie) ist in 2D messbar und fehlt.

## pincha_mayurasana

**A22** – add rules `pincha_mayurasana.upper_arm_vertical_left` / `_right`
- view `side`, tilt(left_elbow->left_shoulder, vertical) bzw. rechts, range [0,18], margin 10, label `Oberarm links`/`Oberarm rechts`, weight 2
- cueBelow `Oberarme senkrecht halten.`, cueAbove `Ellbogen unter die Schultern setzen, Oberarme senkrecht, Schultern von den Ellbogen wegheben.`
- Grund: Basis des Unterarmstands; in `ardha_pincha_mayurasana` schon enthalten.

## urdhva_dhanurasana

**A23** – add rule `urdhva_dhanurasana.arms_vertical`
- view `side`, tilt(mid_wrist->mid_shoulder, vertical) [0,20], margin 10, label `Arme senkrecht`, weight 2
- cueBelow `Arme senkrecht halten.`, cueAbove `Brustbein zwischen die Arme schieben, Schultern über die Handgelenke bringen.`
- Grund: Arme senkrecht, Brust durch die Arme ist Kern der Haltung; bisher nur indirekt über die Hüfthöhe.

## salamba_sarvangasana

**A24** – change `salamba_sarvangasana.trunk_vertical` range [0,15] -> [0,18]
- Auch gute Schüler stehen 15-20° aus der Senkrechten; bei Rauschen ±8° wäre sonst fast jeder "minor". Cue bleibt.

## urdhva_prasarita_padasana

**A25** – delete `urdhva_prasarita_padasana.hip_right_angle`
- Redundant zu `legs_vertical` + `trunk_flat` (Beine senkrecht + Rumpf liegt = 90° Hüfte).

## tolasana

**A26** – no change to values; cueBelow/Above der `hips_lifted`: cueAbove neu `Gleichgewicht über den Händen halten, Becken nur so hoch wie nötig.` (bisher "Becken nicht höher als nötig" – lehrt Zurückhalten statt Aktion; Tolasana verlangt maximales Heben).
- Hinweis: Das ist eine Wortkorrektur, kein Wertewechsel.

---

OK (keine Änderung nötig): prasarita_padottanasana, skandasana, utthita_hasta_padangusthasana, garudasana, natarajasana, utkata_konasana, urdhva_prasarita_eka_padasana, ardha_baddha_padmottanasana, padangusthasana, upavistha_konasana, kurmasana, triang_mukhaikapada_paschimottanasana, krounchasana, balasana, uttana_shishosana, marichyasana_1, marjaryasana, bitilasana, ustrasana, matsyasana, purvottanasana, kapotasana, camatkarasana, bhujangasana, salamba_bhujangasana, salabhasana, dhanurasana, makarasana, ardha_matsyendrasana, marichyasana_3, bharadvajasana, parivrtta_janu_sirsasana, parivrtta_utkatasana, virasana, baddha_konasana (bis auf A13), utthan_pristhasana, sirsasana, halasana, karnapidasana, ardha_pincha_mayurasana, viparita_karani, tittibhasana, astavakrasana, eka_pada_koundinyasana, lolasana, mayurasana, savasana, apanasana, supta_baddha_konasana, supta_padangusthasana, ananda_balasana, supta_virasana, anantasana, parivrtta_parsvakonasana.

Anmerkung zu den "OK"-Posen: Viele cueBelow-Texte sind nicht erreichbar (tilt/Winkel kann den Minimalwert 0 nicht unterschreiten) – das ist unschädlich. Dass "nicht überstrecken"-cueAbove bei Innenwinkel max 180 nie feuert, ebenso.
