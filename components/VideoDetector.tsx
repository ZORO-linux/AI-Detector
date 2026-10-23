'use client';

import { useEffect, useRef, useState } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { Actions, Disclaimer, ErrorView, ResultHeader } from './ResultCommon';
import { Spinner, formatBytes } from './ui';
import { UploadError, uploadWithProgress } from './upload';
import { useScanHistory } from './useScanHistory';
import type { ApiError, VideoAnalysis } from '@/lib/types';

const MAX_MB = 50;
const MAX_SECONDS = 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export function VideoDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analysing'>('idle');
  const [result, setResult] = useState<VideoAnalysis | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useScanHistory();

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setDuration(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function select(next: File | null) {
    setResult(null);
    setError(null);
    setProgress(0);
    if (!next) {
      setFile(null);
      return;
    }
    const okType = next.type === 'video/mp4' || next.type.includes('quicktime') || /\.(mp4|mov)$/i.test(next.name);
    if (!okType) {
      setFile(null);
      setError({ error: 'Only MP4 and MOV videos are supported.', code: 'invalid_input' });
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      setError({ error: `Video must be ${MAX_MB} MB or smaller. Yours is ${formatBytes(next.size)}.`, code: 'too_large' });
      return;
    }
    setFile(next);
  }

  async function analyze() {
    if (!file) return;
    setStatus('uploading');
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const data = await uploadWithProgress<VideoAnalysis>('/api/analyze/video', file, (percent) => {
        setProgress(percent);
        if (percent >= 100) setStatus('analysing');
      });
      setResult(data);
      history.add({
        kind: 'video',
        label: data.fileName,
        risk: data.risk,
        score: data.score,
        summary: data.summary,
        createdAt: data.createdAt,
      });
    } catch (err) {
      setError(err instanceof UploadError ? err.payload : { error: 'Upload failed.', code: 'server_error' });
    } finally {
      setStatus('idle');
    }
  }

  const busy = status !== 'idle';
  const tooLong = duration !== null && duration > MAX_SECONDS;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Deepfake Video Detector</h1>
        <p className="muted mt-2 max-w-2xl">
          Upload a short MP4 or MOV clip. The server extracts evenly spaced frames with FFmpeg,
          scores each frame with a deepfake model and returns an aggregated verdict plus the
          timestamps that look most suspicious.
        </p>
      </header>

      <section className="glass p-5 sm:p-6">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            select(event.dataTransfer.files?.[0] ?? null);
          }}
          className="rounded-2xl border-2 border-dashed border-white/15 p-8 text-center transition hover:border-cyan-400/40"
        >
          <input
            ref={inputRef}
            id="video-input"
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime"
            className="sr-only"
            onChange={(event) => select(event.target.files?.[0] ?? null)}
          />
          <svg className="mx-auto h-10 w-10 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 6h11v12H4zM15 10l5-3v10l-5-3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-sm text-slate-300">Drag a video here, or</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost mt-3" disabled={busy}>
            Choose video
          </button>
          <p className="mt-3 text-xs text-slate-500">MP4 · MOV · up to {MAX_MB} MB · max {MAX_SECONDS}s</p>
        </div>

        {file && preview ? (
          <div className="mt-6 grid gap-5 md:grid-cols-[260px_1fr]">
            <video
              src={preview}
              controls
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              className="w-full rounded-xl border border-white/10 bg-black"
            />
            <div className="space-y-2">
              <p className="break-all text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-400">
                {file.type || 'video'} · {formatBytes(file.size)}
                {duration !== null ? ` · ${duration.toFixed(1)}s` : ''}
              </p>
              {tooLong ? (
                <p className="text-xs text-amber-300">
                  This clip is longer than {MAX_SECONDS}s. The server will reject it — trim it first.
                </p>
              ) : null}
              {busy ? (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-electric to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                    <Spinner className="h-3 w-3" />
                    {status === 'uploading'
                      ? `Uploading… ${progress}%`
                      : 'Extracting frames and scoring them — this can take a minute.'}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" onClick={analyze} disabled={busy || tooLong} className="btn-primary">
                  {busy ? <Spinner /> : null}
                  {busy ? 'Analysing…' : 'Analyze Video'}
                </button>
                <button type="button" onClick={() => select(null)} disabled={busy} className="btn-ghost">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <ErrorView error={error} /> : null}

      {result ? (
        <div className="space-y-6">
          <ResultHeader
            risk={result.risk}
            score={result.score}
            confidence={result.confidence}
            summary={result.summary}
            scoreCaption="Deepfake likelihood"
          >
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Frames analysed', String(result.framesAnalyzed)],
                ['Duration', result.durationSeconds ? `${result.durationSeconds.toFixed(1)}s` : 'Unknown'],
                ['Suspicious frames', String(result.suspiciousTimestamps.length)],
                ['File size', formatBytes(result.fileSize)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-navy-900/50 p-3">
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 break-all font-mono text-[11px] text-slate-500">Model: {result.model}</p>
          </ResultHeader>

          <section className="glass animate-fadeUp p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Frame timeline</h3>
            <p className="muted mt-1">Each bar is one sampled frame. Taller and redder means more manipulation signal.</p>
            <div className="mt-5 flex h-36 items-end gap-1.5">
              {result.frames.map((frame) => {
                const pct = Math.round(frame.manipulationProbability * 100);
                const color = pct >= 60 ? 'bg-rose-500' : pct >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
                return (
                  <div key={frame.index} className="group relative flex flex-1 flex-col justify-end" title={`${formatTime(frame.timestamp)} — ${pct}%`}>
                    <div className={`${color} rounded-t transition-all`} style={{ height: `${Math.max(4, pct)}%` }} />
                    <span className="mt-1 truncate text-center text-[9px] text-slate-500">{frame.timestamp.toFixed(1)}s</span>
                  </div>
                );
              })}
            </div>

            {result.suspiciousTimestamps.length > 0 ? (
              <div className="mt-5">
                <p className="text-sm font-semibold text-white">Suspicious timestamps</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.suspiciousTimestamps.map((timestamp) => (
                    <span key={timestamp} className="chip border-rose-500/30 text-rose-300">
                      {formatTime(timestamp)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="muted mt-5">No individual frame crossed the suspicious threshold (60%).</p>
            )}
          </section>

          <Actions actions={result.recommendedActions} />
          <Disclaimer text={result.disclaimer} />
        </div>
      ) : null}

      <HistoryPanel
        consent={history.consent}
        setConsent={history.setConsent}
        items={history.items}
        clear={history.clear}
        remove={history.remove}
      />
    </div>
  );
}
