// Video handling: pose extraction with MediaPipe and frame grabbing.
// Everything runs locally; the video never leaves the device.
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { TimedFrame } from '../core/segmentation';
import type { PoseFrame } from '../core/types';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';

/** Sampling rate for the analysis. */
export const SAMPLE_FPS = 9;
/** Longest canvas edge fed to the model / used for screenshots. */
const MODEL_EDGE = 720;
const SHOT_EDGE = 1280;

export interface Extraction {
  width: number;
  height: number;
  duration: number;
  frames: TimedFrame[];
}

async function createLandmarker(): Promise<PoseLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const make = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
  try {
    return await make('GPU');
  } catch {
    return make('CPU');
  }
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    const timer = setTimeout(() => reject(new Error('Das Video konnte nicht geladen werden (Zeitüberschreitung).')), 30000);
    v.onloadeddata = () => {
      clearTimeout(timer);
      resolve(v);
    };
    v.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Das Video konnte nicht gelesen werden. Bitte ein anderes Format (z. B. MP4/H.264) versuchen.'));
    };
    v.src = src;
    v.load();
  });
}

function seek(v: HTMLVideoElement, t: number): Promise<void> {
  const target = Math.max(0, Math.min(t, (isFinite(v.duration) ? v.duration : t) - 0.04));
  if (Math.abs(v.currentTime - target) < 1e-3 && v.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Zeitüberschreitung beim Suchen im Video.')), 10000);
    v.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
    v.currentTime = target;
  });
}

function fitSize(w: number, h: number, edge: number): [number, number] {
  const s = Math.min(1, edge / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}

/** Samples the video at ~SAMPLE_FPS and runs pose detection on every sample. */
export async function extractPoses(file: File, onProgress: (fraction: number) => void): Promise<Extraction> {
  const url = URL.createObjectURL(file);
  let landmarker: PoseLandmarker | null = null;
  try {
    const video = await loadVideo(url);
    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) throw new Error('Die Videolänge ist unbekannt – bitte ein anderes Format versuchen.');
    const width = video.videoWidth, height = video.videoHeight;
    const [cw, ch] = fitSize(width, height, MODEL_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const cx = canvas.getContext('2d', { willReadFrequently: true })!;

    onProgress(0);
    landmarker = await createLandmarker();
    const n = Math.max(1, Math.floor(duration * SAMPLE_FPS));
    const stepMs = 1000 / SAMPLE_FPS;
    const frames: TimedFrame[] = [];

    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_FPS;
      await seek(video, t);
      cx.drawImage(video, 0, 0, cw, ch);
      const res = landmarker.detectForVideo(canvas, Math.round((i + 1) * stepMs));
      const lms = res.landmarks[0];
      const frame: PoseFrame | null = lms
        ? lms.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 }))
        : null;
      frames.push({ t, frame });
      onProgress((i + 1) / n);
      // Let the browser paint the progress bar.
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return { width, height, duration, frames };
  } finally {
    landmarker?.close();
    URL.revokeObjectURL(url);
  }
}

// ----- frame grabbing (screenshots) -----

const urls = new WeakMap<File, string>();
const videos = new Map<string, Promise<HTMLVideoElement>>();
const queues = new Map<string, Promise<unknown>>();

function urlFor(src: File | string): string {
  if (typeof src === 'string') return src;
  let u = urls.get(src);
  if (!u) { u = URL.createObjectURL(src); urls.set(src, u); }
  return u;
}

/** Releases the object URL and cached element of a file. */
export function releaseVideo(file: File): void {
  const u = urls.get(file);
  if (!u) return;
  URL.revokeObjectURL(u);
  urls.delete(file);
  videos.delete(u);
  queues.delete(u);
}

/** Returns the video frame at time t (seconds) as a canvas in natural resolution (capped). */
export function grabFrame(src: File | string, t: number): Promise<HTMLCanvasElement> {
  const url = urlFor(src);
  let vp = videos.get(url);
  if (!vp) { vp = loadVideo(url); videos.set(url, vp); }
  // Seeks on one element must not overlap.
  const job = (queues.get(url) ?? Promise.resolve()).catch(() => undefined).then(async () => {
    const video = await vp!;
    await seek(video, t);
    const [w, h] = fitSize(video.videoWidth, video.videoHeight, SHOT_EDGE);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(video, 0, 0, w, h);
    return c;
  });
  queues.set(url, job);
  return job;
}
