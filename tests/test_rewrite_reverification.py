"""Rewrites never inherit approval. MOCKED provider only; real provider behaviour is untested."""
import json
from .conftest import EVIDENCE, DRAFT
from .test_llm_adapter import EV_Q, reply, svc
from app.service import ReviewService
from app.store import Store

def test_model_proposed_rewrite_that_inflates_is_rejected_and_template_used():
    def h(req):
        body = json.loads(req.content)
        if "flags" in body["system"]:
            return reply({"flags": []})
        if "rewrite" in body["system"].lower():
            return reply({"rewrite": "Setup time fell by 90% for every business."})
        return reply(EV_Q)
    s = svc(h); r = s.review(DRAFT, EVIDENCE); w = s.rewrite(r)
    # whatever the model proposed, the result is only 'supported' if it earned it through the same pipeline
    assert w.verdict.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE" or not w.passes_recheck
    assert "90%" not in (w.text or "")

def test_user_edit_is_verified_from_scratch_not_inherited():
    s = ReviewService(Store(":memory:")); r = s.review(EVIDENCE, EVIDENCE)        # original passes
    assert r.verdict.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE"
    w = s.rewrite(r, "Setup time fell by 35% for all businesses.")                  # edit does not
    assert not w.passes_recheck and w.verdict.status.value == "NOT_SUPPORTED" and w.source == "reviewer_edit"

def test_evidence_sentence_fallback_keeps_qualifier_and_is_reverified():
    ev = "In a preliminary pilot of 40 teams on Growth, median setup time fell by 20%."
    s = ReviewService(Store(":memory:")); r = s.review("Setup time fell by 20% for everyone.", ev); w = s.rewrite(r)
    assert w.text and "preliminary" in w.text and w.comparisons      # not a bare template that drops the limitation

def test_no_safe_rewrite_when_evidence_has_competing_numbers():
    s = ReviewService(Store(":memory:")); r = s.review("Setup got faster.", EVIDENCE + " Support tickets fell by 12%.")
    w = s.rewrite(r)
    assert w.text is None and not w.passes_recheck and "Nothing was invented" in w.notes[0]
