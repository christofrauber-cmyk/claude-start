# Next steps (handover, October 2026)

Branch: `claude/sleepy-pasteur-ixqbev`. Live app: GitHub Pages `/claude-start/yoga/` (workflow `.github/workflows/pages.yml`).

## Decided by Christof
- **Option A: automatic pose recognition by a vision model.** One still per hold (front and/or side) goes to the Claude API, which names the pose. No sequence input needed anymore.
- **Global consent:** a one-time switch in the settings, revocable. Users who decline get option C: the app shows its top-3 guesses per hold (`poseFit` in `src/core/match.ts`) and the user confirms with one tap.
- **Commercial use is planned**, so research-only datasets are out.
- **Cost estimate:** Haiku 4.5 ≈ $0.002 per pose, Sonnet 5.5 ≈ $0.006 per pose.

## To do
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
