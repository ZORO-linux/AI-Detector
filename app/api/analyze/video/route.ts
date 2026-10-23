import { NextResponse } from 'next/server';
import ffmpegPath from 'ffmpeg-static';
import { analyzeVideo } from '@/lib/analyze-video';
import { apiError, describeUpstreamError, enforceRateLimit } from '@/lib/api';
import { config, isHfConfigured, setupHints } from '@/lib/config';
import { FfmpegUnavailableError } from '@/lib/video';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ALLOWED = new Map<string, string>([
  ['video/mp4', '.mp4'],
  ['video/quicktime', '.mov'],
  ['video/x-quicktime', '.mov'],
]);

function sniffContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const boxType = String.fromCharCode(...bytes.slice(4, 8));
  return boxType === 'ftyp';
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'video');
  if (limited) return limited;

  if (!isHfConfigured()) {
    return apiError(
      'setup_required',
      'Detector setup required: no deepfake model is connected for video analysis.',
      503,
      setupHints('video'),
    );
  }
  if (!ffmpegPath) {
    return apiError(
      'setup_required',
      'Detector setup required: the FFmpeg binary used for frame extraction is missing.',
      503,
      ['Run `npm install` so ffmpeg-static can download the binary, or set FFMPEG_PATH to a local ffmpeg executable.'],
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
    return apiError('invalid_input', 'No video file was received in the "file" field.', 400);
  }
  if (file.size === 0) {
    return apiError('invalid_input', 'The uploaded file is empty.', 400);
  }
  if (file.size > config.limits.maxVideoBytes) {
    return apiError(
      'too_large',
      `Video is larger than the ${Math.round(config.limits.maxVideoBytes / 1024 / 1024)} MB limit.`,
      413,
    );
  }

  const extension = ALLOWED.get(file.type) ?? (/\.mov$/i.test(file.name) ? '.mov' : /\.mp4$/i.test(file.name) ? '.mp4' : null);
  if (!extension) {
    return apiError('invalid_input', 'Only MP4 and MOV videos are supported.', 415);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffContainer(bytes)) {
    return apiError('invalid_input', 'File content is not a valid MP4/MOV container.', 415);
  }

  try {
    const result = await analyzeVideo(bytes, extension, file.name.slice(0, 120));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FfmpegUnavailableError) {
      return apiError('setup_required', error.message, 503, setupHints('video'));
    }
    const detail = error instanceof Error ? error.message : 'Unexpected error.';
    if (/limit is|no readable video stream|produced no frames/i.test(detail)) {
      return apiError('invalid_input', detail, 400);
    }
    const described = describeUpstreamError(error);
    return apiError(described.status === 504 ? 'timeout' : 'upstream_failed', described.message, described.status);
  }
}
