import type { ReactNode } from 'react';
import type { ApiError, RiskLevel } from '@/lib/types';
import { Alert, RiskBadge, ScoreMeter } from './ui';

export function ResultHeader({
  risk,
  score,
  confidence,
  summary,
  scoreCaption,
  children,
}: {
  risk: RiskLevel;
  score: number;
  confidence: number | null;
  summary: string;
  scoreCaption: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass animate-fadeUp p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Analysis result</h2>
        <RiskBadge risk={risk} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-200">{summary}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ScoreMeter score={score} risk={risk} caption={scoreCaption} />
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">Model confidence</span>
            <span className="text-sm font-semibold text-white">
              {confidence === null ? 'Not reported' : `${Math.round(confidence * 100)}%`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric to-cyan-400 transition-all duration-700"
              style={{ width: `${confidence === null ? 0 : Math.round(confidence * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

export function Actions({ actions }: { actions: string[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="glass animate-fadeUp p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-white">What you should do</h3>
      <ul className="mt-3 space-y-2.5">
        {actions.map((action) => (
          <li key={action} className="flex gap-3 text-sm text-slate-300">
            <svg className="mt-0.5 h-4 w-4 flex-none text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-white/10 bg-navy-900/50 p-4 text-xs leading-relaxed text-slate-400">
      <strong className="text-slate-300">Important:</strong> {text}
    </p>
  );
}

export function ErrorView({ error }: { error: ApiError }) {
  if (error.code === 'setup_required') {
    return (
      <Alert tone="setup" title="Detector setup required">
        <p>{error.error}</p>
        {error.setup && error.setup.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {error.setup.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </Alert>
    );
  }
  if (error.code === 'unauthorized') {
    return (
      <Alert tone="warn" title="Session expired">
        <p>{error.error}</p>
        <a href="/login" className="mt-2 inline-block font-semibold underline">
          Sign in again
        </a>
      </Alert>
    );
  }
  const title =
    error.code === 'rate_limited'
      ? 'Rate limit reached'
      : error.code === 'timeout'
        ? 'Analysis timed out'
        : error.code === 'too_large'
          ? 'File too large'
          : error.code === 'invalid_input'
            ? 'Invalid input'
            : 'Analysis failed';
  return (
    <Alert tone={error.code === 'invalid_input' || error.code === 'too_large' ? 'warn' : 'error'} title={title}>
      {error.error}
    </Alert>
  );
}
