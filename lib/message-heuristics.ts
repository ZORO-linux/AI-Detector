import type { RiskIndicator } from './types';

interface Rule {
  label: string;
  detail: string;
  severity: RiskIndicator['severity'];
  weight: number;
  pattern: RegExp;
}

/**
 * Deterministic lexical signals. These never decide the verdict on their own -
 * they are merged with the model verdict in lib/analyze-message.ts.
 */
const RULES: Rule[] = [
  {
    label: 'OTP / credential request',
    detail: 'Asks for an OTP, PIN, CVV, password or verification code. Legitimate organisations never do this.',
    severity: 'danger',
    weight: 26,
    pattern: /\b(otp|one[- ]time[- ](pass|code)|cvv|atm pin|upi pin|mpin|net ?banking password|verification code|security code|share the code)\b/i,
  },
  {
    label: 'Account suspension threat',
    detail: 'Threatens blocking, suspension, expiry or deactivation to force a quick reaction.',
    severity: 'danger',
    weight: 18,
    pattern: /\b(account (will be )?(blocked|suspended|deactivated|closed|frozen|on hold)|kyc (update|expired|pending)|card (will be )?blocked|service will be (stopped|discontinued))\b/i,
  },
  {
    label: 'Artificial urgency',
    detail: 'Uses deadlines or urgency wording so the victim acts before thinking.',
    severity: 'warn',
    weight: 12,
    pattern: /\b(urgent|immediately|within \d+ (hours?|minutes?|hrs?|mins?)|right now|last (chance|warning)|act now|expires? (today|soon|in)|limited time|hurry)\b/i,
  },
  {
    label: 'Payment / fee demand',
    detail: 'Requests money, a processing fee, a refundable deposit or a direct transfer.',
    severity: 'danger',
    weight: 20,
    pattern: /\b(pay(ment)? (of|now|rs|inr|\$)|processing fee|registration fee|security deposit|refundable (fee|amount)|transfer (the )?(money|amount|funds)|send (money|rs|inr|\$)|gift card|bitcoin|usdt|crypto wallet|western union|google pay|phonepe|paytm number)\b/i,
  },
  {
    label: 'Prize / lottery bait',
    detail: 'Claims a prize, lottery, refund or cashback that the recipient never applied for.',
    severity: 'danger',
    weight: 20,
    pattern: /\b(you (have )?won|lottery|lucky (draw|winner)|jackpot|prize money|claim your (reward|prize|gift)|cashback of|refund of)\b|\bcongratulations\b/i,
  },
  {
    label: 'Fake job / work-from-home offer',
    detail: 'Promises easy income, part-time work or a job without an interview - a common recruitment scam.',
    severity: 'warn',
    weight: 16,
    pattern: /\b(work from home|part[- ]time job|earn (rs|inr|\$|up to)|daily (income|payout|earning)|no (experience|interview) (required|needed)|hiring urgently|job offer|salary package|task based job|telegram.*job|join our team on (whatsapp|telegram))\b/i,
  },
  {
    label: 'Investment / guaranteed-return pitch',
    detail: 'Promises guaranteed or unusually high returns, typical of investment and trading scams.',
    severity: 'danger',
    weight: 18,
    pattern: /\b(guaranteed (return|profit|income)|double your money|\d{2,}% (return|profit|daily|monthly)|risk[- ]free investment|trading (tips|signal)s?|insider tip|forex (profit|signal))\b/i,
  },
  {
    label: 'Impersonation attempt',
    detail: 'Claims to be a bank, government body, courier, support desk or a known person.',
    severity: 'warn',
    weight: 14,
    pattern: /\b(this is (your )?(bank|manager|ceo|hr)|customer (care|support) (team|executive)|income tax|cyber ?(cell|crime)|police|courier (team|department)|parcel (held|stuck|customs)|electricity bill|rto challan|aadhaar|pan card|ssn|irs|amazon support|microsoft support)\b/i,
  },
  {
    label: 'Credential / data harvesting',
    detail: 'Asks the recipient to log in, verify identity or submit personal documents through a link.',
    severity: 'danger',
    weight: 16,
    pattern: /\b(verify your (account|identity|details)|update your (kyc|details|information)|confirm your (password|login|identity)|click (here|the link) to (login|verify|update)|re[- ]?activate your account|sign in to (continue|avoid))\b/i,
  },
  {
    label: 'Secrecy request',
    detail: 'Asks the recipient to keep the conversation secret or not to tell family/bank.',
    severity: 'danger',
    weight: 14,
    pattern: /\b(do ?n.?t (tell|inform|share with) (anyone|your family|the bank)|keep (this|it) (secret|confidential|between us)|this is confidential)\b/i,
  },
  {
    label: 'Off-platform contact push',
    detail: 'Pushes the conversation to WhatsApp / Telegram where there is no fraud protection.',
    severity: 'warn',
    weight: 10,
    pattern: /\b(whats ?app me|message me on (whatsapp|telegram)|t\.me\/|wa\.me\/|join (this )?(telegram|whatsapp) (group|channel)|contact on telegram)\b/i,
  },
  {
    label: 'Remote-access / app install request',
    detail: 'Asks to install a screen-sharing or unknown APK, a classic takeover technique.',
    severity: 'danger',
    weight: 22,
    pattern: /\b(anydesk|teamviewer|quick ?support|screen ?share|install (this )?(app|apk)|download the attached apk|\.apk\b)/i,
  },
  {
    label: 'Mass-mail / generic greeting',
    detail: 'Generic salutation with no personal context, typical of bulk phishing.',
    severity: 'info',
    weight: 5,
    pattern: /^(dear (customer|user|sir\/madam|member|account holder)|hello dear|attention)\b/im,
  },
  {
    label: 'Poor grammar / formatting noise',
    detail: 'Mixed casing, excessive punctuation or spacing tricks used to dodge spam filters.',
    severity: 'info',
    weight: 6,
    pattern: /([!]{3,}|[?]{3,}|\b[A-Z]{6,}\b\s+\b[A-Z]{6,}\b|\b\w(\s\w){5,}\b)/,
  },
];

export interface HeuristicResult {
  score: number; // 0-100
  indicators: RiskIndicator[];
}

export function runHeuristics(text: string): HeuristicResult {
  const indicators: RiskIndicator[] = [];
  let raw = 0;

  for (const rule of RULES) {
    const match = rule.pattern.exec(text);
    if (match) {
      raw += rule.weight;
      indicators.push({
        label: rule.label,
        detail: `${rule.detail} (matched: "${match[0].trim().slice(0, 60)}")`,
        severity: rule.severity,
      });
    }
  }

  // Saturating curve so a handful of weak hits cannot reach 100.
  const score = Math.round(100 * (1 - Math.exp(-raw / 55)));
  return { score, indicators };
}
