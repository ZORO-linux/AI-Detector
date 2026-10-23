'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RiskLevel } from '@/lib/types';

const CONSENT_KEY = 'ass.history.consent';
const DATA_KEY = 'ass.history.items';
const MAX_ITEMS = 20;

export interface HistoryItem {
  id: string;
  kind: 'message' | 'photo' | 'video';
  label: string;
  risk: RiskLevel;
  score: number;
  summary: string;
  createdAt: string;
}

function read(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Consent-gated scan history. Stored only in this browser's localStorage -
 * never uploaded, and it keeps a short label rather than the original content.
 */
export function useScanHistory() {
  const [consent, setConsentState] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const granted = localStorage.getItem(CONSENT_KEY) === 'granted';
    setConsentState(granted);
    setItems(granted ? read() : []);
    setReady(true);
  }, []);

  const setConsent = useCallback((granted: boolean) => {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
    setConsentState(granted);
    if (!granted) {
      localStorage.removeItem(DATA_KEY);
      setItems([]);
    }
  }, []);

  const add = useCallback(
    (item: Omit<HistoryItem, 'id'>) => {
      if (localStorage.getItem(CONSENT_KEY) !== 'granted') return;
      const next = [{ ...item, id: crypto.randomUUID() }, ...read()].slice(0, MAX_ITEMS);
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
      setItems(next);
    },
    [],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(DATA_KEY);
    setItems([]);
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((item) => item.id !== id);
    localStorage.setItem(DATA_KEY, JSON.stringify(next));
    setItems(next);
  }, []);

  return { consent, setConsent, items, add, clear, remove, ready };
}
