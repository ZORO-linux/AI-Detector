function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  llm: {
    apiKey: process.env.LLM_API_KEY ?? '',
    baseUrl: (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
  },
  safeBrowsing: {
    apiKey: process.env.SAFE_BROWSING_API_KEY ?? '',
  },
  hf: {
    token: process.env.HF_API_TOKEN ?? '',
    baseUrl: (process.env.HF_BASE_URL ?? 'https://api-inference.huggingface.co/models').replace(
      /\/+$/,
      '',
    ),
    aiGenModel: process.env.HF_AIGEN_IMAGE_MODEL ?? 'Organika/sdxl-detector',
    deepfakeModel: process.env.HF_DEEPFAKE_IMAGE_MODEL ?? 'prithivMLmods/Deep-Fake-Detector-Model',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
  },
  limits: {
    maxImageBytes: num(process.env.MAX_IMAGE_MB, 8) * 1024 * 1024,
    maxVideoBytes: num(process.env.MAX_VIDEO_MB, 50) * 1024 * 1024,
    maxVideoSeconds: num(process.env.MAX_VIDEO_SECONDS, 60),
    videoFrameCount: Math.min(24, Math.round(num(process.env.VIDEO_FRAME_COUNT, 8))),
    maxMessageChars: 8000,
  },
  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_SECONDS, 60) * 1000,
    max: Math.round(num(process.env.RATE_LIMIT_MAX_REQUESTS, 12)),
  },
};

export const isLlmConfigured = () => config.llm.apiKey.length > 0;
export const isGeminiVisionConfigured = () => config.gemini.apiKey.length > 0;
export const isHfConfigured = () => config.gemini.apiKey.length > 0 || config.hf.token.length > 0;
export const isSafeBrowsingConfigured = () => config.safeBrowsing.apiKey.length > 0;

export function setupHints(target: 'message' | 'photo' | 'video'): string[] {
  if (target === 'message') {
    return [
      'Set LLM_API_KEY in .env.local (OpenAI / Groq / OpenRouter compatible key).',
      'Optionally set LLM_BASE_URL and LLM_MODEL for a non-OpenAI provider.',
      'Optionally set SAFE_BROWSING_API_KEY for Google Safe Browsing link checks.',
    ];
  }
  return [
    'Set GEMINI_API_KEY in .env.local (Free from https://aistudio.google.com/apikey).',
    'Alternatively, set HF_API_TOKEN with prepaid credits.',
    'Restart the dev server after changing environment variables.',
  ];
}

