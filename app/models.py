"""Shared data contracts. AI proposes quotes; deterministic code verifies, parses and compares."""
from __future__ import annotations
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class Dimension(str, Enum):
    metric = "metric"
    value = "value"
    unit = "unit"
    population = "population"
    time_window = "time_window"
    conditions = "conditions"
    strength = "strength"


DIMENSIONS = [d.value for d in Dimension]


class Status(str, Enum):
    supported = "supported"
    contradicted = "contradicted"
    unknown = "unknown"


class VerdictStatus(str, Enum):
    SUPPORTED_BY_SUPPLIED_EVIDENCE = "SUPPORTED_BY_SUPPLIED_EVIDENCE"
    NOT_SUPPORTED = "NOT_SUPPORTED"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"


class Span(BaseModel):
    start: int
    end: int
    quote: str


class DimensionValue(BaseModel):
    dimension: str
    raw: Optional[str] = None            # verbatim text from the source, None = not stated
    span: Optional[Span] = None          # verified character span in the source text
    data: dict[str, Any] = Field(default_factory=dict)   # parsed by code, never by the model
    verified: bool = True                # False = a proposed quote was NOT found verbatim
    notes: list[str] = Field(default_factory=list)


class Frame(BaseModel):
    role: str                            # "claim" | "evidence"
    text: str
    dimensions: dict[str, DimensionValue]


class DimensionComparison(BaseModel):
    dimension: str
    status: Status
    reason_code: str
    explanation: str
    claim_raw: Optional[str] = None
    evidence_raw: Optional[str] = None
    claim_span: Optional[Span] = None
    evidence_span: Optional[Span] = None
    needs_human: bool = False            # True whenever the status is unknown: a person should look at it


class LanguageRisk(BaseModel):
    """Wording risk, kept separate from the seven dimensions. A risk is NOT a proven factual contradiction."""
    category: str                        # ABSOLUTE_LANGUAGE | GUARANTEE | SUPERLATIVE | COMPARATIVE | CAUSAL | PROMOTIONAL_CERTAINTY | TERMINOLOGY_CHANGE | BROADER_APPLICABILITY | MISSING_QUALIFIER | SEMANTIC_FLAG
    severity: str                        # "review" (withholds approval) | "note" (shown, does not block)
    source: str = "rule"                 # rule | model
    title: str
    explanation: str
    resolution: str                      # what evidence or qualification would resolve it
    claim_span: Optional[Span] = None
    evidence_span: Optional[Span] = None


class Verdict(BaseModel):
    status: VerdictStatus
    needs_human: bool
    summary: str
    abstain_reasons: list[str] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)


class RewriteResult(BaseModel):
    text: Optional[str]
    source: str                          # deterministic_template | llm | reviewer_edit | none
    passes_recheck: bool
    frame: Optional[Frame] = None
    comparisons: list[DimensionComparison] = Field(default_factory=list)
    language_risks: list[LanguageRisk] = Field(default_factory=list)
    verdict: Optional[Verdict] = None
    notes: list[str] = Field(default_factory=list)


class Review(BaseModel):
    id: str
    engine_version: str
    extractor_mode: str                  # heuristic | llm | heuristic_fallback
    degraded: bool = False
    warnings: list[str] = Field(default_factory=list)
    claim_text: str
    evidence_text: str
    claim_frame: Frame
    evidence_frame: Frame
    comparisons: list[DimensionComparison]
    language_risks: list[LanguageRisk] = Field(default_factory=list)
    language_review: str = "rules"       # rules | rules+model | rules (model unavailable)
    verdict: Verdict
    rewrite: Optional[RewriteResult] = None


class ReviewRequest(BaseModel):
    claim_text: str = Field(default="")
    evidence_text: str = Field(default="")


class RewriteRequest(BaseModel):
    candidate_text: Optional[str] = None  # reviewer-edited rewrite to verify instead of generating one
