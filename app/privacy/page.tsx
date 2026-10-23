import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What AI Scam Shield does and does not do with your messages, photos and videos.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Privacy Policy</h1>
      <p className="muted mt-2">Last updated: {new Date().getFullYear()}</p>

      <div className="glass mt-8 space-y-6 p-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-white">What we process</h2>
          <p className="mt-2">
            The message text, image or video you submit is received by our server, validated, and
            forwarded to the configured AI inference provider so it can be analysed. That is the only
            purpose it is used for.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">What we store</h2>
          <p className="mt-2">
            Nothing by default. Uploaded files are held in memory or in a temporary directory only for
            the duration of the request, and temporary files are deleted immediately afterwards. We do
            not write your message text, photos or videos to a database.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Scan history</h2>
          <p className="mt-2">
            Recent-scan history is off until you explicitly turn it on. When enabled, we store a short
            label, the risk level, the score and a timestamp in your own browser&apos;s localStorage.
            It never leaves your device and is never sent to our server. You can delete individual
            entries or wipe the whole history at any time from any detector page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Third-party processing</h2>
          <p className="mt-2">
            Depending on deployment configuration, your submission may be sent to an LLM provider
            (such as OpenAI, Groq or OpenRouter), to Hugging Face Inference for media forensics, and
            extracted URLs may be sent to Google Safe Browsing. Those providers apply their own
            policies. Do not submit confidential material you are not permitted to share.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">What you should not submit</h2>
          <p className="mt-2">
            Never paste live OTPs, passwords, full card numbers or government ID numbers. Redact them
            before analysing — the detector does not need them to assess risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Security</h2>
          <p className="mt-2">
            All API credentials are stored in server-side environment variables and are never exposed
            to the browser. Uploads are size-limited, type-checked by magic bytes, and rate limited per
            IP address.
          </p>
        </section>
      </div>
    </div>
  );
}
