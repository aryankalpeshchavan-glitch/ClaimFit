"""Model-assisted language flags, with a MOCKED provider only. Real provider behaviour has not been tested."""
import json, httpx
from .test_llm_adapter import EV_Q, CL_Q, reply, svc
from .conftest import EVIDENCE

CLAIM = "Median setup time fell by 30% in a 30-day test of 120 small-business customers using Pro."

def provider(flags_payload):
    def h(req):
        body = json.loads(req.content); content = body["messages"][0]["content"]
        if "flags" in body["system"]:
            return reply(flags_payload)
        return reply(EV_Q if "30-day test of 120 small-business customers using Pro, median" in content and "CLAIM:" not in content else
                     {"metric": "setup time", "value_with_unit": "30%", "population": "120 small-business customers", "time_window": "30-day test",
                      "conditions": "using Pro", "strength": {"quote": "fell", "level": "observed"}})
    return h

def test_verified_model_flag_adds_review_and_withholds_approval():
    flag = {"category": "terminology", "title": "Possible meaning shift", "note": "Check wording.", "claim_quote": "setup time", "evidence_quote": "setup time"}
    r = svc(provider({"flags": [flag]})).review(CLAIM, EVIDENCE)
    assert r.language_review == "rules+model"
    assert any(x.source == "model" and x.category == "SEMANTIC_FLAG" for x in r.language_risks)
    assert r.verdict.status.value == "NEEDS_HUMAN_REVIEW"

def test_model_flag_with_invented_quote_is_discarded_and_reported():
    flag = {"category": "ambiguity", "title": "t", "note": "n", "claim_quote": "quote that is not there", "evidence_quote": None}
    r = svc(provider({"flags": [flag]})).review(CLAIM, EVIDENCE)
    assert not any(x.source == "model" for x in r.language_risks)
    assert any("discarded" in w for w in r.warnings)

def test_model_cannot_approve_or_clear_anything_it_has_no_such_field():
    r = svc(provider({"flags": [], "verdict": "SUPPORTED"})).review("Our platform cuts setup time by 40% for every business.", EVIDENCE)
    assert r.verdict.status.value == "NOT_SUPPORTED"                  # extra field rejected; fallback to rules
    assert r.language_review == "rules (model unavailable)"

def test_invalid_flag_schema_keeps_rule_based_language_checks():
    r = svc(provider("not json")).review("Pro caused median setup time to fall by 30% in a 30-day test of 120 small-business customers using Pro.", EVIDENCE)
    assert any(x.category == "CAUSAL" for x in r.language_risks) and r.verdict.status.value == "NEEDS_HUMAN_REVIEW"
    assert any("language review unavailable" in w.lower() for w in r.warnings)

def test_flag_provider_timeout_does_not_crash_or_fake_model_review():
    calls = {"n": 0}
    def h(req):
        body = json.loads(req.content)
        if "flags" in body["system"]:
            raise httpx.ReadTimeout("slow", request=req)
        return provider({"flags": []})(req)
    r = svc(h).review(CLAIM, EVIDENCE)
    assert r.language_review == "rules (model unavailable)" and not r.degraded
