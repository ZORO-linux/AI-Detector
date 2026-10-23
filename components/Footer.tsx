import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-navy-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-base font-bold text-white">AI Scam Shield</span>
          </div>
          <p className="muted mt-3 max-w-md">
            An AI-assisted triage tool for suspicious messages, images and videos. It produces
            probabilistic risk assessments, not legal or forensic proof.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Detectors</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link className="hover:text-cyan-300" href="/message-detector">Message Detector</Link></li>
            <li><Link className="hover:text-cyan-300" href="/photo-detector">Photo Detector</Link></li>
            <li><Link className="hover:text-cyan-300" href="/video-detector">Video Detector</Link></li>
            <li><Link className="hover:text-cyan-300" href="/api/health">API Health</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Company</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link className="hover:text-cyan-300" href="/about">About &amp; Limitations</Link></li>
            <li><Link className="hover:text-cyan-300" href="/safety-tips">Safety Tips</Link></li>
            <li><Link className="hover:text-cyan-300" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-cyan-300" href="/terms">Terms of Use</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} AI Scam Shield. Built for a hackathon demo. Never share OTPs, PINs or passwords with anyone.
      </div>
    </footer>
  );
}
