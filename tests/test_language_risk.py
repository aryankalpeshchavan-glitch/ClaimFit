from app.language.risk import analyze_language, verified_model_risks
from app.service import ReviewService
from app.store import Store
from .conftest import EVIDENCE, DRAFT

def cats(claim, ev=EVIDENCE, sev=None):
    return {r.category for r in analyze_language(claim, ev) if sev is None or r.severity == sev}

def test_faithful_wording_has_no_risks():
    assert analyze_language(EVIDENCE, EVIDENCE) == []

def test_critical_draft_flags_absolute_language_with_verified_span():
    rs = analyze_language(DRAFT, EVIDENCE)
    ab = next(r for r in rs if r.category == "ABSOLUTE_LANGUAGE")
    assert DRAFT[ab.claim_span.start:ab.claim_span.end] == ab.claim_span.quote == "every"
    assert ab.resolution and ab.severity == "review"

def test_categories_detected():
    assert "GUARANTEE" in cats("Pro guarantees a 30% drop.")
    assert "SUPERLATIVE" in cats("The fastest setup tool.")
    assert "COMPARATIVE" in cats("Pro is faster than Basic.")
    assert "CAUSAL" in cats("Pro caused the drop.", sev="review")
    assert "BROADER_APPLICABILITY" in cats("Works for businesses of all sizes.")
    assert "PROMOTIONAL_CERTAINTY" in cats("Clinically proven.", sev="review")

def test_adjectives_are_noted_not_blocking():
    rs = analyze_language("A revolutionary result: " + EVIDENCE, EVIDENCE)
    assert rs and all(r.severity == "note" for r in rs)

def test_evidence_that_uses_the_same_word_covers_it():
    assert "ABSOLUTE_LANGUAGE" not in cats("Setup fell for every customer.", "Setup fell for every customer in the test.")

def test_terminology_change_cites_both_sides():
    rs = [r for r in analyze_language("Median onboarding time fell by 30%.", EVIDENCE) if r.category == "TERMINOLOGY_CHANGE"]
    assert rs and rs[0].claim_span.quote.lower() == "onboarding" and rs[0].evidence_span.quote.lower() == "setup"

def test_evidence_limitation_dropped_is_flagged():
    rs = analyze_language("Median setup time fell by 30%.", "In a preliminary pilot, median setup time fell by 30%.")
    assert any(r.category == "MISSING_QUALIFIER" and r.evidence_span.quote == "preliminary" for r in rs)

def test_language_risk_withholds_approval_but_never_contradicts():
    claim = "Pro caused median setup time to fall by 30% in a 30-day test of 120 small-business customers using Pro."
    r = ReviewService(Store(":memory:")).review(claim, EVIDENCE)
    assert r.verdict.status.value == "NEEDS_HUMAN_REVIEW" and "LANGUAGE_RISK_UNRESOLVED" in r.verdict.abstain_reasons
    assert all(c.status.value != "contradicted" for c in r.comparisons)

def test_model_flags_require_verbatim_quotes():
    claim = "The setup is quick."
    ok = {"claim_quote": "setup", "evidence_quote": "setup time", "title": "t", "note": "n"}
    bad = {"claim_quote": "onboarding speed", "evidence_quote": None, "title": "t", "note": "n"}   # not in the claim
    risks, dropped = verified_model_risks(claim, EVIDENCE, [ok, bad, {"title": "x"}])
    assert len(risks) == 1 and dropped == 2 and risks[0].source == "model"
    s, e = risks[0].claim_span, risks[0].evidence_span
    assert claim[s.start:s.end] == "setup" and EVIDENCE[e.start:e.end] == "setup time"
