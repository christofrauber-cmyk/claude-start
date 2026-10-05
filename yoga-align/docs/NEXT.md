# Next steps (handover, October 2026)

Branch: `claude/sleepy-pasteur-ixqbev`. Live app: GitHub Pages `/claude-start/yoga/` (workflow `.github/workflows/pages.yml`).

## Decided by Christof
- **Option A: automatic pose recognition by a vision model.** One still per hold (front and/or side) goes to the Claude API, which names the pose. No sequence input needed anymore.
- **Global consent:** one-time, revocable. **The app works only with consent** (decided 2026-10-05): no local fallback (option C dropped). Declining stops at the start screen.
- **Commercial use is planned**, so research-only datasets are out.
- **Cost estimate:** Haiku 4.5 ≈ $0.002 per pose, Sonnet 5.5 ≈ $0.006 per pose.

## Done (session 3)
- Auto mode in the app (default on the start screen), consent box + Einstellungen, review screen with one-tap correction, option C fallback, sequence mode unchanged. Tested end-to-end in Chromium on the front test video (local mode and mocked AI).
- Worker in `worker/` (builds with `wrangler deploy --dry-run`), eval script `worker/scripts/eval.ts` with ground truth `worker/eval/cases.json` (17 stills from both test videos).
- Local guessing was measured (5/9 right on the front video) and then removed on Christof's decision.
- Note: the live app now stops at "KI-Erkennung wird eingerichtet" until the Worker is deployed and the repository variable `VITE_CLASSIFY_URL` is set.
- Blocked: no `ANTHROPIC_API_KEY` in the session environment yet, so the eval has not run.

## To do (original list)
1. Run Haiku 4.5 vs Sonnet 5.5 on Christof's two test videos (private repo `christofrauber-cmyk/yoga-testvideos`, see the file names for the pose order). Measure accuracy and real cost per pose. The key comes from env `ANTHROPIC_API_KEY`.
2. Build a small proxy (Cloudflare Worker) that holds the API key. Christof still needs to create a free Cloudflare account; give him step-by-step instructions.
3. App:
   - consent switch in the settings
   - "Ablauf erkennen" flow without a sequence: holds → stills → proxy → pose ids, validated against `POSES`
   - fallback to option C
   - keep the existing sequence mode as an alternative

## Open questions for Christof (expert judgement)
See the end of `docs/review/judge-decisions.md`:
- side convention for Parivrtta Trikonasana
- Parsva Bakasana arms
- depth guidance in Kapotasana
- Ustrasana and Utkata Konasana
- Vasisthasana arm rule

## Known limits
- Full-screen overlay on real videos tested only through the demo script, not on a phone.
- Krieger III from the front: skeleton unreliable.

## Status 2026-10-05 (session 4): what is left is only for Christof
App and Worker typecheck and build (`npm run build`, `wrangler deploy --dry-run`). Nothing more to code for Option A until these steps are done:

1. **Anthropic key** for the eval: set `ANTHROPIC_API_KEY` in the environment, then `cd worker && npx tsx scripts/eval.ts <path to yoga-testvideos>`. Pick Haiku or Sonnet by the measured accuracy and cost, set `MODEL` in `worker/wrangler.toml`.
2. **Cloudflare (free account):**
   1. Sign up at dash.cloudflare.com (email only, no card).
   2. `cd yoga-align/worker && npx wrangler login` (opens the browser, confirm).
   3. `npx wrangler secret put ANTHROPIC_API_KEY` (paste the key).
   4. `npx wrangler deploy`, which prints `https://yoga-pose-classifier.<account>.workers.dev`.
3. **GitHub:** repo Settings, Secrets and variables, Actions, Variables, new `VITE_CLASSIFY_URL` with that URL. Re-run the Pages workflow.
4. Check the `ALLOWED_ORIGIN` in `worker/wrangler.toml` matches the Pages origin.

## Status 2026-10-05 (session 5)
- **Worker deployed** to `https://yoga-pose-classifier.christof-rauber.workers.dev` (Cloudflare account verified, `MODEL = "accurate"`, origins as in `wrangler.toml`). The secret `ANTHROPIC_API_KEY` is **not** set yet, so `/` cannot classify. The sandbox proxy blocks `*.workers.dev`, so the live endpoint was not smoke-tested from here.
- **Eval blocked:** `EVAL_ANTHROPIC_API_KEY` is not scoped to a workspace; the API answers 400 "must include the anthropic-workspace-id header". Needs either a workspace-scoped key (Console, API keys, pick a workspace) or the workspace ID. The same applies to the key for the Worker.
- Test videos cloned from `yoga-testvideos`; ffmpeg is present. Once a usable key exists: `cd worker && npx tsx scripts/eval.ts /home/user/yoga-testvideos`.
- Still open: `npx wrangler secret put ANTHROPIC_API_KEY`, then `VITE_CLASSIFY_URL` (value above) as repository variable and re-run Pages.

## Status 2026-10-05 (session 6): eval done
`EVAL_ANTHROPIC_API_KEY` works now (the workspace header problem is gone). 17 stills from both test videos, one image per call:

| Model | Correct | In top 3 | Latency | Cost per pose (cache warm) |
|---|---|---|---|---|
| Haiku 4.5 | 11/17 (65 %) | 13/17 | ~2.2 s | $0.002 |
| Sonnet 5.5 (effort low) | **16/17 (94 %)** | 17/17 | ~2.1 s | $0.005 |

- **Decision: Sonnet 5.5** (`MODEL = "accurate"` in `wrangler.toml` is already right). Haiku misses the close variants (Virabhadrasana 2, Ardha Uttanasana, Janu Sirsasana front). Price difference is about 0.3 cent per pose, so accuracy wins.
- The only Sonnet miss: side view, Anjaneyasana called Virabhadrasana 1 (the true answer is in its top 3). Front Anjaneyasana: Sonnet said `anjaneyasana_high`, which the case accepts.
- The first call of a session writes the prompt cache and costs ~$0.028 (10k tokens catalogue). After that ~$0.005 as long as calls come within 5 minutes. A 10-pose practice is therefore ~$0.05-0.08.
- Sonnet's confidence is low for correct answers (0.45-0.6 on uttanasana, ardha_uttanasana, janu_sirsasana). Do not use a hard threshold on `confidence` in the review screen; the one-tap correction stays the safety net.
- Fix: the model sometimes lists `unknown` in `alternatives`, which crashed the parse. Schema now allows it and `classifyPose` filters it out.

Still open for Christof: `npx wrangler secret put ANTHROPIC_API_KEY` (a **workspace-scoped** key, not the unscoped eval key), then repo variable `VITE_CLASSIFY_URL` and a Pages re-run.

## Status 2026-10-05 (session 6, later)
Cloudflare secret `ANTHROPIC_API_KEY` is set (Christof confirmed). Next: repository variable `VITE_CLASSIFY_URL`, then a Pages build (push to this branch; the "Run workflow" button does not show because the workflow file is not on the default branch), then the first real end-to-end test in the live app.
