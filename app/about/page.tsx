import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About & Limitations',
  description: 'How AI Scam Shield works, what it can detect, and where it fails.',
};

const STACK = [
  ['Frontend', 'Next.js App Router, React, TypeScript, Tailwind CSS'],
  ['Backend', 'Next.js Route Handlers on the Node.js runtime'],
  ['Message analysis', 'OpenAI-compatible LLM classifier + deterministic rule engine + Google Safe Browsing'],
  ['Image analysis', 'Two Hugging Face image-classification models (synthetic-image and face-manipulation)'],
  ['Video analysis', 'FFmpeg frame extraction + per-frame deepfake classification, aggregated server-side'],
];

const LIMITS = [
  'Detection is probabilistic. Scores are evidence, never proof. We never say a file is definitely fake or definitely authentic.',
  'Image and video detectors are trained on specific generator families. A brand-new generator can slip through.',
  'Compression, screenshots, filters, re-encoding and low resolution all degrade media-forensics accuracy, and can push genuine media towards a "manipulated" score.',
  'The message classifier reasons about language. A well-written scam in an unusual language or domain may be scored lower than it deserves.',
  'A "low risk" result is not a safety certificate. We deliberately keep a risk floor when a message contains links that could not be reputation-checked.',
  'Rate limiting is in-memory, which is fine for a demo but should be moved to Redis for real deployments.',
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">About AI Scam Shield</h1>
      <p className="muted mt-3">
        AI Scam Shield is a triage tool. It takes the three things people most often receive from
        strangers — a message, a photo and a video — and runs each through a real detection pipeline,
        then explains the result in language a non-technical person can act on.
      </p>

      <section className="glass mt-8 p-6">
        <h2 className="text-xl font-bold text-white">What it does</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>
            <strong className="text-white">Message detector.</strong> Combines an LLM fraud classifier with a
            deterministic rule engine covering OTP requests, urgency, payment demands, impersonation,
            fake jobs and investment bait. URLs are extracted, structurally analysed and (when a key
            is configured) checked against Google Safe Browsing.
          </li>
          <li>
            <strong className="text-white">Photo detector.</strong> Runs two separate tasks and reports them
            separately: whether the image looks fully AI-generated, and whether a face shows
            swap/manipulation artefacts.
          </li>
          <li>
            <strong className="text-white">Video detector.</strong> Extracts evenly spaced frames server-side
            with FFmpeg, scores each frame, and aggregates with a top-k weighted mean so localized
            manipulation is not diluted by clean frames.
          </li>
        </ul>
      </section>

      <section className="glass mt-6 p-6">
        <h2 className="text-xl font-bold text-white">Technology</h2>
        <dl className="mt-4 divide-y divide-white/10">
          {STACK.map(([key, value]) => (
            <div key={key} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
              <dt className="text-sm font-semibold text-cyan-300">{key}</dt>
              <dd className="text-sm text-slate-300">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="muted mt-4">
          Every API key lives in server-side environment variables. The browser never sees a
          credential, and every inference call happens inside our own API routes. If a key is
          missing, the detector reports “Detector setup required” instead of fabricating a result.
        </p>
      </section>

      <section className="glass mt-6 border-amber-400/20 p-6">
        <h2 className="text-xl font-bold text-white">Limitations you must read</h2>
        <ul className="mt-4 space-y-3">
          {LIMITS.map((limit) => (
            <li key={limit} className="flex gap-2.5 text-sm text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-amber-400" />
              {limit}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass mt-6 p-6">
        <h2 className="text-xl font-bold text-white">Privacy posture</h2>
        <p className="muted mt-3">
          Messages and files are processed in memory, forwarded to the configured inference provider
          and then discarded. Extracted video frames live in a temporary directory that is deleted in
          a <code className="rounded bg-white/10 px-1">finally</code> block. Scan history is optional,
          consent-gated, stored only in your browser, and holds a short label rather than your
          content. See the <Link href="/privacy" className="text-cyan-300 underline">Privacy Policy</Link>.
        </p>
      </section>
    </div>
  );
}
