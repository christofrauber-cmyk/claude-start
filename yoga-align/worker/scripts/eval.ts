// Compares Haiku and Sonnet on stills from the test videos: accuracy, latency, real cost.
// Usage: ANTHROPIC_API_KEY=... (or EVAL_ANTHROPIC_API_KEY, e.g. in managed cloud sessions where ANTHROPIC_API_KEY is reserved) npx tsx scripts/eval.ts /path/to/yoga-testvideos [fast|accurate ...]
// Needs ffmpeg. The stills are written to eval/stills/ (git-ignored) and never committed.
import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { classifyPose, MODELS, type ModelKey } from '../src/classify';

interface Case { view: 'front' | 'side'; t: number; accept: string[] }
const spec = JSON.parse(readFileSync('eval/cases.json', 'utf8')) as { videos: Record<string, string>; cases: Case[] };
const videoDir = process.argv[2];
if (!videoDir) throw new Error('Pass the folder with the test videos.');
const models = (process.argv.slice(3).length ? process.argv.slice(3) : ['fast', 'accurate']) as ModelKey[];

// Same size as the app sends: longest edge 1024 px, JPEG quality ~80.
mkdirSync('eval/stills', { recursive: true });
const still = (c: Case) => {
  const out = `eval/stills/${c.view}-${c.t}.jpg`;
  if (!existsSync(out)) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(c.t), '-i', path.join(videoDir, spec.videos[c.view]),
      '-frames:v', '1', '-vf', 'scale=1024:1024:force_original_aspect_ratio=decrease', '-q:v', '4', out]);
  }
  return readFileSync(out, 'base64');
};

// Cloud sessions reserve ANTHROPIC_API_KEY/BASE_URL for the host, so a separate variable talks to the public API directly.
const evalKey = process.env.EVAL_ANTHROPIC_API_KEY;
const client = evalKey ? new Anthropic({ apiKey: evalKey, baseURL: 'https://api.anthropic.com' }) : new Anthropic();
for (const m of models) {
  let ok = 0, top3 = 0, cost = 0, ms = 0;
  console.log(`\n== ${MODELS[m]} ==`);
  for (const c of spec.cases) {
    const t0 = Date.now();
    const r = await classifyPose(client, m, [{ view: c.view, data: still(c) }]);
    const dt = Date.now() - t0;
    ms += dt; cost += r.costUsd;
    const a = r.answer;
    const hit = !!a && c.accept.includes(a.pose_id);
    const inTop3 = hit || !!a?.alternatives.slice(0, 2).some((x) => c.accept.includes(x.pose_id));
    ok += +hit; top3 += +inTop3;
    console.log(`${hit ? 'OK  ' : 'MISS'} ${c.view.padEnd(5)} ${String(c.t).padStart(3)}s  want ${c.accept[0].padEnd(22)} got ${(a?.pose_id ?? r.stop ?? '-').padEnd(22)} conf ${a?.confidence.toFixed(2) ?? '-'}  ` +
      `alt ${a?.alternatives.map((x) => x.pose_id).join(',') ?? ''}  ${dt} ms  $${r.costUsd.toFixed(5)}  cache r/w ${r.usage.cache_read_input_tokens ?? 0}/${r.usage.cache_creation_input_tokens ?? 0}`);
  }
  const n = spec.cases.length;
  console.log(`-- ${MODELS[m]}: ${ok}/${n} correct, ${top3}/${n} in top 3, avg ${Math.round(ms / n)} ms, total $${cost.toFixed(4)}, per pose $${(cost / n).toFixed(5)}`);
}
