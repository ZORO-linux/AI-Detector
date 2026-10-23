import { NextResponse } from 'next/server';
import { config, isHfConfigured, isLlmConfigured, isSafeBrowsingConfigured } from '@/lib/config';
import { usingDevSecret } from '@/lib/session';
import ffmpegPath from 'ffmpeg-static';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const detectors = {
    message: {
      ready: isLlmConfigured(),
      requires: ['LLM_API_KEY'],
      optional: ['SAFE_BROWSING_API_KEY', 'LLM_BASE_URL', 'LLM_MODEL'],
      model: isLlmConfigured() ? config.llm.model : null,
    },
    photo: {
      ready: isHfConfigured(),
      requires: ['GEMINI_API_KEY (or HF_API_TOKEN)'],
      provider: config.gemini.apiKey ? 'Google Gemini 3.5 Flash Vision' : 'Hugging Face',
      models: config.gemini.apiKey ? ['gemini-3.5-flash'] : (isHfConfigured() ? [config.hf.aiGenModel, config.hf.deepfakeModel] : []),
    },
    video: {
      ready: isHfConfigured() && Boolean(ffmpegPath),
      requires: ['GEMINI_API_KEY (or HF_API_TOKEN)', 'ffmpeg binary'],
      provider: config.gemini.apiKey ? 'Google Gemini 3.5 Flash Vision' : 'Hugging Face',
      ffmpeg: Boolean(ffmpegPath),
      models: config.gemini.apiKey ? ['gemini-3.5-flash'] : (isHfConfigured() ? [config.hf.deepfakeModel] : []),
    },
  };

  const ready = Object.values(detectors).every((d) => d.ready);

  return NextResponse.json({
    status: ready ? 'ok' : 'setup_required',
    service: 'ai-scam-shield',
    version: '1.0.0',
    time: new Date().toISOString(),
    detectors,
    integrations: {
      llm: isLlmConfigured(),
      vision: isHfConfigured(),
      geminiVision: Boolean(config.gemini.apiKey),
      huggingface: Boolean(config.hf.token),
      safeBrowsing: isSafeBrowsingConfigured(),
    },

    auth: {
      mode: 'local-file-store',
      protectedRoutes: ['/message-detector', '/photo-detector', '/video-detector', '/api/analyze/*'],
      authSecretConfigured: !usingDevSecret(),
    },
    limits: {
      maxImageMB: Math.round(config.limits.maxImageBytes / 1024 / 1024),
      maxVideoMB: Math.round(config.limits.maxVideoBytes / 1024 / 1024),
      maxVideoSeconds: config.limits.maxVideoSeconds,
      videoFrameCount: config.limits.videoFrameCount,
      maxMessageChars: config.limits.maxMessageChars,
      rateLimit: `${config.rateLimit.max} requests / ${config.rateLimit.windowMs / 1000}s per IP`,
    },
  });
}
