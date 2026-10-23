import { config, isLlmConfigured } from './config';

export interface LlmMessageVerdict {
  risk: 'low' | 'medium' | 'high';
  riskScore: number;
  confidence: number;
  summary: string;
  indicators: { label: string; detail: string; severity: 'info' | 'warn' | 'danger' }[];
  recommendedActions: string[];
  scamType: string;
}

const SYSTEM_PROMPT = `You are a fraud-analysis engine for a cybersecurity product.
You receive one message (SMS, WhatsApp, email, job offer or similar) that a user received.
Analyse it for social-engineering and phishing risk.

Rules:
- Never assume a message is safe only because it lacks obvious scam keywords. Consider context, intent, plausibility and what the sender is asking the recipient to DO.
- Consider: artificial urgency, OTP/credential requests, payment or fee demands, impersonation of banks/government/employers, fake job and investment offers, prize/lottery bait, remote-access requests, suspicious links, secrecy requests, and unsolicited contact.
- If the message is ambiguous or you lack context, use "medium" rather than "low", and lower your confidence.
- Be concrete. Quote or paraphrase the exact part of the message that triggered each indicator.
- Never claim certainty. You are producing an assessment, not proof.

Respond with ONLY a JSON object, no markdown, in this exact shape:
{
  "risk": "low" | "medium" | "high",
  "riskScore": <integer 0-100>,
  "confidence": <number 0-1>,
  "scamType": "<short label, e.g. 'OTP phishing', 'fake job offer', 'no clear scam pattern'>",
  "summary": "<2-3 sentence plain-language assessment>",
  "indicators": [{ "label": "<short>", "detail": "<why this is suspicious>", "severity": "info" | "warn" | "danger" }],
  "recommendedActions": ["<imperative action the user should take>"]
}`;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('Model did not return valid JSON.');
  }
}

export async function classifyMessageWithLlm(message: string): Promise<LlmMessageVerdict> {
  if (!isLlmConfigured()) {
    throw new Error('LLM_API_KEY is not configured.');
  }

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Message to analyse:\n"""\n${message}\n"""` },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `LLM provider returned ${response.status}. ${body.slice(0, 180)}`.trim(),
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM provider returned an empty response.');

  const parsed = parseJson(content) as Partial<LlmMessageVerdict>;
  const risk = parsed.risk === 'high' || parsed.risk === 'medium' || parsed.risk === 'low' ? parsed.risk : 'medium';

  return {
    risk,
    riskScore: Math.round(clamp(Number(parsed.riskScore ?? (risk === 'high' ? 85 : risk === 'medium' ? 55 : 20)), 0, 100)),
    confidence: clamp(Number(parsed.confidence ?? 0.5), 0, 1),
    summary: String(parsed.summary ?? 'The model returned an assessment without a summary.'),
    scamType: String(parsed.scamType ?? 'unspecified'),
    indicators: Array.isArray(parsed.indicators)
      ? parsed.indicators
          .filter((item) => item && typeof item.label === 'string')
          .slice(0, 12)
          .map((item) => ({
            label: String(item.label),
            detail: String(item.detail ?? ''),
            severity:
              item.severity === 'danger' || item.severity === 'warn' || item.severity === 'info'
                ? item.severity
                : 'warn',
          }))
      : [],
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.filter((a) => typeof a === 'string').slice(0, 8)
      : [],
  };
}
