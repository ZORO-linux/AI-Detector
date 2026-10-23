import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SystemStatus } from '@/components/SystemStatus';

const DETECTORS = [
  {
    href: '/message-detector',
    title: 'Scam Message Detector',
    description:
      'Paste any SMS, WhatsApp text, email or job offer. An LLM classifier plus a rule engine look for urgency, OTP requests, payment demands, impersonation and phishing links.',
    points: ['OTP & credential traps', 'Fake job and investment offers', 'Link reputation check'],
    icon: (
      <path d="M4 6h16v10a2 2 0 0 1-2 2H9l-5 4V6Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: '/photo-detector',
    title: 'AI Photo Detector',
    description:
      'Upload a JPG, PNG or WEBP image. Two separate forensics models run: one for fully AI-generated images, one for face-swap / manipulation artefacts.',
    points: ['AI-generated image check', 'Face manipulation check', 'Per-model confidence'],
    icon: (
      <path d="M4 5h16v14H4zM4 15l4.5-4.5L13 15l3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: '/video-detector',
    title: 'Deepfake Video Detector',
    description:
      'Upload an MP4 or MOV clip. The server extracts frames with FFmpeg and scores each one, returning an overall verdict with suspicious timestamps.',
    points: ['Server-side frame extraction', 'Frame-level timeline', 'Suspicious timestamp list'],
    icon: (
      <path d="M4 6h11v12H4zM15 10l5-3v10l-5-3z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-24 h-px scan-line opacity-60" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-fadeUp">
              <span className="chip border-cyan-400/30 text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Real AI detection · no simulated results
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Detect Scams.{' '}
                <span className="bg-gradient-to-r from-electric to-cyan-400 bg-clip-text text-transparent">
                  Verify Media.
                </span>{' '}
                Stay Protected.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Paste a suspicious message or upload a photo or video. AI Scam Shield runs it
                through real AI detection services and explains, in plain language, what looks
                wrong and what you should do next.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/message-detector" className="btn-primary">
                  Check a message
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/safety-tips" className="btn-ghost">
                  Learn the warning signs
                </Link>
              </div>

              <div className="mt-8">
                <SystemStatus />
              </div>
            </div>

            <div className="relative mx-auto hidden w-full max-w-sm lg:block">
              <div className="glass animate-float p-8 text-center">
                <Logo className="mx-auto h-28 w-28" />
                <p className="mt-6 text-sm font-semibold text-white">Three detectors. One verdict.</p>
                <p className="muted mt-2">
                  Every result ships with a risk level, a confidence score, the reasons behind it and
                  a reminder that detection is probabilistic.
                </p>
                <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['Text', 'LLM + rules'],
                    ['Image', '2 models'],
                    ['Video', 'Frame scan'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <dt className="text-xs uppercase tracking-wide text-cyan-300">{k}</dt>
                      <dd className="mt-1 text-[11px] text-slate-400">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <h2 className="section-title">Choose a detector</h2>
        <p className="muted mt-2 max-w-2xl">
          Each detector runs server-side against a real model. If a provider key is missing, the page
          tells you exactly what to connect instead of inventing a result.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {DETECTORS.map((detector) => (
            <Link key={detector.href} href={detector.href} className="glass glass-hover group flex flex-col p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-electric/30 to-cyan-400/20 text-cyan-300">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  {detector.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-white">{detector.title}</h3>
              <p className="muted mt-2 flex-1">{detector.description}</p>
              <ul className="mt-4 space-y-1.5">
                {detector.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300">
                Open detector
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="glass p-6 sm:p-10">
          <h2 className="section-title">How a scan works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ['Submit', 'Your message or file is sent over HTTPS to our own API route.'],
              ['Validate', 'Size, type and magic bytes are checked, and the request is rate limited.'],
              ['Analyse', 'Real inference providers score the content. Nothing is faked or randomised.'],
              ['Explain', 'You get a risk level, confidence, reasons and concrete next steps.'],
            ].map(([title, body], index) => (
              <li key={title} className="rounded-xl border border-white/10 bg-navy-900/40 p-5">
                <span className="text-xs font-bold text-cyan-300">STEP {index + 1}</span>
                <h3 className="mt-2 font-semibold text-white">{title}</h3>
                <p className="muted mt-1.5">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="glass grid gap-6 p-6 sm:p-10 md:grid-cols-2">
          <div>
            <h2 className="section-title">Contact &amp; feedback</h2>
            <p className="muted mt-2">
              Found a scam we missed, or a false positive? Tell us — detector quality improves with
              real-world examples. Never include OTPs, passwords or card numbers in your feedback.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>Email: <span className="text-cyan-300">team@aiscamshield.example</span></li>
              <li>India cybercrime helpline: <span className="text-cyan-300">1930</span> · cybercrime.gov.in</li>
            </ul>
          </div>
          <form
            className="space-y-3"
            action="mailto:team@aiscamshield.example"
            method="post"
            encType="text/plain"
          >
            <div>
              <label className="label" htmlFor="feedback-email">Your email</label>
              <input id="feedback-email" name="email" type="email" required className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="feedback-body">Feedback</label>
              <textarea id="feedback-body" name="feedback" required rows={4} className="input" placeholder="What happened? What did the detector get wrong?" />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">Send feedback</button>
          </form>
        </div>
      </section>
    </>
  );
}
