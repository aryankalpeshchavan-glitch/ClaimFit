import type { Comparison, LanguageRisk, VerdictStatus } from "../types";

export interface HeroSample {
  claim_text: string;
  evidence_text: string;
  verdict_status: VerdictStatus;
  verdict_title: string;
  comparisons: Comparison[];
  language_risks: LanguageRisk[];
}

export const HERO_SAMPLE: HeroSample = {
  claim_text: "Our platform cuts setup time by 40% for every business.",
  evidence_text: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
  verdict_status: "NOT_SUPPORTED",
  verdict_title: "Not supported by the evidence",
  comparisons: [
    {
      dimension: "metric",
      status: "supported",
      reason_code: "METRIC_MATCH",
      explanation: "Claim and evidence measure the same thing.",
      claim_raw: "setup time",
      evidence_raw: "setup time",
      claim_span: {
        start: 18,
        end: 28,
        quote: "setup time",
      },
      evidence_span: {
        start: 67,
        end: 77,
        quote: "setup time",
      },
      needs_human: false,
    },
    {
      dimension: "value",
      status: "contradicted",
      reason_code: "VALUE_EXCEEDS_EVIDENCE",
      explanation: "The claim states 40; the evidence supports 30. The draft also omits the evidence's statistic (median).",
      claim_raw: "40",
      evidence_raw: "30",
      claim_span: {
        start: 32,
        end: 34,
        quote: "40",
      },
      evidence_span: {
        start: 86,
        end: 88,
        quote: "30",
      },
      needs_human: false,
    },
    {
      dimension: "unit",
      status: "supported",
      reason_code: "UNIT_MATCH",
      explanation: "Same unit in claim and evidence.",
      claim_raw: "%",
      evidence_raw: "%",
      claim_span: {
        start: 34,
        end: 35,
        quote: "%",
      },
      evidence_span: {
        start: 88,
        end: 89,
        quote: "%",
      },
      needs_human: false,
    },
    {
      dimension: "population",
      status: "contradicted",
      reason_code: "POPULATION_WIDENED",
      explanation: "The draft widens the audience to “every business”; the evidence covers “120 small-business customers”.",
      claim_raw: "every business",
      evidence_raw: "120 small-business customers",
      claim_span: {
        start: 40,
        end: 54,
        quote: "every business",
      },
      evidence_span: {
        start: 20,
        end: 48,
        quote: "120 small-business customers",
      },
      needs_human: false,
    },
    {
      dimension: "time_window",
      status: "unknown",
      reason_code: "QUALIFIER_OMITTED",
      explanation: "The evidence is limited to “30-day test”; the draft drops that time qualifier.",
      claim_raw: null,
      evidence_raw: "30-day test",
      claim_span: null,
      evidence_span: {
        start: 5,
        end: 16,
        quote: "30-day test",
      },
      needs_human: true,
    },
    {
      dimension: "conditions",
      status: "unknown",
      reason_code: "CONDITION_OMITTED",
      explanation: "The evidence applies “using Pro”; the draft drops that condition.",
      claim_raw: null,
      evidence_raw: "using Pro",
      claim_span: null,
      evidence_span: {
        start: 49,
        end: 58,
        quote: "using Pro",
      },
      needs_human: true,
    },
    {
      dimension: "strength",
      status: "contradicted",
      reason_code: "UNIVERSAL_UNSUPPORTED",
      explanation: "Universal wording (“every”) is not supported by an evidence sample.",
      claim_raw: "every",
      evidence_raw: "test",
      claim_span: {
        start: 40,
        end: 45,
        quote: "every",
      },
      evidence_span: {
        start: 12,
        end: 16,
        quote: "test",
      },
      needs_human: false,
    },
  ],
  language_risks: [
    {
      category: "CAUSAL",
      severity: "note",
      source: "rule",
      title: "Attributes the change to the product",
      explanation: "Present-tense action verbs such as “cuts” attribute the change to the product. The evidence reports that a number moved.",
      resolution: "Prefer past-tense, observed wording that names the test, for example “fell by 30% in a 30-day test”.",
      claim_span: {
        start: 13,
        end: 17,
        quote: "cuts",
      },
      evidence_span: null,
    },
    {
      category: "ABSOLUTE_LANGUAGE",
      severity: "review",
      source: "rule",
      title: "Absolute wording",
      explanation: "Words like “every” state that something holds without exception. A test of a sample cannot establish that.",
      resolution: "Supply evidence that covers every case, or limit the wording to the group, period and conditions that were actually tested.",
      claim_span: {
        start: 40,
        end: 45,
        quote: "every",
      },
      evidence_span: null,
    },
  ],
};
