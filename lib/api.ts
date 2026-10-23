import { NextResponse } from 'next/server';
import type { ApiError } from './types';
import { clientKey, rateLimit } from './rate-limit';

export function apiError(
  code: ApiError['code'],
  message: string,
  status: number,
  setup?: string[],
): NextResponse<ApiError> {
  return NextResponse.json({ error: message, code, setup }, { status });
}

export function enforceRateLimit(request: Request, scope: string): NextResponse<ApiError> | null {
  const result = rateLimit(clientKey(request, scope));
  if (result.ok) return null;
  const response = apiError(
    'rate_limited',
    `Too many requests. Try again in ${result.retryAfter} second(s).`,
    429,
  );
  response.headers.set('retry-after', String(result.retryAfter));
  return response;
}

export function describeUpstreamError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  if (/timed out|timeout|AbortError/i.test(message)) {
    return { message: 'The analysis service took too long to respond. Try again with a smaller input.', status: 504 };
  }
  return { message, status: 502 };
}
