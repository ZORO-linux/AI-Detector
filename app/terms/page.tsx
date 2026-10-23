import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing the use of AI Scam Shield.',
};

const TERMS = [
  [
    'Assessment, not proof',
    'AI Scam Shield provides probabilistic risk assessments produced by machine-learning models. Results are not forensic evidence, legal advice or a guarantee of authenticity. Never treat a "low risk" result as confirmation that a message, image or video is genuine.',
  ],
  [
    'No liability',
    'The service is provided "as is", without warranty of any kind. We are not liable for any loss arising from reliance on a result, from false positives, or from false negatives.',
  ],
  [
    'Acceptable use',
    'Do not use the service to harass, defame or accuse anyone, to process content you have no right to process, or to attempt to bypass rate limits or upload restrictions. Automated scraping of the API is not permitted.',
  ],
  [
    'Third-party providers',
    'Analysis depends on third-party inference providers. Their availability, pricing and model behaviour can change at any time, which may change or interrupt results.',
  ],
  [
    'Your content',
    'You retain all rights to what you submit. You confirm you have the right to submit it for analysis. We claim no ownership and do not retain your content after a request completes.',
  ],
  [
    'Changes',
    'These terms and the detection models may change as the project evolves. Continued use after a change constitutes acceptance.',
  ],
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Terms of Use</h1>
      <p className="muted mt-2">Last updated: {new Date().getFullYear()}</p>

      <div className="glass mt-8 space-y-6 p-6">
        {TERMS.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
