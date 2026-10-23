import { config } from './config';
import { classifyImage, manipulationProbability } from './huggingface';
import type { FrameResult, RiskLevel, VideoAnalysis } from './types';
import { extractFrames } from './video';

const DISCLAIMER =
  'Frame-level deepfake detection is probabilistic and degrades with compression, low resolution and heavy editing. Use this as a triage signal, never as proof of authenticity or forgery.';

function level(score: number): RiskLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function analyzeVideo(
  bytes: Uint8Array,
  extension: string,
  fileName: string,
): Promise<VideoAnalysis> {
  const { duration, frames } = await extractFrames(
    bytes,
    extension,
    config.limits.videoFrameCount,
    config.limits.maxVideoSeconds,
  );

  const model = config.hf.deepfakeModel;

  const analyzed = await mapWithConcurrency(frames, 3, async (frame): Promise<FrameResult | null> => {
    try {
      const labels = await classifyImage(model, frame.bytes, 'image/jpeg');
      const probability = manipulationProbability(labels);
      if (probability === null) return null;
      return {
        index: frame.index,
        timestamp: frame.timestamp,
        manipulationProbability: Number(probability.toFixed(4)),
        topLabel: labels[0]?.label ?? null,
      };
    } catch {
      return null;
    }
  });

  const usable = analyzed.filter((f): f is FrameResult => f !== null);
  if (usable.length === 0) {
    throw new Error(
      `The deepfake model (${model}) did not return a usable result for any extracted frame. Check HF_API_TOKEN and the model name.`,
    );
  }

  const sorted = [...usable].sort((a, b) => b.manipulationProbability - a.manipulationProbability);
  const mean = usable.reduce((sum, f) => sum + f.manipulationProbability, 0) / usable.length;
  // Top-k mean: localized manipulation should not be diluted by clean frames.
  const topK = sorted.slice(0, Math.max(1, Math.ceil(usable.length * 0.3)));
  const topMean = topK.reduce((sum, f) => sum + f.manipulationProbability, 0) / topK.length;
  const combined = mean * 0.45 + topMean * 0.55;
  const score = Math.round(combined * 100);

  const suspicious = usable.filter((f) => f.manipulationProbability >= 0.6).map((f) => f.timestamp);
  const coverage = usable.length / Math.max(1, frames.length);
  const confidence = Number((Math.min(1, coverage) * (0.5 + Math.abs(combined - 0.5))).toFixed(2));

  const summary =
    score >= 70
      ? `${suspicious.length} of ${usable.length} analysed frames show strong manipulation artefacts.`
      : score >= 40
        ? 'Frame scores are mixed. Some frames look manipulated while others do not - manual review is recommended.'
        : 'No consistent manipulation artefacts were found across the sampled frames. This does not certify the video as authentic.';

  return {
    kind: 'video',
    risk: level(score),
    score,
    confidence,
    summary,
    model,
    framesAnalyzed: usable.length,
    durationSeconds: duration,
    frames: usable.sort((a, b) => a.index - b.index),
    suspiciousTimestamps: suspicious.sort((a, b) => a - b),
    fileName,
    fileSize: bytes.byteLength,
    recommendedActions: [
      'Look for the original upload from a verified account or newsroom before believing or resharing.',
      'Check lip-sync, blinking, hairline edges and neck/jaw boundaries at the flagged timestamps.',
      'Never approve payments or share credentials based on a video or voice call alone - call back on a known number.',
      'Report impersonation videos to the hosting platform and your local cybercrime unit.',
    ],
    disclaimer: DISCLAIMER,
    createdAt: new Date().toISOString(),
  };
}
