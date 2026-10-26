import type { Dimension, Status, VerdictStatus } from "./types";

export const DIM_LABEL: Record<Dimension, string> = {
  metric: "Metric", value: "Value / statistic", unit: "Unit", population: "Population",
  time_window: "Time window", conditions: "Conditions", strength: "Strength of wording",
};
export const DIM_HELP: Record<Dimension, string> = {
  metric: "What is being measured", value: "The number and how it was summarised", unit: "Percent, hours, points…",
  population: "Who was measured", time_window: "How long it was measured", conditions: "Plan, setting or product used", strength: "Observed result or a broader promise",
};
export const STATUS_LABEL: Record<Status, string> = { supported: "Supported", contradicted: "Contradicted", unknown: "Needs review" };
export const VERDICT_TITLE: Record<VerdictStatus, string> = {
  SUPPORTED_BY_SUPPLIED_EVIDENCE: "Supported by the supplied evidence",
  NOT_SUPPORTED: "Not supported by the evidence",
  NEEDS_HUMAN_REVIEW: "Needs human review",
};
export const VERDICT_TONE: Record<VerdictStatus, "ok" | "bad" | "warn"> = { SUPPORTED_BY_SUPPLIED_EVIDENCE: "ok", NOT_SUPPORTED: "bad", NEEDS_HUMAN_REVIEW: "warn" };
export const MODE_LABEL: Record<string, string> = {
  heuristic: "Rule-based extraction (no model configured)",
  llm: "Model-assisted extraction + deterministic checks",
  heuristic_fallback: "Model failed — rule-based fallback used",
};
export function reasonLabel(code: string): string {
  const s = code.toLowerCase().replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const CATEGORY_LABEL: Record<string, string> = {
  ABSOLUTE_LANGUAGE: "Absolute wording", GUARANTEE: "Guarantee-like", SUPERLATIVE: "Superlative", COMPARATIVE: "Comparison", CAUSAL: "Causal wording",
  PROMOTIONAL_CERTAINTY: "Promotional certainty", TERMINOLOGY_CHANGE: "Terminology changed", BROADER_APPLICABILITY: "Broader applicability",
  MISSING_QUALIFIER: "Dropped limitation", SEMANTIC_FLAG: "Model-flagged meaning",
};
export const ABSTAIN_LABEL: Record<string, string> = {
  EXTRACTION_DEGRADED: "The model step failed, so approval is withheld.",
  INSTRUCTION_LIKE_EVIDENCE: "Instruction-like text was found in the input. It was treated as data only.",
  LANGUAGE_RISK_UNRESOLVED: "Wording risks below need a person’s judgement.",
};
