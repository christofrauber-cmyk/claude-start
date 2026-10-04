# Pose classifier (Cloudflare Worker)

Small server for the optional AI pose recognition. The app sends one still image (JPEG, max. 1024 px) per hold; the Worker asks a Claude vision model which of the 100 poses it shows and returns only the answer. The API key stays here, nothing is stored.

- `src/classify.ts`: prompt, pose catalogue (from `../src/data/poses.ts`), answer schema. Shared with the eval script.
- `src/index.ts`: HTTP endpoint `POST /classify`, origin check, rate limit (30/min per IP), size limit.
- `MODEL` in `wrangler.toml`: `accurate` = Claude Sonnet 5.5, `fast` = Claude Haiku 4.5.

## Test Haiku vs Sonnet on the test videos
```
npm install
ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/eval.ts /path/to/yoga-testvideos
```
Ground truth: `eval/cases.json` (17 stills). Prints accuracy, top-3 hits, latency and the real cost per pose.

## Deploy (once)
```
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```
Then build the app with `VITE_CLASSIFY_URL=https://yoga-pose-classifier.<account>.workers.dev` (GitHub: repository variable `VITE_CLASSIFY_URL`, used by `.github/workflows/pages.yml`). Without that variable the app offers no AI and stays fully local.
