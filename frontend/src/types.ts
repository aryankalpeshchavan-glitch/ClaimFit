export type Status = "supported" | "contradicted" | "unknown";
export type VerdictStatus = "SUPPORTED_BY_SUPPLIED_EVIDENCE" | "NOT_SUPPORTED" | "NEEDS_HUMAN_REVIEW";
export const DIMENSIONS = ["metric", "value", "unit", "population", "time_window", "conditions", "strength"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export interface Span { start: number; end: number; quote: string }
export interface Comparison {
  dimension: Dimension; status: Status; reason_code: string; explanation: string;
  claim_raw: string | null; evidence_raw: string | null; claim_span: Span | null; evidence_span: Span | null; needs_human: boolean;
}
export interface LanguageRisk {
  category: string; severity: "review" | "note"; source: "rule" | "model"; title: string; explanation: string; resolution: string;
  claim_span: Span | null; evidence_span: Span | null;
}
export interface Verdict { status: VerdictStatus; needs_human: boolean; summary: string; abstain_reasons: string[]; counts: Record<string, number> }
export interface RewriteResult {
  text: string | null; source: string; passes_recheck: boolean; comparisons: Comparison[]; language_risks: LanguageRisk[];
  verdict: Verdict | null; notes: string[];
}
export interface Review {
  id: string; engine_version: string; extractor_mode: "heuristic" | "llm" | "heuristic_fallback"; degraded: boolean; warnings: string[];
  claim_text: string; evidence_text: string; comparisons: Comparison[]; language_risks: LanguageRisk[]; language_review: string;
  verdict: Verdict; rewrite: RewriteResult | null;
}
export interface Health { status: string; extractor_mode: "heuristic" | "llm"; llm_configured: boolean; engine_version: string; language_review: string; limits: { claim_chars: number; evidence_chars: number } }
export interface Example { id: string; title: string; tag: string; blurb: string; claim: string; evidence: string; expected: VerdictStatus; candidate?: string }
