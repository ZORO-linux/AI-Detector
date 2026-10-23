import { NextResponse } from 'next/server';
import { analyzePhoto } from '@/lib/analyze-photo';
import { apiError, describeUpstreamError, enforceRateLimit } from '@/lib/api';
import { config, isHfConfigured, setupHints } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const ALLOWED = new Map<string, string[]>([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/webp', ['.webp']],
]);

/** Magic-number check so the server does not trust the client-supplied MIME type. */
function sniff(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'photo');
  if (limited) return limited;

  if (!isHfConfigured()) {
    return apiError(
      'setup_required',
      'Detector setup required: no image-forensics model is connected.',
      503,
      setupHints('photo'),
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError('invalid_input', 'Upload must be sent as multipart/form-data.', 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return apiError('invalid_input', 'No image file was received in the "file" field.', 400);
  }
  if (file.size === 0) {
    return apiError('invalid_input', 'The uploaded file is empty.', 400);
  }
  if (file.size > config.limits.maxImageBytes) {
    return apiError(
      'too_large',
      `Image is larger than the ${Math.round(config.limits.maxImageBytes / 1024 / 1024)} MB limit.`,
      413,
    );
  }
  if (!ALLOWED.has(file.type)) {
    return apiError('invalid_input', 'Only JPG, JPEG, PNG and WEBP images are supported.', 415);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniff(bytes);
  if (!sniffed) {
    return apiError('invalid_input', 'File content is not a valid JPG, PNG or WEBP image.', 415);
  }

  try {
    const result = await analyzePhoto(bytes, sniffed, file.name.slice(0, 120));
    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = describeUpstreamError(error);
    return apiError(status === 504 ? 'timeout' : 'upstream_failed', message, status);
  }
}
