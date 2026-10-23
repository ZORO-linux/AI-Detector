import { isSafeBrowsingConfigured, config } from './config';
import { classifyMessageWithLlm } from './llm';
import { runHeuristics } from './message-heuristics';
import type { EngineReport, MessageAnalysis, RiskIndicator, RiskLevel } from './types';
import { extractUrls, inspectUrls } from './urls';

const DISCLAIMER =
  'This is an automated risk assessment, not proof. A "low risk" result does not guarantee the message is genuine - always verify through an official channel before acting.';

function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function dedupe(indicators: RiskIndicator[]): RiskIndicator[] {
  const seen = new Set<string>();
  const out: RiskIndicator[] = [];
  for (const item of indicators) {
    const key = item.label.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const BASE_ACTIONS = [
  'Do not share any OTP, PIN, password or card details with the sender.',
  'Verify the sender independently using a phone number or app you already trust - never a number from the message.',
  'Do not pay any "fee", "deposit" or "tax" to receive money, a job or a prize.',
];

export async function analyzeMessage(message: string): Promise<MessageAnalysis> {
  const text = message.trim();
  const heuristics = runHeuristics(text);
  const urls = extractUrls(text);
  const engines: EngineReport[] = [];

  const [llmVerdict, urlReport] = await Promise.all([
    classifyMessageWithLlm(text),
    inspectUrls(urls),
  ]);

  engines.push({
    name: `LLM classifier (${config.llm.model})`,
    available: true,
    detail: `Model verdict: ${llmVerdict.risk.toUpperCase()} - ${llmVerdict.scamType}.`,
  });
  engines.push({
    name: 'Rule-based signal engine',
    available: true,
    detail: `${heuristics.indicators.length} lexical fraud pattern(s) matched (raw score ${heuristics.score}/100).`,
  });
  engines.push({
    name: 'Google Safe Browsing',
    available: isSafeBrowsingConfigured() && urlReport.engineAvailable,
    detail: urls.length === 0 ? 'No links found in this message.' : urlReport.engineDetail,
  });

  // Model is the primary signal; heuristics and link reputation can only raise the score.
  let score = Math.round(llmVerdict.riskScore * 0.7 + heuristics.score * 0.3);
  score = Math.max(score, Math.round(heuristics.score * 0.85));

  const maliciousUrls = urlReport.findings.filter((f) => f.verdict === 'malicious');
  const noisyUrls = urlReport.findings.filter((f) => f.notes.length > 0);

  const indicators: RiskIndicator[] = [...llmVerdict.indicators, ...heuristics.indicators];

  if (maliciousUrls.length > 0) {
    score = Math.max(score, 92);
    indicators.unshift({
      label: 'Link flagged by threat intelligence',
      detail: `Google Safe Browsing flagged ${maliciousUrls
        .map((f) => `${f.host} (${f.threatTypes.join(', ')})`)
        .join('; ')}.`,
      severity: 'danger',
    });
  }

  for (const finding of noisyUrls) {
    indicators.push({
      label: `Suspicious link structure: ${finding.host}`,
      detail: finding.notes.join(' '),
      severity: 'warn',
    });
    score = Math.min(100, score + Math.min(12, finding.notes.length * 4));
  }

  // Never call something "safe" just because nothing matched - unverified links keep a floor.
  if (urls.length > 0 && !urlReport.engineAvailable) {
    score = Math.max(score, 40);
    indicators.push({
      label: 'Links could not be reputation-checked',
      detail:
        'This message contains links but no threat-intelligence provider is configured, so the destination could not be verified. Treat the links as untrusted.',
      severity: 'warn',
    });
  }

  score = Math.min(100, Math.max(0, score));
  const risk = levelFromScore(score);

  const actions = [...llmVerdict.recommendedActions];
  for (const action of BASE_ACTIONS) {
    if (actions.length < 8 && !actions.some((a) => a.toLowerCase().includes(action.slice(0, 18).toLowerCase()))) {
      actions.push(action);
    }
  }
  if (urls.length > 0) {
    actions.unshift('Do not open the links in this message; type the official website address manually instead.');
  }
  if (risk === 'high') {
    actions.push('If you already shared details or money, call your bank immediately and report at cybercrime.gov.in (India) or your local cybercrime unit.');
  }

  const summary =
    risk === 'low'
      ? `${llmVerdict.summary} No strong fraud pattern was detected, but that does not prove the message is genuine.`
      : llmVerdict.summary;

  return {
    kind: 'message',
    risk,
    score,
    confidence: llmVerdict.confidence,
    summary,
    indicators: dedupe(indicators).slice(0, 14),
    recommendedActions: actions.slice(0, 8),
    urls: urlReport.findings,
    engines,
    disclaimer: DISCLAIMER,
    createdAt: new Date().toISOString(),
  };
}
