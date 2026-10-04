# Reviewer B (product / computer-vision / yoga lens) - proposals

Rule ids are written without the pose prefix (e.g. `hips_level` = `parsvottanasana.hips_level`). "w" = weight. Tilt/angle rules whose range starts at 0 / ends at 180 can only fire in one direction; I only mention the dead cue when it is misleading.

## Cross-cutting findings (drive many proposals below)

- X1 Wide stances. In the core file, spread stances (Warrior II, Trikonasana) are judged from `side` because the stance runs along the mat length (a wide stance does not fit across a 60 cm mat). Prasarita, Skandasana, Utkata Konasana and Parighasana are the same kind of stance, but the draft measures their frontal-plane rules (leg angles, hip tilt, knee tracking) from `front`, where the stance is seen end-on and foreshortened. Fix: view `side` for those rules.
- X2 "Interior angle" body lines (Phalakasana, Vasisthasana, Mayurasana) cannot tell hanging hips from piked hips, but the cueBelow only names one of them ("Hüfte heben" / "Hüfte senken"). That sends half of all users in the wrong direction. Neutral cue needed.
- X3 Tilt measures on short segments (knees held together, ear-ear, wrist-wrist when hands are close) are extremely noisy. Do not use them for "level" checks unless the segment is shoulder- or hip-wide.
- X4 Rules that test flexibility or strength and not alignment (hands to foot, leg height, split depth, knees to floor) produce "deutlich daneben" for normal users. Widen or drop.
- X5 Many poses carry `shoulders_level` (w1) and a duplicate "trunk upright" in two forms. These are noise and overload; delete.
- X6 Safety: cues that tell people to force knees down (Padmasana, Supta Baddha Konasana, Baddha Konasana) or reach deeper into extreme backbends (Kapotasana) must not be given by an automatic tool.

---

## parsvottanasana
- B1 `hips_level` - change: range [0,10], weight 2 (was [0,8], w3), cueAbove "Becken ausgleichen: beide Hüftknochen gleich hoch, die hintere Hüfte nach vorn." Reason: hips are half-hidden by the fold seen from the front, noise ±5-8 makes [0,8] a false-alarm generator; the tilt does not even measure the rotation the old cue talks about.
- B2 `shoulders_level` - delete. Reason: w1, noisy in a forward fold, adds nothing.

## prasarita_padottanasana
- B3 all rules (`left_leg_straight`, `right_leg_straight`, `hips_level`, `leg_spread`) - change view `front` -> `side`; poses-extra.ts bestViews ['side','front']. Reason: X1; from the short edge the wide stance is foreshortened and `leg_spread` collapses.
- B4 `shoulders_level` - delete. Reason: head and shoulders hang between the legs, landmarks are unreliable and the cue ("nicht seitlich drehen") is not what a tilt measures.
- B5 `hips_level` - change: range [0,8], weight 2. Reason: [0,6] is inside normal noise.
- B6 `leg_spread` - change: label "Fußabstand", weight 1 (range unchanged). Reason: "Grätschwinkel" is jargon.

## parivrtta_trikonasana
- B7 `arms_line_vertical` - change: view `side` -> `front`. Reason: legs lie along the mat; the arm line stands in the plane across the mat, which only the short-edge camera sees face-on. From `side` it is edge-on and the wrist-to-wrist tilt is noise.
- B8 `arms_straight_line` - delete. Reason: redundant with `arms_line_vertical`, needs both wrists visible, and the angle at a mid_shoulder is meaningless in a twist.
- B9 `front_leg_straight`/`back_leg_straight` - keep, but note: lowerWrist makes lead the BACK leg, the opposite of how users name the pose ("rechts" = right foot forward). Both rules share the same range, so measurement stays correct; only the labels say "vorderes/hinteres" for the wrong leg when the side was chosen by the user. Change labels to "Bein vorn" / "Bein hinten" only if Christof wants lead = front leg; otherwise leave.

## parivrtta_parsvakonasana
- B10 `back_line` - delete. Reason: contradicts `trunk_lean` (a trunk allowed up to 65° above horizontal makes the hip angle fall under 135 on its own) and gives false alarms.

## skandasana
- B11 `bent_knee_angle`, `straight_leg_straight`, `hips_level`, `trunk_upright`, `bent_knee_tracking` - change view `front` -> `side`; bestViews ['side','front'] (X1).
- B12 `bent_knee_tracking` - change: range [0,0.2]. Reason: in the deep lunge the knee sits lateral to the ankle by design; 0.15 torso (~7 cm) false-alarms.

## utthita_hasta_padangusthasana
- B13 `leg_lift` - change: range [25,130], weight 1. Reason: X4; a leg at 45° (with strap) is normal and now reads "major".
- B14 `standing_leg_vertical` - change: range [0,10]. `trunk_upright` - range [0,15]. `hips_level` - range [0,10]. Reason: [0,8]/[0,12] are inside noise for a balancing person.

## garudasana
- B15 `shoulders_level` - delete. Reason: X5; arms are wrapped, shoulders are legitimately uneven.

## natarajasana
- B16 `trunk_lean` - change cueAbove: "Brustbein heben, Rumpf aufrichten: die Rückbeuge im ganzen Rücken verteilen, nicht nur im unteren Rücken." Reason: "Lendenwirbelsäule" is jargon.

## malasana
- B17 `hip_depth` - delete. Reason: redundant with `knee_angle`.
- B18 `hips_level`, `shoulders_level` - delete. Reason: low value in a symmetrical squat; viewed from `side` they are not even measurable.
- B19 `knee_angle` - change: range [20,90], margin 15. Reason: stiff ankles (heels lift) are common; 80 punishes them with "tiefer", which also pushes people onto lifted heels.

## utkata_konasana
- B20 `left_knee_angle`, `right_knee_angle`, `hips_level`, `trunk_vertical`, `left_shin_vertical`, `right_shin_vertical` - change view `front` -> `side`; bestViews ['side','front'] (X1).
- B21 `left_shin_vertical`, `right_shin_vertical` - change: range [0,15], weight 1. Reason: shins stand slightly outward by design with turned-out feet; 7 rules is too many.

## parighasana
- B22 `extended_leg_straight`, `kneeling_thigh_vertical`, `trunk_side_bend` - change view `front` -> `side`; bestViews ['side','front'] (X1: the extended leg lies along the mat).
- B23 `hip_over_knee` - delete. Reason: duplicate of `kneeling_thigh_vertical`.

## upavistha_konasana
- B24 `leg_spread` - delete. Reason: legs lie on the floor pointing at the camera; the 2D angle at the hip is always near 180, so the rule never says anything useful.
- B25 `shoulders_level` - delete (X5). `hips_level` - range [0,8], weight 2.

## kurmasana
- B26 `trunk_low` - delete. Reason: duplicate of `hip_fold`.
- B27 `hip_fold` - weight 2; `legs_straight` - weight 1. Reason: legs are under the arms, landmarks unreliable.

## triang_mukhaikapada_paschimottanasana
- B28 `straight_leg_on_floor` - delete. Reason: a lifted knee already shows in `straight_leg`.
- B29 `hands_reach_foot` - delete. Reason: X4, flexibility test.
- B30 `hip_fold` - change: range [0,80], margin 20. Reason: sitting upright gives ~90°; normal beginners at 70-80° must not be "deutlich daneben".
- B31 `hips_level` - change: range [0,10], weight 2. Reason: hips are hidden behind the forward-reaching legs from the front.
- B32 `folded_knee` - weight 1. Reason: the folded leg is behind the body.

## krounchasana
- B33 `folded_knee` - delete. Reason: hidden behind the body.
- B34 `leg_to_trunk` - weight 2. Reason: flexibility, not alignment.

## balasana
- B35 `knees_folded` - delete. Reason: redundant with `hips_to_heels`, ankles are hidden.
- B36 `trunk_low` - change: range [0,45], weight 1. Reason: a rest pose; with bolster or stiff hips the trunk is higher.

## uttana_shishosana
- B37 `left_arm_straight`, `right_arm_straight` - weight 1. Reason: the far arm is often hidden, and arm straightness is secondary to the chest drop.

## marichyasana_1
- B38 `straight_leg_on_floor`, `shin_vertical` - delete. Reason: redundant (X5).
- B39 `hip_fold` - range [0,80], margin 20 (see B30). `hips_level` - range [0,10], weight 2.

## marjaryasana
- B40 `left_arm_straight`, `right_arm_straight` - delete. Reason: duplicate of `arms_vertical`; a cat pose is judged by the spine, which we cannot see, so keep only the two basic tabletop checks.

## bitilasana
- B41 `left_arm_straight`, `right_arm_straight` - delete (as B40).
- B42 `head_lifted` - delete. Reason: unreliable and the cue "Blick anheben" pushes the neck into overextension.

## ustrasana
- B43 `left_arm_straight`, `right_arm_straight`, `hands_on_heels` - delete. Reason: hands on hips / lower back / blocks are normal and valid; these rules call them "major". Keep `thighs_vertical` and `hip_extension`.

## purvottanasana
- B44 `legs_straight` - delete. Reason: redundant with `body_line` (5 -> 4 rules).
- B45 `body_line` - cueBelow: "Becken höher heben: Schultern, Hüfte und Fersen in eine Linie." (unchanged meaning, drop "schräge").

## kapotasana
- B46 `deep_backbend`, `hands_to_feet` - delete. Reason: X6; the limits text already says unreliable, and "Brust weiter nach hinten öffnen / Hände zu den Füßen" in an extreme backbend is an injury cue.

## camatkarasana
- B47 `support_leg_straight` - delete. Reason: the support leg is commonly bent in this pose; false alarm.

## dhanurasana
- B48 `left_arm_straight`, `right_arm_straight` - weight 2. Reason: hands and feet overlap, measurement is unreliable and beginners bend the arms.

## makarasana
- B49 `legs_straight`, `legs_on_floor` - delete. Reason: a rest pose; do not criticise relaxation. Keep `trunk_flat` only.

## ardha_matsyendrasana
- B50 `raised_knee` - delete. Reason: w1, hidden by the arm, low value.

## marichyasana_3
- B51 `straight_leg_on_floor` - delete (B28). `hips_level` - range [0,10], margin 8 (m6 is too strict).

## bharadvajasana
- B52 `shoulders_level`, `ear_over_shoulder` - delete (X5). Reason: five rules for one twist is overload.

## jathara_parivartanasana
- B53 `legs_straight` - delete. Reason: the legs fall across the mat toward/away from the side camera, so the knee angle is distorted; the real twist is in the depth axis.
- B54 `arms_in_line` - weight 1.

## parivrtta_janu_sirsasana
- B55 `straight_leg_on_floor` - delete (B28).

## parivrtta_utkatasana
- B56 `knees_level` - delete. Reason: X3; knees are pressed together, the tilt of a ~10 cm segment is noise.
- B57 `knee_over_ankle` - weight 1.

## sukhasana / padmasana / siddhasana
- B58 `shoulder_over_hip` (all three) - delete. Reason: same plane and same info as `trunk_upright_side`.
- B59 `shoulders_level` (all three) - delete (X5).
- B60 `trunk_upright_side` - range [0,12]; `trunk_vertical_front` - range [0,8]; `hips_level` - range [0,8] (all three). Reason: [0,6]/[0,10] are inside sitting noise.
- B61 `knees_low` cueAbove (sukhasana, siddhasana): "Die Knie sind höher als die Hüften: Decke oder Block unter das Gesäß legen." Reason: the draft text "Knie lassen sich sinken" is unintelligible.
- B62 `padmasana.knees_low` cueAbove: "Die Knie sind hoch: Decke unter das Gesäß legen oder erst Halblotus üben. Knie nie nach unten drücken." Reason: X6, knee injury risk.

## virasana
- B63 `trunk_vertical_front` - range [0,8]; `hips_level` - range [0,8]. Reason: as B60.

## baddha_konasana
- B64 `shoulders_level`, `shoulder_over_hip` - delete. 
- B65 `knees_down` cueAbove: "Knie nur sinken lassen, nicht nach unten drücken: Decken oder Blöcke unter die Knie legen." Reason: X6.
- B66 `hips_level` - range [0,8]; `knees_level` - range [0,10]. 

## gomukhasana
- B67 `shoulders_level` - delete. Reason: the raised top arm tilts the shoulder line by design (>12° typical) - false alarm for correct poses.
- B68 `hips_level` - range [0,10], weight 2; `trunk_vertical_front` - weight 2.

## hanumanasana
- B69 `split_angle` - change: range [150,180], margin 20, weight 2; cueBelow "Becken Richtung Boden sinken lassen, Blöcke unter die Hände: nicht erzwingen." Reason: X4; most users never reach 165°.
- B70 `shoulder_over_hip` - delete (duplicate of `trunk_upright`).

## eka_pada_rajakapotasana
- B71 `hips_level` - range [0,10], weight 2. `shoulders_level` - delete.

## utthan_pristhasana
- B72 `hips_level` - delete (hidden, not the point).
- B73 `knee_over_heel` - range [-0.2,0.2]. Reason: ankle noise vs 0.15 torso.

## navasana
- B74 `feet_raised` - delete. Reason: w1, conflicts with `v_angle`, and "Füße auf Kopfhöhe" is wrong for beginners.

## ardha_navasana
- B75 `trunk_lowered` - SWAP cues. cueBelow (trunk too flat, <10°): "Rumpf etwas höher halten, Brustbein heben." cueAbove (>60°): "Rumpf weiter zurücklehnen, aber den Rücken lang halten." Reason: current texts point the wrong way (below range = already too low, yet it says "weiter hinunter").

## sirsasana
- B76 `body_vertical_side`, `body_vertical_front` - range [0,12], margin 8. `legs_straight` - weight 1. Reason: inverted-pose detection noise is above ±8°, and a false "du kippst" in a headstand is worse than a missed one.

## salamba_sarvangasana
- B77 `legs_vertical` cueAbove: "Beine gerade nach oben strecken, Fersen über die Hüften." Reason: draft text "nicht zu den Füßen hin fallen lassen" is nonsense.

## karnapidasana
- B78 `knees_by_ears` - delete. Reason: ears are mostly hidden in profile; redundant with `knees_bent`.

## pincha_mayurasana
- B79 `body_vertical_side`, `body_vertical_front` - range [0,12]. Reason: as B76.

## adho_mukha_vrksasana
- B80 `trunk_vertical` - delete. Reason: redundant with `body_vertical`; "Bananenform" is jargon.

## ardha_pincha_mayurasana
- B81 `hips_high` - delete. Reason: redundant with `hip_angle`; 5 rules -> 4.

## bakasana
- B82 `knees_folded` - delete. Reason: knees are hidden under the arms and the two cues contradict each other.

## parsva_bakasana
- B83 `trail_leg_folded` - delete; `lead_leg_folded` - weight 1, cueBelow "Knie etwas weiter öffnen." Reason: hidden legs, and the draft cueBelow ("Bein nicht öffnen") points the wrong way.

## astavakrasana
- B84 `lead_leg_straight`, `trail_leg_straight` - delete; ADD `legs_straight`, view `side`, measure angle(mid_hip, mid_knee, mid_ankle), range [150,180], margin 12, label "Beine", w2, cueBelow "Beine strecken: Fersen wegschieben.", cueAbove "Knie nicht überstrecken." Reason: the legs are crossed, so a lead/trail split is meaningless.

## eka_pada_koundinyasana
- B85 `legs_split` - delete. Reason: depends on the camera plane; the "Spagat in der Luft" cue is not safely measurable.

## vasisthasana
- B86 `support_arm_vertical`, `top_arm_vertical` - change view `side` -> `front`. Reason: the body runs along the mat; the arm lean across the mat is visible only to the short-edge camera.
- B87 `arms_line`, `legs_straight`, `body_incline` - delete. Reason: redundant (X5) or meaningless (`body_incline` has no Iyengar meaning).
- B88 `body_line` - cueBelow "Körper in eine gerade Linie bringen: Hüfte weder hängen lassen noch hochschieben." Reason: X2.

## phalakasana
- B89 `body_line` - cueBelow same neutral cue as B88 (replaces "Hüfte senken"). Reason: X2, sagging hips are the more common error and the current cue says the opposite.
- B90 `body_level`, `legs_straight` - delete (redundant with `body_line`). `arms_straight_left/right` - weight 2.

## lolasana
- B91 `knees_folded` - delete. Reason: crossed legs, hidden.

## mayurasana
- B92 `body_line` - delete (X2, duplicate of `body_level`).

## savasana
- B93 `legs_straight` - delete. Reason: bolster under knees is common; a rest pose must not nag.
- B94 `body_flat` - weight 1. `shoulders_level`, `hips_level` - range [0,10].

## apanasana
- B95 `knees_bent` - delete (duplicate of `hip_flexed`).

## supta_baddha_konasana
- B96 `knees_open` - weight 1, range [0.3,2.0], cueBelow "Knie nur so weit sinken lassen, wie es angenehm ist: Decken oder Blöcke unter die Knie legen." Reason: X6.
- B97 `shoulders_level`, `trunk_flat` - delete (X5, props make them meaningless).

## supta_padangusthasana
- B98 `floor_leg_flat` - delete (redundant with `floor_leg_straight`).
- B99 `leg_raised` - range [30,130], margin 15, weight 1. Reason: X4.

## ananda_balasana
- B100 `knees_bent` - delete (overlaps `shins_vertical`); `knees_level` - delete (X3).

## supta_virasana
- B101 `thighs_on_floor` - range [0,25], weight 2. Reason: flexibility; false alarm for most users and knee-strain risk when they force it.

## anantasana
- B102 `body_flat` - delete (duplicate of `body_line`).

## urdhva_prasarita_padasana
- B103 `hip_right_angle` - delete (duplicate of `legs_vertical`).

---

OK (no change needed or only trivial): viparita_virabhadrasana, urdhva_prasarita_eka_padasana, ardha_baddha_padmottanasana, padangusthasana, padahastasana, urdhva_dhanurasana, matsyasana, bhujangasana, salamba_bhujangasana, salabhasana, halasana, viparita_karani, tittibhasana, tolasana
