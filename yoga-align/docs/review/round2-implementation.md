# Round 2: implementation status (2026-10-06)

Source: the panel's round-2 decision (P1-P37). Code: `src/data/schools/iyengar*.ts`, `src/data/poses-extra.ts`, `src/core/landmarks.ts`.
Result: 278 rules in the 79 extra poses (round 1: 289), 439 in all 100 poses. 157 tests pass, `npm run build` is clean.

## Answers to "Im Code prüfen"
1. **sided without sideCue:** `resolveSide` uses the detected side only if the pose has a `sideCue`, else the side named in the step, else `'right'`. So Parivrtta Trikonasana can be on the wrong side. Fix (P1): identical `left_`/`right_` leg rules, no `lead_`/`trail_`, so the side no longer matters.
2. **tilt** is unsigned (0..90). **angle** is unsigned (0..180). **offset** is signed (`toward`) and normalised by the 2D torso length of the same frame.
3. **mid_elbow** did not exist. Added to `MIDPOINTS` (same pattern as `mid_wrist`).
4. **Minimum of 2 rules:** enforced by 5 tests. Now 1; a pose with exactly 1 rule must say "Grobe Einschätzung" in `limits` (new test).
5. **Cues** are required strings in `Rule`; "no cueAbove" is not possible, so a neutral cue is used instead.
6. **Signed lean (P21):** possible without core changes: `offset(mid_shoulder, mid_hip, x, toward trail_ankle)`, range [0.14, 0.7] torso lengths (about 8-45 degrees), so falling forward gives a negative value and the back-lean cue. Tested with synthetic frames.

## Done
P1, P2, P3, P4, P5 (hips_level only), P6, P8, P10, P11, P12, P13, P14, P15, P17, P18, P19, P20, P21, P22, P24, P25, P26 (3:0 parts and the 2:1 majority, see below), P27, P29, P30, P31, P32, P34, P35 (1, 3, 4, 5), P36, P37. Kernaussage 4 (noise floor 10) applied file-wide, 23 ranges, with a test.

## Decisions I made where the text and the code disagree
- **P9/P10 premise was wrong:** the text says no `*arm_straight*` rules exist in Marjaryasana, Bitilasana, Ustrasana. They did. I deleted them in those three poses (B40, B41, B43; Ustrasana arms "stay deleted"). In **Uttana Shishosana and Dhanurasana** B only asked for lower weights (B37 w1, B48 w2); I left them unchanged because P9 says "nichts ändern". Say if you want B's weights.
- **Kapotasana** keeps only `thighs_vertical`; `limits` says "Grobe Einschätzung". The `knees_hip_width` fallback was not needed.
- **Supta Baddha Konasana:** the offset normalises by the 2D torso, which explodes for a lying person from front. Used the scale-free fallback `angle(left_knee, mid_hip, right_knee)`, front, [60, 180], w1.
- **Phalakasana:** one `arms_straight` rule on the new `mid_elbow` ([150, 180], margin 12, w2).
- **Astavakrasana** `legs_straight` moved to front.

## Not applied
- **P28 exception (author's opinion, R2):** Prasarita `left/right_leg_straight` back to front. The panel confirmed side 2:1, so side stays. Open decision, see below.
- **P35 (2) Eka Pada Koundinyasana:** legs stay on side. Whether the legs lie across the mat depends on the variant; not decidable from the text.
- **P26 R2 dissent:** `support_arm_vertical` / `top_arm_vertical` stay on front (2:1 majority). Question 5 decides.
- **P23 Ardha Navasana:** already as decided.

## Answered by Christof (2026-10-06) and implemented
1. Eka Pada Rajakapotasana: preliminary pose (back leg long). Already so, `limits` says it.
2. Makarasana: Light on Yoga variant (chest lifted, hands at the head). `trunk_flat` deleted; only `legs_on_floor` remains (w1, "Grobe Einschätzung").
5. Vasisthasana: the typical error is the hand too far toward the head, i.e. along the mat. `support_arm_vertical` and `top_arm_vertical` moved from front to side (R2's position); all four rules are now side.

## Researched (Iyengar's answer, secondary sources only, the original text could not be opened here)
3. Malasana in Light on Yoga: feet together, deep squat, trunk forward between the thighs, hands bound behind the back or around the ankles, forehead to the floor in the full form. So the upright squat is the modern form. Implemented: `trunk_upright` and `hips_level` deleted (the first would punish the Iyengar form, the second is hidden by the trunk); only `knee_angle` remains, `limits` says so.
4. Parsva Bakasana: no primary source found. Secondary sources only agree that one thigh rests on the opposite upper arm after a full twist; for the arms they conflict (straight as possible vs. bent elbows). The current rules (`shoulders_over_wrists`, `lead_leg_folded`) work with both, so nothing changed. Check Light on Yoga, Parsva Bakasana, if you want an arm rule back.

## Decided by Christof (2026-10-06, second batch)
1. Flexibility depth: stays as it is (low weight, "only as far as" cues). No engine flag.
2. Prasarita: `left_leg_straight` / `right_leg_straight` deleted (the knee bends toward the side camera, so they could never fire). Left: `hips_level`, `leg_spread`, `hip_over_feet_side`.
3. Skandasana: name and pose unchanged (modern side lunge).
4. Eka Pada Koundinyasana: usually one leg points to the short mat edge and one to the long edge; very flexible people point both to opposite short edges. Christof: the FRONT leg points to the long edge. So `lead_leg_straight` is on front (w2, margin 12) and `trail_leg_straight` stays on side (w2, margin 10). For very flexible people (both legs to the short edges) the front leg is foreshortened in that view; `limits` says so.
5. Parivrtta Trikonasana convention confirmed: "rechts" = right leg in front, left hand outside the right foot.
6. Uttana Shishosana arms w1, Dhanurasana arms w2 (B's weights).
7. Viparita Virabhadrasana, Kapotasana fallback, Parsva Bakasana arms: as they are.
