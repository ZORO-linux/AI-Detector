'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './Logo';
import { Alert, Spinner } from './ui';

type Mode = 'login' | 'signup';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/message-detector';

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, password, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Something went wrong. Try again.');
        return;
      }
      router.replace(next.startsWith('/') ? next : '/message-detector');
      router.refresh();
    } catch {
      setError('Could not reach the server. Is the app still running?');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(value: Mode) {
    setMode(value);
    setError(null);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="text-center">
        <Logo className="mx-auto h-14 w-14" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {mode === 'login' ? 'Sign in to AI Scam Shield' : 'Create your account'}
        </h1>
        <p className="muted mt-2">
          Detectors are protected. Sign in to analyse messages, photos and videos.
        </p>
      </div>

      <div className="glass mt-8 p-6">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-navy-900/60 p-1">
          {(['login', 'signup'] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              aria-pressed={mode === value}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === value ? 'bg-gradient-to-r from-electric to-cyan-400 text-navy-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {value === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' ? (
            <div>
              <label className="label" htmlFor="auth-name">
                Name
              </label>
              <input
                id="auth-name"
                className="input !py-3"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Your name"
                maxLength={60}
              />
            </div>
          ) : null}

          <div>
            <label className="label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              className="input !py-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              className="input !py-3"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters, letters and numbers'}
            />
            {mode === 'signup' ? (
              <p className="mt-1.5 text-xs text-slate-500">
                Minimum 8 characters, including at least one letter and one number.
              </p>
            ) : null}
          </div>

          {error ? <Alert tone="error" title="Could not continue">{error}</Alert> : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Spinner /> : null}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="muted mt-6 text-center text-xs">
        Accounts are stored locally on this machine in <code className="rounded bg-white/10 px-1">.data/users.json</code>,
        with scrypt-hashed passwords and an HttpOnly signed session cookie. This is a hackathon-local
        auth system, not a production identity provider.
      </p>
    </div>
  );
}
