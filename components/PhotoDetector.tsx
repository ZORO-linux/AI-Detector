'use client';

import { useEffect, useRef, useState } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { Actions, Disclaimer, ErrorView, ResultHeader } from './ResultCommon';
import { Spinner, formatBytes } from './ui';
import { UploadError, uploadWithProgress } from './upload';
import { useScanHistory } from './useScanHistory';
import type { ApiError, PhotoAnalysis } from '@/lib/types';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 8;

const TASK_LABEL: Record<string, string> = {
  'ai-generated-image': 'AI-generated image detection',
  'face-manipulation': 'Face-swap / manipulation detection',
};

export function PhotoDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analysing'>('idle');
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useScanHistory();

  useEffect(() => {
    if (!file) {
      setPreview(null);
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
    if (!ACCEPT.includes(next.type)) {
      setFile(null);
      setError({ error: 'Only JPG, JPEG, PNG and WEBP images are supported.', code: 'invalid_input' });
      return;
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      setError({ error: `Image must be ${MAX_MB} MB or smaller. Yours is ${formatBytes(next.size)}.`, code: 'too_large' });
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
      const data = await uploadWithProgress<PhotoAnalysis>('/api/analyze/photo', file, (percent) => {
        setProgress(percent);
        if (percent >= 100) setStatus('analysing');
      });
      setResult(data);
      history.add({
        kind: 'photo',
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">AI Photo Detector</h1>
        <p className="muted mt-2 max-w-2xl">
          Upload an image to run two independent forensics models: one that looks for fully
          AI-generated pictures, and one that looks for face-swap or facial manipulation artefacts.
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
            id="photo-input"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => select(event.target.files?.[0] ?? null)}
          />
          <svg className="mx-auto h-10 w-10 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-3 text-sm text-slate-300">Drag an image here, or</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost mt-3" disabled={busy}>
            Choose image
          </button>
          <p className="mt-3 text-xs text-slate-500">JPG · JPEG · PNG · WEBP · up to {MAX_MB} MB</p>
        </div>

        {file && preview ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-[180px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected upload preview" className="h-44 w-full rounded-xl border border-white/10 object-cover" />
            <div className="space-y-2">
              <p className="break-all text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-400">
                {file.type} · {formatBytes(file.size)}
              </p>
              {busy ? (
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-electric to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                    <Spinner className="h-3 w-3" />
                    {status === 'uploading' ? `Uploading… ${progress}%` : 'Running forensics models…'}
                  </p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" onClick={analyze} disabled={busy} className="btn-primary">
                  {busy ? <Spinner /> : null}
                  {busy ? 'Analysing…' : 'Analyze Image'}
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
            scoreCaption="Manipulation likelihood"
          />

          <section className="glass animate-fadeUp p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Per-model breakdown</h3>
            <p className="muted mt-1">
              These are two different tasks. A synthetic-image score is not the same as a face-swap score.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {result.verdicts.map((verdict) => (
                <div key={verdict.model} className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
                  <p className="text-sm font-semibold text-white">{TASK_LABEL[verdict.task] ?? verdict.task}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{verdict.model}</p>

                  {verdict.available && verdict.manipulationProbability !== null ? (
                    <>
                      <p className="mt-3 text-2xl font-bold text-white">
                        {Math.round(verdict.manipulationProbability * 100)}%
                        <span className="ml-1 text-xs font-normal text-slate-400">manipulated / synthetic</span>
                      </p>
                      <p className="muted mt-2">{verdict.explanation}</p>
                      <ul className="mt-3 space-y-1">
                        {verdict.labels.map((label) => (
                          <li key={label.label} className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-mono">{label.label}</span>
                            <span>{(label.score * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-amber-300">
                      Unavailable — {verdict.error ?? verdict.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
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
