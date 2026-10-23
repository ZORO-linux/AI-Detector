import { config, isSafeBrowsingConfigured } from './config';
import type { UrlFinding } from './types';

const URL_PATTERN =
  /\b((?:https?:\/\/|www\.)[^\s<>"'(),]+|(?:[a-z0-9-]+\.)+(?:com|net|org|in|io|co|me|xyz|top|info|biz|link|click|site|online|shop|live|app|ru|cn|tk|ml|ga|cf|gq|work|fit|icu|vip|club|store|cc|ws)(?:\/[^\s<>"'(),]*)?)/gi;

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at',
  'rebrand.ly', 'ow.ly', 'buff.ly', 't.ly', 'bl.ink', 'tiny.cc', 'shorte.st', 'adf.ly',
]);

const HIGH_RISK_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'top', 'xyz', 'click', 'link', 'work', 'fit', 'icu', 'rest', 'zip', 'mov',
]);

const TRUSTED_BRANDS = [
  'google', 'paypal', 'amazon', 'apple', 'microsoft', 'facebook', 'instagram', 'whatsapp',
  'netflix', 'sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'gpay', 'linkedin', 'irctc',
  'flipkart', 'dhl', 'fedex', 'usps', 'bank',
];

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;:!?)\]]+$/, '');
    const normalized = /^https?:\/\//i.test(cleaned) ? cleaned : `http://${cleaned}`;
    try {
      const parsed = new URL(normalized);
      const key = parsed.href.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(parsed.href);
      }
    } catch {
      /* ignore unparsable token */
    }
    if (out.length >= 10) break;
  }
  return out;
}

function staticUrlNotes(url: string): string[] {
  const notes: string[] = [];
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return ['URL could not be parsed.'];
  }
  const host = parsed.hostname.toLowerCase();
  const tld = host.split('.').pop() ?? '';

  if (SHORTENERS.has(host)) {
    notes.push('Uses a link shortener, so the real destination is hidden.');
  }
  if (HIGH_RISK_TLDS.has(tld)) {
    notes.push(`Domain uses the "${tld}" TLD, which is heavily abused for phishing.`);
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    notes.push('Link points to a raw IP address instead of a domain name.');
  }
  if (host.split('.').length > 4) {
    notes.push('Unusually deep subdomain chain, a common phishing disguise.');
  }
  if (/[^\x00-\x7F]/.test(host) || host.startsWith('xn--')) {
    notes.push('Domain contains non-ASCII / punycode characters (possible lookalike attack).');
  }
  if (parsed.protocol === 'http:') {
    notes.push('Link is not using HTTPS.');
  }
  if (host.includes('-')) {
    const brand = TRUSTED_BRANDS.find((b) => host.includes(b));
    const registrable = host.split('.').slice(-2).join('.');
    if (brand && !registrable.startsWith(`${brand}.`)) {
      notes.push(`Mentions the brand "${brand}" but is not an official ${brand} domain.`);
    }
  }
  if (parsed.search.length > 120) {
    notes.push('Very long query string, often used to carry tracking or payload data.');
  }
  return notes;
}

interface SafeBrowsingMatch {
  threatType: string;
  threat: { url: string };
}

async function safeBrowsingLookup(urls: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (!isSafeBrowsingConfigured() || urls.length === 0) return result;

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
    config.safeBrowsing.apiKey,
  )}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client: { clientId: 'ai-scam-shield', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: urls.map((url) => ({ url })),
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Safe Browsing responded with ${response.status}`);
  }

  const data = (await response.json()) as { matches?: SafeBrowsingMatch[] };
  for (const match of data.matches ?? []) {
    const list = result.get(match.threat.url) ?? [];
    list.push(match.threatType);
    result.set(match.threat.url, list);
  }
  return result;
}

export async function inspectUrls(
  urls: string[],
): Promise<{ findings: UrlFinding[]; engineAvailable: boolean; engineDetail: string }> {
  let matches = new Map<string, string[]>();
  let engineAvailable = isSafeBrowsingConfigured();
  let engineDetail = engineAvailable
    ? 'Google Safe Browsing v4 checked every extracted link.'
    : 'SAFE_BROWSING_API_KEY not configured - links were only checked with static heuristics.';

  if (engineAvailable && urls.length > 0) {
    try {
      matches = await safeBrowsingLookup(urls);
    } catch (error) {
      engineAvailable = false;
      engineDetail = `Safe Browsing lookup failed: ${(error as Error).message}`;
    }
  }

  const findings: UrlFinding[] = urls.map((url) => {
    const threatTypes = matches.get(url) ?? [];
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      /* keep raw */
    }
    return {
      url,
      host,
      checked: engineAvailable,
      verdict: threatTypes.length > 0 ? 'malicious' : engineAvailable ? 'clean' : 'unchecked',
      threatTypes,
      notes: staticUrlNotes(url),
    };
  });

  return { findings, engineAvailable, engineDetail };
}
