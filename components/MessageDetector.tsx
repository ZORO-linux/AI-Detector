'use client';

import { useState } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { Actions, Disclaimer, ErrorView, ResultHeader } from './ResultCommon';
import { Alert, Spinner } from './ui';
import { useScanHistory } from './useScanHistory';
import type { ApiError, MessageAnalysis, RiskIndicator } from '@/lib/types';

const SEVERITY_STYLE: Record<RiskIndicator['severity'], string> = {
  danger: 'border-rose-500/30 bg-rose-500/5',
  warn: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-white/10 bg-white/[0.03]',
};

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Bank KYC phishing',
    text:
      'Dear Customer, your bank account will be BLOCKED today due to incomplete KYC. Update immediately at http://sbi-kyc-verify.top/login and share the OTP sent to your number with our executive. - SBI Support',
  },
  {
    label: 'Fake job offer',
    text:
      'Congratulations! You are selected for a part-time work from home job. Earn Rs 3000 daily, no experience required. Pay a refundable registration fee of Rs 499 and message me on Telegram t.me/hr_jobs_fast to start today.',
  },
  {
    label: 'Ordinary message',
    text:
      'Hi, this is Priya from the dentist clinic. Your appointment is confirmed for Thursday at 4 pm. Reply if you need to reschedule.',
  },
];

export function MessageDetector() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MessageAnalysis | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const history = useScanHistory();

  const tooShort = text.trim().length < 10;

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/analyze/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data as ApiError);
        return;
      }
      const analysis = data as MessageAnalysis;
      setResult(analysis);
      history.add({
        kind: 'message',
        label: `${text.trim().slice(0, 50)}${text.trim().length > 50 ? '…' : ''}`,
        risk: analysis.risk,
        score: analysis.score,
        summary: analysis.summary,
        createdAt: analysis.createdAt,
      });
    } catch {
      setError({ error: 'Could not reach the analysis API. Check your connection and try again.', code: 'server_error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Scam Message Detector</h1>
        <p className="muted mt-2 max-w-2xl">
          Paste an SMS, WhatsApp message, email, job offer or suspicious link. The text is analysed
          server-side by an LLM classifier, a deterministic fraud-pattern engine and (when
          configured) Google Safe Browsing.
        </p>
      </header>

      <section className="glass p-5 sm:p-6">
        <label className="label" htmlFor="message-input">
          Message to analyse
        </label>
        <textarea
          id="message-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={9}
          maxLength={8000}
          className="input font-mono"
          placeholder="Paste the full message here, including any links…"
          aria-describedby="message-help"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p id="message-help" className="text-xs text-slate-500">
            {text.length}/8000 characters. Remove your own personal data before pasting.
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => setText(sample.text)}
                className="chip hover:border-cyan-400/40 hover:text-cyan-300"
              >
                Try: {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={analyze} disabled={loading || tooShort} className="btn-primary">
            {loading ? <Spinner /> : null}
            {loading ? 'Analysing…' : 'Analyze Message'}
          </button>
          <button
            type="button"
            onClick={() => {
              setText('');
              setResult(null);
              setError(null);
            }}
            disabled={loading}
            className="btn-ghost"
          >
            Clear
          </button>
        </div>

        {tooShort && text.length > 0 ? (
          <p className="mt-3 text-xs text-amber-300">Paste at least 10 characters to run an analysis.</p>
        ) : null}
      </section>

      {loading ? (
        <div className="glass p-5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 scan-line animate-shimmer rounded-full" />
          </div>
          <p className="muted mt-3">Running classifier, pattern engine and link reputation checks…</p>
        </div>
      ) : null}

      {error ? <ErrorView error={error} /> : null}

      {result ? (
        <div className="space-y-6">
          <ResultHeader
            risk={result.risk}
            score={result.score}
            confidence={result.confidence}
            summary={result.summary}
            scoreCaption="Scam risk score"
          />

          <section className="glass animate-fadeUp p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Risk indicators</h3>
            {result.indicators.length === 0 ? (
              <Alert tone="info" title="No specific indicator matched">
                The absence of known scam patterns is not proof that the message is genuine. Verify the
                sender independently before acting.
              </Alert>
            ) : (
              <ul className="mt-4 space-y-3">
                {result.indicators.map((indicator) => (
                  <li key={indicator.label} className={`rounded-xl border p-4 ${SEVERITY_STYLE[indicator.severity]}`}>
                    <p className="text-sm font-semibold text-white">{indicator.label}</p>
                    <p className="muted mt-1">{indicator.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {result.urls.length > 0 ? (
            <section className="glass animate-fadeUp p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-white">Links found ({result.urls.length})</h3>
              <ul className="mt-4 space-y-3">
                {result.urls.map((url) => (
                  <li key={url.url} className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs text-slate-300">{url.url}</span>
                      <span
                        className={`chip ${
                          url.verdict === 'malicious'
                            ? 'border-rose-500/40 text-rose-300'
                            : url.verdict === 'clean'
                              ? 'border-emerald-400/30 text-emerald-300'
                              : 'border-amber-400/30 text-amber-300'
                        }`}
                      >
                        {url.verdict === 'malicious'
                          ? `Flagged: ${url.threatTypes.join(', ')}`
                          : url.verdict === 'clean'
                            ? 'No threat-intel match'
                            : 'Not reputation-checked'}
                      </span>
                    </div>
                    {url.notes.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-400">
                        {url.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-amber-300">
                Links are shown as plain text on purpose — they are not clickable here.
              </p>
            </section>
          ) : null}

          <Actions actions={result.recommendedActions} />

          <section className="glass animate-fadeUp p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-white">Detection engines used</h3>
            <ul className="mt-3 space-y-2">
              {result.engines.map((engine) => (
                <li key={engine.name} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${engine.available ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="font-medium text-slate-200">{engine.name}</span>
                  <span className="muted">— {engine.detail}</span>
                </li>
              ))}
            </ul>
          </section>

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
