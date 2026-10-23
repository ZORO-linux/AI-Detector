'use client';

import { useEffect, useState } from 'react';
import { Spinner } from './ui';

interface Health {
  status: string;
  detectors: Record<string, { ready: boolean; requires: string[] }>;
}

const LABELS: Record<string, string> = {
  message: 'Message detector',
  photo: 'Photo detector',
  video: 'Video detector',
};

export function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: Health) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return <p className="muted">Backend health check unavailable.</p>;
  }
  if (!health) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400">
        <Spinner /> Checking detector status…
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(health.detectors).map(([key, value]) => (
        <span
          key={key}
          className={`chip ${value.ready ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-300'}`}
          title={value.ready ? 'Connected' : `Needs: ${value.requires.join(', ')}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${value.ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {LABELS[key] ?? key}: {value.ready ? 'connected' : 'setup required'}
        </span>
      ))}
    </div>
  );
}
