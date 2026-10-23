import { config, isHfConfigured } from './config';
import type { LabelScore } from './types';

const FAKE_LABELS = [
  'artificial', 'ai', 'ai-generated', 'aigenerated', 'fake', 'deepfake', 'deep-fake',
  'manipulated', 'spoof', 'synthetic', 'generated', 'computer-generated', 'gan', 'edited',
];

const REAL_LABELS = ['human', 'real', 'realism', 'authentic', 'genuine', 'natural', 'live', 'original'];

function normalize(label: string): string {
  return label.toLowerCase().replace(/[^a-z]/g, '');
}

export function classifyLabelSide(label: string): 'fake' | 'real' | 'unknown' {
  const n = normalize(label);
  if (FAKE_LABELS.some((l) => n === normalize(l) || n.includes(normalize(l)))) return 'fake';
  if (REAL_LABELS.some((l) => n === normalize(l) || n.includes(normalize(l)))) return 'real';
  return 'unknown';
}

/**
 * Converts a label distribution into a single "this is manipulated/synthetic" probability.
 * Returns null when the model's label vocabulary cannot be interpreted.
 */
export function manipulationProbability(labels: LabelScore[]): number | null {
  let fake = 0;
  let real = 0;
  let matched = false;
  for (const item of labels) {
    const side = classifyLabelSide(item.label);
    if (side === 'fake') {
      fake += item.score;
      matched = true;
    } else if (side === 'real') {
      real += item.score;
      matched = true;
    }
  }
  if (!matched) return null;
  const total = fake + real;
  if (total <= 0) return null;
  return fake / total;
}

export class HfError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function classifyImageWithGemini(
  model: string,
  bytes: Uint8Array,
  mime: string,
): Promise<LabelScore[]> {
  const base64Data = Buffer.from(bytes).toString('base64');
  let cleanMime = 'image/jpeg';
  if (mime.includes('png')) cleanMime = 'image/png';
  else if (mime.includes('webp')) cleanMime = 'image/webp';

  const isDeepfakeTask = model.toLowerCase().includes('deep-fake') || model.toLowerCase().includes('face');
  const taskFocus = isDeepfakeTask
    ? 'deepfake facial manipulation, face swap boundaries, warping around eyes/mouth, or unnatural facial blending'
    : 'synthetic AI generation (DALL-E, Midjourney, Stable Diffusion, Flux, Imagen), unnatural skin smoothing, hyper-smooth textures, background distortions, or anatomy defects';

  const prompt = `You are an expert digital forensics examiner.
Task: Analyze this image carefully for signs of ${taskFocus}.
Respond ONLY with a JSON object following this exact schema:
{
  "fake_probability": <number from 0.0 to 1.0 representing how likely the image is AI-generated or manipulated>,
  "real_probability": <number from 0.0 to 1.0 representing how likely the image is an untouched, real photograph>,
  "reason": "<one concise sentence explaining your visual observation>"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${config.gemini.apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: cleanMime, data: base64Data } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new HfError(`Gemini Vision error (${res.status}): ${errText.slice(0, 200)}`, res.status);
  }

  const data = (await res.json()) as any;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new HfError('Gemini Vision did not return an analysis.', 502);

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new HfError('Failed to parse Gemini Vision analysis result.', 502);
  }

  const fake =
    typeof parsed.fake_probability === 'number'
      ? Math.max(0, Math.min(1, parsed.fake_probability))
      : 0.5;
  const real =
    typeof parsed.real_probability === 'number'
      ? Math.max(0, Math.min(1, parsed.real_probability))
      : 1 - fake;

  if (fake >= real) {
    return [
      { label: 'fake', score: fake },
      { label: 'real', score: real },
    ];
  }

  return [
    { label: 'real', score: real },
    { label: 'fake', score: fake },
  ];
}

export async function classifyImage(model: string, bytes: Uint8Array, mime: string): Promise<LabelScore[]> {
  if (config.gemini.apiKey) {
    return classifyImageWithGemini(model, bytes, mime);
  }

  if (!isHfConfigured()) {
    throw new HfError('No vision provider configured. Set GEMINI_API_KEY in .env.local.', 0);
  }

  const url = `${config.hf.baseUrl}/${model}`;
  const body = new Uint8Array(bytes).slice().buffer as ArrayBuffer;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.hf.token}`,
        'content-type': mime,
        'x-wait-for-model': 'true',
        accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });

    if (response.status === 503 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 4000 * (attempt + 1)));
      continue;
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new HfError(
        `Inference API returned ${response.status} for ${model}. ${detail.slice(0, 200)}`.trim(),
        response.status,
      );
    }

    const data = (await response.json()) as unknown;
    const flat = Array.isArray(data) && Array.isArray(data[0]) ? (data[0] as unknown[]) : (data as unknown[]);
    if (!Array.isArray(flat)) {
      throw new HfError(`Unexpected response shape from ${model}.`, 502);
    }

    return flat
      .filter((item): item is { label: string; score: number } =>
        Boolean(item) && typeof (item as any).label === 'string' && typeof (item as any).score === 'number',
      )
      .map((item) => ({ label: item.label, score: item.score }))
      .sort((a, b) => b.score - a.score);
  }

  throw new HfError(`Model ${model} is still loading on the inference provider. Try again shortly.`, 503);
}

