import pytest
from app.examples import EXAMPLES
from app.service import ReviewService
from app.store import Store

@pytest.mark.parametrize("ex", EXAMPLES, ids=[e["id"] for e in EXAMPLES])
def test_example_outcome_is_pinned(ex):
    svc = ReviewService(Store(":memory:"))
    r = svc.review(ex["claim"], ex["evidence"])
    assert r.verdict.status.value == ex["expected"]
    if "candidate" in ex:
        assert svc.rewrite(r, ex["candidate"]).verdict.status.value == ex["candidate_expected"]

def test_critical_example_full_contract():
    ex = next(e for e in EXAMPLES if e["id"] == "critical")
    svc = ReviewService(Store(":memory:")); r = svc.review(ex["claim"], ex["evidence"])
    by = {c.dimension: c for c in r.comparisons}
    assert by["value"].reason_code == "VALUE_EXCEEDS_EVIDENCE" and by["population"].reason_code == "POPULATION_WIDENED"
    assert by["time_window"].status.value == "unknown" and by["conditions"].status.value == "unknown"
    assert by["strength"].reason_code == "UNIVERSAL_UNSUPPORTED"
    w = svc.rewrite(r)
    assert w.text == ex["evidence"] and w.passes_recheck and w.verdict.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE"
    # the rewrite earned its verdict itself: it carries its own comparisons, not the original's
    assert w.comparisons and all(c.status.value == "supported" for c in w.comparisons)

def test_every_example_is_distinct_and_labelled():
    assert len({e["id"] for e in EXAMPLES}) == len(EXAMPLES)
    assert all(e.get("tag") and e.get("blurb") for e in EXAMPLES)
