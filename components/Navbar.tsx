'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthMenu } from './AuthMenu';
import { LogoWordmark } from './Logo';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/message-detector', label: 'Message Detector' },
  { href: '/photo-detector', label: 'Photo Detector' },
  { href: '/video-detector', label: 'Video Detector' },
  { href: '/safety-tips', label: 'Safety Tips' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main">
        <Link href="/" className="rounded-lg" aria-label="AI Scam Shield home">
          <LogoWordmark />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-2">
            <AuthMenu pathname={pathname} />
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-white/15 p-2 text-slate-200 lg:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <ul id="mobile-nav" className="border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-300'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-3 border-t border-white/10 pt-3">
            <AuthMenu pathname={pathname} />
          </li>
        </ul>
      )}
    </header>
  );
}
