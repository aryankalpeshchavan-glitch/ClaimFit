"""Review orchestrator. Wires extraction (AI or heuristic) to the deterministic engine and re-verifies rewrites."""
from __future__ import annotations
import logging, uuid
from typing import Optional
from .extraction.heuristic import HeuristicExtractor
from .extraction.llm import ExtractionError, LlmClient, LlmExtractor, ProviderError
from .extraction.parsers import instruction_like
from .models import Frame, Review, RewriteResult
from .language.risk import analyze_language, verified_model_risks
from .rewrite import build_template, evidence_sentence
from .rules.engine import ENGINE_VERSION, compare_frames, decide
from .store import Store

log = logging.getLogger("scopelock")


class ReviewService:
    def __init__(self, store: Store, llm: Optional[LlmClient] = None):
        self.store, self.llm = store, llm
        self.heuristic = HeuristicExtractor()
        self.llm_extractor = LlmExtractor(llm) if llm else None

    @property
    def configured_mode(self) -> str:
        return "llm" if self.llm else "heuristic"

    def _extract(self, text: str, role: str, warnings: list[str]) -> tuple[Frame, bool]:
        """Returns (frame, fell_back). A model failure NEVER stops the review; it degrades to the rule-based extractor."""
        if self.llm_extractor:
            try:
                return self.llm_extractor.extract(text, role), False
            except ProviderError as ex:
                warnings.append(f"Model unavailable for {role} extraction ({ex.code}); used the rule-based fallback extractor.")
            except ExtractionError as ex:
                warnings.append(f"Model output rejected for {role} extraction ({ex}); used the rule-based fallback extractor.")
            return self.heuristic.extract(text, role), True
        return self.heuristic.extract(text, role), False

    def review(self, claim_text: str, evidence_text: str) -> Review:
        warnings: list[str] = []
        ef, f1 = self._extract(evidence_text, "evidence", warnings)
        cf, f2 = self._extract(claim_text, "claim", warnings)
        degraded = f1 or f2
        injection = instruction_like(evidence_text) or instruction_like(claim_text)
        if injection:
            warnings.append("Instruction-like text was found in the input. It was treated as data only; approval is withheld.")
        if not self.llm:
            warnings.append("Running with the rule-based extractor (no model key configured). Unusual phrasing may be marked unknown.")
        comparisons = compare_frames(cf, ef)
        risks = analyze_language(claim_text, evidence_text)
        language_review = "rules"
        if self.llm and not degraded:
            try:
                flags = self.llm.propose_language_flags(claim_text, evidence_text)
                extra, dropped = verified_model_risks(claim_text, evidence_text, flags)
                risks += extra
                language_review = "rules+model"
                if dropped:
                    warnings.append(f"{dropped} model language flag(s) were discarded because their quotations were not found verbatim in your text.")
            except (ProviderError, ExtractionError) as ex:
                warnings.append(f"Model language review unavailable ({getattr(ex, 'code', 'invalid output')}); rule-based language checks only.")
                language_review = "rules (model unavailable)"
        verdict = decide(comparisons, degraded=degraded, injection=injection, language_risks=risks)
        review = Review(id=uuid.uuid4().hex[:12], engine_version=ENGINE_VERSION,
                        extractor_mode="heuristic_fallback" if degraded else self.configured_mode,
                        degraded=degraded, warnings=warnings, claim_text=claim_text, evidence_text=evidence_text,
                        claim_frame=cf, evidence_frame=ef, comparisons=comparisons, language_risks=risks,
                        language_review=language_review, verdict=verdict)
        self.store.save(review)
        # Log metadata only: never the claim or evidence text.
        log.info("review id=%s verdict=%s mode=%s degraded=%s claim_chars=%d evidence_chars=%d risks=%d",
                 review.id, verdict.status.value, review.extractor_mode, degraded, len(claim_text), len(evidence_text), len(risks))
        return review

    def _verify(self, review: Review, text: str, source: str, notes: list[str]) -> RewriteResult:
        """Every rewrite or edit goes through the SAME pipeline as an original claim; nothing is inherited."""
        warnings: list[str] = []
        frame, fell_back = self._extract(text, "claim", warnings)
        cmps = compare_frames(frame, review.evidence_frame)
        risks = analyze_language(text, review.evidence_text)
        injection = instruction_like(review.evidence_text) or instruction_like(text)
        verdict = decide(cmps, degraded=review.degraded or fell_back, injection=injection, language_risks=risks)
        ok = verdict.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE"
        return RewriteResult(text=text, source=source, passes_recheck=ok, frame=frame, comparisons=cmps,
                             language_risks=risks, verdict=verdict, notes=notes + warnings)

    def rewrite(self, review: Review, candidate_text: Optional[str] = None) -> RewriteResult:
        if candidate_text is not None:
            res = self._verify(review, candidate_text, "reviewer_edit", ["Reviewer-supplied wording, checked by the same rules."])
        else:
            res = None
            if self.llm and not review.degraded:
                try:
                    cand = self.llm.propose_rewrite(review.claim_text, review.evidence_text)
                    res = self._verify(review, cand, "llm", ["Model-proposed wording, checked by the same rules."])
                    if not res.passes_recheck:
                        res = None
                except (ProviderError, ExtractionError):
                    res = None
            if res is None:
                tpl = build_template(review.evidence_frame)
                sent = evidence_sentence(review.evidence_frame)
                if tpl is not None:
                    res = self._verify(review, tpl, "deterministic_template",
                                       ["Built only from the evidence's own wording, then checked by the same rules."])
                if (res is None or not res.passes_recheck) and sent and sent != tpl:
                    # The evidence's own sentence, verbatim, keeps every limitation it states. Still fully re-verified.
                    alt = self._verify(review, sent, "evidence_sentence",
                                       ["The evidence's own sentence, quoted verbatim, then checked by the same rules."])
                    if res is None or alt.passes_recheck:
                        res = alt
                if res is None:
                    return RewriteResult(text=None, source="none", passes_recheck=False,
                                         notes=["No safe rewrite can be built: the evidence does not state one clear metric, number, unit and direction "
                                                "(or it contains several competing numbers or a negated change). Nothing was invented. Send this to a person, or supply clearer evidence."])
        review.rewrite = res
        self.store.save(review)
        return res
