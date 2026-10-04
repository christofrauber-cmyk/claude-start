# Review brief (shared by reviewers A and B and the judge)

App: browser app that gives yoga alignment feedback from a front and/or side video (camera views are relative to the MAT: 'front' = short front edge, 'side' = long edge). MediaPipe gives 33 2D landmarks; every rule measures ONE angle/tilt/offset in the 2D image plane of ONE camera (see /home/user/claude-start/yoga-align/src/core/types.ts, src/core/engine.ts, src/core/landmarks.ts, src/core/side.ts). Measurement noise ±5–8°, hidden limbs are common. Offsets are shown to the user as approx. cm (torso ≈ 50 cm).

Under review: the DRAFT Iyengar rules for 79 poses in
/home/user/claude-start/yoga-align/src/data/schools/iyengar-extra-1.ts … iyengar-extra-4.ts
(pose definitions incl. sided/sideCue/bestViews/limits: src/data/poses-extra.ts).
Reference for approved style and quality: src/data/schools/iyengar.ts (the 22 core poses, already reviewed by the yoga teacher Christof — do NOT review those).

Product goal (from Christof): practical, simple, purposeful for the user; everything as intuitive as possible. That means: fewer but correct and clearly actionable cues beat many noisy ones; a false alarm ("deutlich daneben" when the pose is fine) is worse than a missed detail; cues in plain, short German teacher voice a layperson understands; the most important rules (weight 3) first.

A proposal must be concrete: pose id, rule id, action (keep / change / delete / add), exact new values or text, and a one-sentence reason.
