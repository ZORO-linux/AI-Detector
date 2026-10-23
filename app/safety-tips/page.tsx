import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety Tips',
  description: 'Practical protection against OTP fraud, phishing, fake job offers, investment scams and impersonation.',
};

const TOPICS = [
  {
    title: 'OTP & banking fraud',
    summary: 'The OTP is the last lock on your money. Anyone asking for it is attacking you.',
    signs: [
      'A caller claims to be from your bank and needs the OTP to "verify" or "cancel" a transaction.',
      'You receive an OTP you did not request, followed by a call or message.',
      'You are asked for your CVV, UPI PIN, ATM PIN or card expiry.',
      'You are told to enter your UPI PIN to *receive* money (receiving never needs a PIN).',
    ],
    actions: [
      'Never share an OTP, PIN, CVV or password — not even with "bank staff" or "police".',
      'Hang up and call the number printed on your debit card or official app.',
      'Enable transaction alerts and set a low daily online limit.',
      'If money left your account, call 1930 (India) and your bank within the golden hour.',
    ],
  },
  {
    title: 'Phishing links & fake websites',
    summary: 'A convincing page costs an attacker nothing. The domain is what gives it away.',
    signs: [
      'Shortened links (bit.ly, t.ly) or raw IP addresses in a message.',
      'Lookalike domains: sbi-kyc-verify.top, paypa1.com, amazon-rewards.click.',
      'Urgent wording: "account will be blocked today", "last warning".',
      'Login page asking for your password plus your OTP on the same screen.',
    ],
    actions: [
      'Never open links from unsolicited messages. Type the official address yourself.',
      'Check the registrable domain, not the whole string: look at what is right before .com/.in.',
      'Use a password manager — it refuses to autofill on a fake domain.',
      'Turn on two-factor authentication everywhere, preferably with an authenticator app.',
    ],
  },
  {
    title: 'Fake job offers & task scams',
    summary: 'Real employers pay you. They never ask you to pay to start.',
    signs: [
      'Job offer arrives on WhatsApp or Telegram with no interview.',
      'Promises of "Rs 2000-5000 daily" for liking videos or rating products.',
      'A registration, training or "refundable security" fee is required.',
      'Small early payouts to build trust, then a larger "unlock" deposit is demanded.',
    ],
    actions: [
      'Never pay money to get a job. Legitimate recruitment is free to the candidate.',
      'Verify the company on its official careers page and call the listed number.',
      'Do not share Aadhaar, PAN, bank details or signed documents with unverified recruiters.',
      'Stop at the first "deposit more to withdraw" request — that money is gone.',
    ],
  },
  {
    title: 'Investment & trading scams',
    summary: 'Guaranteed returns do not exist. Guaranteed losses are what is on offer.',
    signs: [
      'A stranger adds you to a WhatsApp/Telegram "VIP trading group".',
      'Screenshots of huge profits and testimonials from other "members".',
      'A slick app or website showing your balance growing, which you cannot withdraw from.',
      'Pressure to invest quickly before an "IPO allocation" closes.',
    ],
    actions: [
      'Only invest through SEBI/regulator-registered brokers and official app stores.',
      'Treat any promised fixed return above a bank FD as a red flag.',
      'Never let anyone trade on your behalf or install remote-access tools like AnyDesk.',
      'Test an early small withdrawal. If it is blocked or taxed, it is a scam.',
    ],
  },
  {
    title: 'Impersonation, deepfakes & digital arrest',
    summary: 'Voice and video can now be faked convincingly. Identity must be verified out-of-band.',
    signs: [
      'A "police", "CBI" or "customs" officer video-calls and says you are under investigation.',
      'Your boss or a relative urgently asks for money over chat or a short voice note.',
      'A video call where the face is slightly out of sync, blurry at the jaw, or oddly lit.',
      'You are told not to tell anyone and to stay on the call.',
    ],
    actions: [
      'No police force conducts arrests or fines over a video call. Disconnect.',
      'Call the person back on a number you already have saved. Ask something only they know.',
      'Agree a family "safe word" for money requests.',
      'Run suspicious clips through the video detector, but treat the score as a hint, not a verdict.',
    ],
  },
];

export default function SafetyTipsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Safety Tips</h1>
      <p className="muted mt-2 max-w-2xl">
        Detection tools help, but habits protect you. These are the five scam families behind most
        reported losses, with the signals to watch and what to do instead.
      </p>

      <div className="mt-10 space-y-6">
        {TOPICS.map((topic) => (
          <article key={topic.title} className="glass p-6">
            <h2 className="text-xl font-bold text-white">{topic.title}</h2>
            <p className="mt-1 text-sm text-cyan-300">{topic.summary}</p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-300">Warning signs</h3>
                <ul className="mt-3 space-y-2">
                  {topic.signs.map((sign) => (
                    <li key={sign} className="flex gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-rose-400" />
                      {sign}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">What to do</h3>
                <ul className="mt-3 space-y-2">
                  {topic.actions.map((action) => (
                    <li key={action} className="flex gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-emerald-400" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="glass mt-8 border-cyan-400/20 p-6">
        <h2 className="text-lg font-semibold text-white">If you have already been scammed</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>Call your bank immediately and freeze the account or card.</li>
          <li>Report within the first hour — recovery chances drop sharply after that.</li>
          <li>India: call 1930 or file at cybercrime.gov.in. Elsewhere, contact your national cybercrime unit.</li>
          <li>Keep screenshots, transaction IDs and phone numbers as evidence.</li>
          <li>Change passwords and revoke any remote-access app you installed.</li>
        </ol>
      </div>
    </div>
  );
}
