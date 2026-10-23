export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface RiskIndicator {
  label: string;
  detail: string;
  severity: 'info' | 'warn' | 'danger';
}

export interface UrlFinding {
  url: string;
  host: string;
  checked: boolean;
  verdict: 'clean' | 'malicious' | 'unchecked';
  threatTypes: string[];
  notes: string[];
}

export interface MessageAnalysis {
  kind: 'message';
  risk: RiskLevel;
  score: number; // 0-100
  confidence: number | null; // 0-1
  summary: string;
  indicators: RiskIndicator[];
  recommendedActions: string[];
  urls: UrlFinding[];
  engines: EngineReport[];
  disclaimer: string;
  createdAt: string;
}

export interface LabelScore {
  label: string;
  score: number;
}

export interface MediaVerdict {
  task: 'ai-generated-image' | 'face-manipulation';
  model: string;
  available: boolean;
  topLabel: string | null;
  manipulationProbability: number | null; // 0-1
  labels: LabelScore[];
  explanation: string;
  error?: string;
}

export interface PhotoAnalysis {
  kind: 'photo';
  risk: RiskLevel;
  score: number;
  confidence: number | null;
  summary: string;
  verdicts: MediaVerdict[];
  fileName: string;
  fileSize: number;
  recommendedActions: string[];
  disclaimer: string;
  createdAt: string;
}

export interface FrameResult {
  index: number;
  timestamp: number; // seconds
  manipulationProbability: number;
  topLabel: string | null;
}

export interface VideoAnalysis {
  kind: 'video';
  risk: RiskLevel;
  score: number;
  confidence: number | null;
  summary: string;
  model: string;
  framesAnalyzed: number;
  durationSeconds: number | null;
  frames: FrameResult[];
  suspiciousTimestamps: number[];
  fileName: string;
  fileSize: number;
  recommendedActions: string[];
  disclaimer: string;
  createdAt: string;
}

export type AnalysisResult = MessageAnalysis | PhotoAnalysis | VideoAnalysis;

export interface EngineReport {
  name: string;
  available: boolean;
  detail: string;
}

export interface ApiError {
  error: string;
  code:
    | 'setup_required'
    | 'invalid_input'
    | 'too_large'
    | 'rate_limited'
    | 'unauthorized'
    | 'upstream_failed'
    | 'timeout'
    | 'server_error';
  setup?: string[];
}
