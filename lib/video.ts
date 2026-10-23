import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';

export class FfmpegUnavailableError extends Error {}

function resolveFfmpeg(): string {
  const bin = (ffmpegPath as unknown as string | null) ?? process.env.FFMPEG_PATH ?? null;
  if (!bin) {
    throw new FfmpegUnavailableError(
      'FFmpeg binary not found. Reinstall dependencies (npm install) or set FFMPEG_PATH to a local ffmpeg executable.',
    );
  }
  return bin;
}

function run(args: string[], timeoutMs: number): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveFfmpeg(), args, { windowsHide: true });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('FFmpeg processing timed out.'));
    }, timeoutMs);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (stderr.length > 200_000) stderr = stderr.slice(-100_000);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stderr });
    });
  });
}

function parseDuration(stderr: string): number | null {
  const match = /Duration:\s*(\d+):(\d{2}):(\d{2})\.(\d{1,2})/.exec(stderr);
  if (!match) return null;
  const [, h, m, s, cs] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(cs) / 100;
}

export interface ExtractedFrame {
  index: number;
  timestamp: number;
  bytes: Uint8Array;
}

export interface ExtractionResult {
  duration: number | null;
  frames: ExtractedFrame[];
}

export async function extractFrames(
  video: Uint8Array,
  extension: string,
  frameCount: number,
  maxDurationSeconds: number,
): Promise<ExtractionResult> {
  const dir = await mkdtemp(path.join(tmpdir(), 'scamshield-'));
  const input = path.join(dir, `input${extension}`);
  const pattern = path.join(dir, 'frame_%03d.jpg');

  try {
    await writeFile(input, video);

    const probe = await run(['-hide_banner', '-i', input], 20_000);
    const duration = parseDuration(probe.stderr);

    if (duration !== null && duration > maxDurationSeconds) {
      throw new Error(
        `Video is ${duration.toFixed(1)}s long. The configured limit is ${maxDurationSeconds}s - trim the clip and try again.`,
      );
    }
    if (duration === null && !/Stream #\d+:\d+.*Video:/.test(probe.stderr)) {
      throw new Error('No readable video stream was found in this file.');
    }

    const effective = duration ?? maxDurationSeconds;
    const fps = Math.max(0.1, Math.min(4, frameCount / Math.max(1, effective)));

    const extraction = await run(
      [
        '-hide_banner',
        '-loglevel', 'error',
        '-i', input,
        '-vf', `fps=${fps.toFixed(4)},scale='min(720,iw)':-2`,
        '-frames:v', String(frameCount),
        '-q:v', '3',
        '-y',
        pattern,
      ],
      120_000,
    );

    if (extraction.code !== 0) {
      throw new Error(`Frame extraction failed: ${extraction.stderr.slice(0, 300) || 'unknown ffmpeg error'}`);
    }

    const files = (await readdir(dir)).filter((f) => f.startsWith('frame_')).sort();
    if (files.length === 0) {
      throw new Error('FFmpeg produced no frames from this video.');
    }

    const frames: ExtractedFrame[] = [];
    for (let i = 0; i < files.length; i += 1) {
      const bytes = await readFile(path.join(dir, files[i]));
      frames.push({
        index: i,
        timestamp: Number((i / fps).toFixed(2)),
        bytes: new Uint8Array(bytes),
      });
    }

    return { duration, frames };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
