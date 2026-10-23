import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/analyze-message';
import { apiError, describeUpstreamError, enforceRateLimit } from '@/lib/api';
import { config, isLlmConfigured, setupHints } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'message');
  if (limited) return limited;

  if (!isLlmConfigured()) {
    return apiError(
      'setup_required',
      'Detector setup required: no NLP/LLM provider is connected for message analysis.',
      503,
      setupHints('message'),
    );
  }

  let payload: { message?: unknown };
  try {
    payload = await request.json();
  } catch {
    return apiError('invalid_input', 'Request body must be valid JSON.', 400);
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (message.length < 10) {
    return apiError('invalid_input', 'Paste at least 10 characters of the message you want to check.', 400);
  }
  if (message.length > config.limits.maxMessageChars) {
    return apiError(
      'too_large',
      `Message is too long. The limit is ${config.limits.maxMessageChars} characters.`,
      413,
    );
  }

  try {
    const result = await analyzeMessage(message);
    return NextResponse.json(result);
  } catch (error) {
    const { message: detail, status } = describeUpstreamError(error);
    return apiError(status === 504 ? 'timeout' : 'upstream_failed', detail, status);
  }
}
