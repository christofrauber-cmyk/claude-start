# Yoga-Ausrichtung (Phase 1)

Web app that gives alignment feedback on yoga poses from a front and/or side video, like a teacher would. Everything runs in the browser: the video never leaves the device (only the MediaPipe model is downloaded).

Live: `https://christofrauber-cmyk.github.io/claude-start/yoga/` (published by `.github/workflows/pages.yml` to the `gh-pages` branch).

## How it works
1. **Pose estimation**: MediaPipe PoseLandmarker samples the video at ~9 fps (`src/ui/video.ts`).
2. **Holds**: landmarks are median-filtered over time, and phases where the body shape stays still are detected (`src/core/segmentation.ts`).
3. **Which hold is which pose**: a coarse, camera-independent shape signature per pose (`src/core/signature.ts`, `shape` in `src/data/poses.ts`), plus the school's rules, feed an order-preserving assignment of holds to the sequence steps (`alignHolds`, `src/core/match.ts`).
4. **Side**: for sided poses the lead leg (front or standing leg) is detected automatically (`src/core/side.ts`).
5. **Rules**: each rule measures an angle, tilt or offset in the image plane of ONE camera (`src/core/engine.ts`). Cameras are relative to the mat: `front` = short edge, `side` = long edge.
6. **Overlay**: measured skeleton, the target position (dashed) and correction arrows (`src/ui/overlay.ts`).

## Editing the rules
`src/data/schools/iyengar.ts` holds all Iyengar rules (draft, to be reviewed). Each rule has a view, a measure, a target range, German cues for "too little" / "too much", and a short "why". The header comment lists what a 2D camera cannot measure. A new school is a new file in `src/data/schools/` added to `index.ts`.

## Develop
```
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build
```
