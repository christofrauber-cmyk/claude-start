# Reviewer B challenges Reviewer A (lens: does it work on a phone video, does the cue help)

Totals: 13 AGREE, 9 MODIFY, 4 DISAGREE (26).

- A1 AGREE. Same as my B75; the cues are swapped. A's wording is fine.
- A2 MODIFY. The pose-naming argument is right (a Trikonasana-to-Parivrtta flow should keep the same front leg). But a new SideCue `higherWrist` means a change in types.ts and side.ts plus tests, for a pose Christof marks "kaum messbar". Cheaper: remove `sideCue` for parivrtta_trikonasana in poses-extra.ts (the user picks the side) and swap lead/trail in the leg rules as A describes (front_leg = lead_*, back_leg = trail_*). Wrist tilt/line rules stay symmetric. B-REVISED B9 to this. Keep my B7 (arm-line rules to `front`) in addition.
- A3 AGREE. Same as my B1 (weight 2). I also widen the range to [0,10].
- A4 AGREE. Same as my B17.
- A5 MODIFY. "Fersen am Boden" cannot be seen, and the rule only fires when the knee is very deeply bent. New cueBelow: `Nicht tiefer zwingen: Rücken lang halten, Fersen am Boden.` Combine with my B19 (range [20,90]).
- A6 MODIFY. Weight 3 is fine because it is the defining action. But raising the lower bound to 10 makes the rule stricter, which noise does not support. Keep range [8,45], weight 3, take A's cueBelow.
- A7 MODIFY. 0.25 is too tight. Pressing the hands under the feet needs the hip to move forward, and the offset noise is about 0.05-0.08. Use [-0.15,0.3] and keep the cueAbove.
- A8 AGREE. Same as my B23.
- A9 AGREE. Same as my B74.
- A10 AGREE. Same as my B89 (X2). A's wording is good, but shorten it: `Körper zu einer Linie strecken: Hüfte weder hängen lassen noch hochschieben.` The extra "Bauch fest, Steißbein zu den Fersen" turns one cue into three.
- A11 AGREE. Same as my B88; use the same shortened text.
- A12 MODIFY. The new cueAbove "Knie Richtung Boden sinken lassen" is unsafe for Padmasana and invites forcing the knees (X6). Use `Die Knie sind höher als die Hüften: Decke oder Block unter das Gesäß legen.` for sukhasana and siddhasana, and for padmasana add `Knie nie nach unten drücken; im Zweifel Halblotus.` cueBelow is unreachable, so leave it unchanged.
- A13 AGREE. Same as my B58, B64 and B70.
- A14 MODIFY. hips_level w2 with [0,10]: AGREE (same as my B68). knees_stacked to w3: DISAGREE. It is the x-offset between two knees that sit one over the other, a short, noisy segment with crossed legs (X3), and "übereinander" depends on depth. Keep w2.
- A15 MODIFY. I prefer deleting it (my B67). A raised top arm makes the shoulders uneven by design, so weight 1 would still show a "minor" on correct poses.
- A16 MODIFY. A margin of 25 on [165,180] still marks most users minor. Use my B69: range [150,180], margin 25, weight 2, and the softer cueBelow.
- A17 AGREE. Weight 2 and range [150,180] are sensible; a deeper-bent back leg is a normal variant.
- A18 AGREE. B-REVISED B53. I had proposed deleting `jathara_parivartanasana.legs_straight`. A is right that the legs lowered across the mat lie in the image plane of the short-edge camera and are measurable there. Move it to `front`, bestViews ['front','side'], weight 2. Keep `shoulders_flat`.
- A19 MODIFY. Use [-0.1,0.4]. Raising the lower bound from -0.05 to 0 makes the rule stricter, and a shoulder just behind the wrist is within noise. Taking the upper bound down to 0.4 is good.
- A20 DISAGREE. Adds two arm rules to a pose where arms are partly hidden behind the knees and the torso is twisted. This is more noise for a pose whose real point (hips and knees on the upper arm) is not measurable. Do not add.
- A21 DISAGREE. An inverted pose with MediaPipe has unreliable shoulder, hip and wrist landmarks, and the pose already has `arms_straight`, `legs_straight` and `body_vertical`. Adding a fifth makes false alarms more likely. Do not add (and I still delete `trunk_vertical`, B80).
- A22 DISAGREE. Two more rules in an inverted pose where the far arm is hidden, and the verticality of the upper arm is hard to see at ±8°. Do not add.
- A23 DISAGREE. In the wheel the shoulders normally stay forward of the wrists (past vertical) as a strength, so [0,20] gives "major" on good wheels; arms are already covered by `arms_straight` w3. Do not add.
- A24 AGREE. A range of [0,18] is realistic given the noise. I also use it for `halasana.trunk_vertical` and `karnapidasana.trunk_vertical` (new, B-REVISED: widen both to [0,18]).
- A25 AGREE. Same as my B103.
- A26 AGREE. A wording fix with no change in measurement.

## Five strongest objections to A

1. A21, A22, A23: three added rules in inverted/backbend poses where the landmark quality is lowest. A is the only one to add rules in them, and each one can create a false "major" on a correct pose (especially the wheel shoulder-over-wrist rule).
2. A2: a new SideCue and test surface for a pose the app itself says is barely measurable. Removing the sideCue and swapping lead/trail gives the same naming benefit with no code.
3. A12: the replacement cue in Padmasana tells people to push the knees toward the floor, which is a knee-injury cue.
4. A14: raising `gomukhasana.knees_stacked` to weight 3 puts a noisy short-segment measure (X3) ahead of the more reliable hip and trunk rules.
5. A6/A7/A19: several A edits tighten ranges (lower bound 10 in A6, 0.25 in A7, 0 in A19) with no account of the ±5-8° noise; for the user this means more false alarms, not fewer.

## B-REVISED summary
- B9: remove `sideCue` for parivrtta_trikonasana and swap lead/trail in the leg rules (instead of leaving it).
- B53: move `jathara_parivartanasana.legs_straight` to `front` (instead of deleting).
- New: `halasana.trunk_vertical` and `karnapidasana.trunk_vertical` range [0,18], aligned with A24.
