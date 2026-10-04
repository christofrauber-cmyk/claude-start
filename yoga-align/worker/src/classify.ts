// Pose recognition with a Claude vision model. Shared by the Worker and the
// evaluation script, so both send exactly the same prompt.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { POSES } from '../../src/data/poses';

export const MODELS = {
  fast: 'claude-haiku-4-5',
  accurate: 'claude-sonnet-5-5',
} as const;
export type ModelKey = keyof typeof MODELS;

/** USD per million tokens: input, output, cache read, cache write (5 min). */
export const PRICES: Record<string, [number, number, number, number]> = {
  'claude-haiku-4-5': [1, 5, 0.1, 1.25],
  'claude-sonnet-5-5': [2, 10, 0.2, 2.5],
};

const POSE_IDS = POSES.map((p) => p.id) as [string, ...string[]];

/** The answer the model must give. Side is not asked: the app detects it from the landmarks. */
export const Answer = z.object({
  person_visible: z.boolean().describe('Is one person clearly visible, most of the body in the image?'),
  pose_id: z.enum([...POSE_IDS, 'unknown'] as [string, ...string[]]),
  confidence: z.number().describe('0..1, how sure you are that pose_id is right'),
  alternatives: z.array(z.object({ pose_id: z.enum(POSE_IDS), confidence: z.number() }))
    .describe('Up to 3 other plausible poses, most likely first'),
});
export type Answer = z.infer<typeof Answer>;

// Stable text: identical bytes on every request, so it can be cached.
const CATALOGUE = POSES.map((p) =>
  `${p.id} | ${p.sanskrit} | ${p.nameEn} | ${p.nameDe}${p.limits ? ` | note: ${p.limits}` : ''}`).join('\n');

export const SYSTEM = `You recognise yoga poses in still images taken from a practice video.

The camera stands at the short front edge of the yoga mat ("front" view, looking along the mat) or at its long edge ("side" view, looking across the mat). The person holds a pose; the image is the middle of that hold.

Pick the single pose from the catalogue below that the person is in. Rules:
- Answer only with ids from the catalogue. Use "unknown" if the person is in transition, resting in a pose that is not listed, or not visible.
- Judge by the body shape: which joints are bent, what touches the floor, where the arms are, how the trunk is oriented. Ignore clothing, room and image quality.
- Close variants matter. Examples: knee of the back leg on the floor (anjaneyasana) or lifted (anjaneyasana_high); arms overhead with hips square (virabhadrasana_1) or arms out to the sides with hips open (virabhadrasana_2); fully folded (uttanasana) or back flat and half lifted (ardha_uttanasana).
- confidence is your honest probability that pose_id is right. Below 0.6, list the competing poses in alternatives.

Catalogue (id | Sanskrit | English | German | note):
${CATALOGUE}`;

export interface StillImage {
  view: 'front' | 'side';
  /** Base64 JPEG without data: prefix. */
  data: string;
}

export interface ClassifyResult {
  answer: Answer | null;
  model: string;
  /** null when the model refused or the answer could not be parsed. */
  stop: string | null;
  usage: Anthropic.Usage;
  costUsd: number;
}

export function costOf(model: string, u: Anthropic.Usage): number {
  const p = PRICES[model];
  if (!p) return 0;
  return (u.input_tokens * p[0] + u.output_tokens * p[1]
    + (u.cache_read_input_tokens ?? 0) * p[2] + (u.cache_creation_input_tokens ?? 0) * p[3]) / 1e6;
}

export async function classifyPose(client: Anthropic, modelKey: ModelKey, images: StillImage[]): Promise<ClassifyResult> {
  const model = MODELS[modelKey];
  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of images) {
    content.push({ type: 'text', text: `${img.view} view:` });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img.data } });
  }
  content.push({ type: 'text', text: images.length > 1 ? 'Both images show the same moment. Which pose is it?' : 'Which pose is it?' });

  const res = await client.messages.parse({
    model,
    max_tokens: 2000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    // Sonnet thinks by default; a short look is enough for this task.
    ...(modelKey === 'accurate' ? { output_config: { effort: 'low' as const, format: zodOutputFormat(Answer) } } : { output_config: { format: zodOutputFormat(Answer) } }),
    messages: [{ role: 'user', content }],
  });
  return {
    answer: res.stop_reason === 'refusal' ? null : res.parsed_output ?? null,
    model,
    stop: res.stop_reason,
    usage: res.usage,
    costUsd: costOf(model, res.usage),
  };
}
