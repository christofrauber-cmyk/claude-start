// Cloudflare Worker: keeps the Anthropic API key off the device and forwards
// one still image (or a front/side pair) per request to the pose classifier.
import Anthropic from '@anthropic-ai/sdk';
import { classifyPose, type ModelKey, type StillImage } from './classify';

interface Env {
  ANTHROPIC_API_KEY: string;
  /** Comma-separated origins allowed to call the Worker, e.g. https://christofrauber-cmyk.github.io */
  ALLOWED_ORIGINS: string;
  /** 'fast' (Haiku) or 'accurate' (Sonnet). */
  MODEL?: string;
  /** Optional Cloudflare rate limiter (see wrangler.toml). */
  RATE_LIMITER?: { limit(o: { key: string }): Promise<{ success: boolean }> };
}

const MAX_IMAGE_B64 = 1_500_000; // ~1.1 MB JPEG

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return origin && allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

function parseImages(body: unknown): StillImage[] | null {
  const list = (body as { images?: unknown })?.images;
  if (!Array.isArray(list) || list.length < 1 || list.length > 2) return null;
  const out: StillImage[] = [];
  for (const i of list) {
    const view = (i as StillImage)?.view, data = (i as StillImage)?.data;
    if ((view !== 'front' && view !== 'side') || typeof data !== 'string' || data.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(data)) return null;
    out.push({ view, data });
  }
  return out;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const headers = cors(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: headers['Access-Control-Allow-Origin'] ? 204 : 403, headers });
    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/classify') return json({ error: 'not_found' }, 404, headers);
    if (!headers['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403, headers);

    if (env.RATE_LIMITER) {
      const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
      if (!(await env.RATE_LIMITER.limit({ key: ip })).success) return json({ error: 'rate_limited' }, 429, headers);
    }

    let images: StillImage[] | null;
    try { images = parseImages(await req.json()); } catch { images = null; }
    if (!images) return json({ error: 'bad_request' }, 400, headers);

    const modelKey: ModelKey = env.MODEL === 'fast' ? 'fast' : 'accurate';
    try {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 30_000 });
      const r = await classifyPose(client, modelKey, images);
      if (!r.answer) return json({ error: 'no_answer' }, 502, headers);
      // The images are not stored anywhere; only the answer goes back.
      return json({ ...r.answer, model: r.model }, 200, headers);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503, headers);
      if (e instanceof Anthropic.APIError) return json({ error: 'upstream', status: e.status }, 502, headers);
      return json({ error: 'internal' }, 500, headers);
    }
  },
};
