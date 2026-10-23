'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from './ui';

interface PublicUser {
  id: string;
  email: string;
  name: string;
}

export function AuthMenu({ pathname }: { pathname: string }) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: { user: PublicUser | null }) => {
        if (!cancelled) {
          setUser(data.user);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setSigningOut(false);
    router.replace('/login');
    router.refresh();
  }

  if (!loaded) {
    return <span className="h-8 w-20 animate-pulse rounded-lg bg-white/5" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <a href="/login" className="btn-primary !px-4 !py-2 !text-xs">
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="chip max-w-[160px] truncate border-cyan-400/25 text-cyan-200" title={user.email}>
        {user.name || user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50"
      >
        {signingOut ? <Spinner className="h-3 w-3" /> : 'Sign out'}
      </button>
    </div>
  );
}
