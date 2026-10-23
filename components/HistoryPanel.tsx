'use client';

import type { HistoryItem } from './useScanHistory';
import { RiskBadge } from './ui';

export function HistoryPanel({
  consent,
  setConsent,
  items,
  clear,
  remove,
}: {
  consent: boolean;
  setConsent: (value: boolean) => void;
  items: HistoryItem[];
  clear: () => void;
  remove: (id: string) => void;
}) {
  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent scans</h2>
          <p className="muted mt-1 max-w-xl">
            Optional. When enabled, only a short label, the risk level and the score are saved in
            this browser. Your message text, photos and videos are never stored.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-navy-900 accent-cyan-400"
          />
          Save history on this device
        </label>
      </div>

      {!consent ? (
        <p className="muted mt-4">History is off. Nothing is being stored.</p>
      ) : items.length === 0 ? (
        <p className="muted mt-4">No scans yet. Your next analysis will appear here.</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-navy-900/50 p-3">
                <span className="chip uppercase">{item.kind}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-200" title={item.label}>
                  {item.label}
                </span>
                <RiskBadge risk={item.risk} />
                <span className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-400/40 hover:text-rose-300"
                  aria-label={`Delete history entry ${item.label}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clear} className="btn-ghost mt-4 !py-2 !text-xs">
            Delete all history
          </button>
        </>
      )}
    </section>
  );
}
