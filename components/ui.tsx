import type { ReactNode } from 'react';
import type { RiskLevel } from '@/lib/types';

const RISK_STYLE: Record<RiskLevel, { ring: string; text: string; bg: string; label: string }> = {
  low: { ring: 'ring-emerald-400/40', text: 'text-emerald-300', bg: 'bg-emerald-400/10', label: 'Low Risk' },
  medium: { ring: 'ring-amber-400/40', text: 'text-amber-300', bg: 'bg-amber-400/10', label: 'Medium Risk' },
  high: { ring: 'ring-rose-500/40', text: 'text-rose-300', bg: 'bg-rose-500/10', label: 'High Risk' },
  unknown: { ring: 'ring-slate-400/30', text: 'text-slate-300', bg: 'bg-slate-400/10', label: 'Unknown' },
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const style = RISK_STYLE[risk];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ${style.bg} ${style.text} ${style.ring}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full ${style.bg} animate-pulseRing`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${style.text.replace('text', 'bg')}`} />
      </span>
      {style.label}
    </span>
  );
}

export function ScoreMeter({ score, risk, caption }: { score: number; risk: RiskLevel; caption: string }) {
  const color =
    risk === 'high' ? 'from-rose-500 to-rose-400' : risk === 'medium' ? 'from-amber-500 to-amber-300' : 'from-emerald-500 to-emerald-300';
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-400">{caption}</span>
        <span className="text-sm font-semibold text-white">{score}/100</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={caption}
      >
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: 'error' | 'warn' | 'info' | 'setup';
  title: string;
  children?: ReactNode;
}) {
  const styles = {
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    info: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100',
    setup: 'border-electric/40 bg-electric/10 text-blue-100',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-2 text-sm opacity-90">{children}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass p-5 sm:p-6 ${className}`}>
      {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
      {subtitle ? <p className="muted mt-1">{subtitle}</p> : null}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
