"""One test per defect found while auditing the engine (rules-1.0 -> rules-1.1). Each failed before its fix."""
from .conftest import EVIDENCE, run

def codes(by): return {k: (v.status.value, v.reason_code) for k, v in by.items()}
BASE = "In a 30-day test of 120 small-business customers using Pro, "

def test_at_least_more_than_up_to_are_not_exact_figures():
    for phrase in ("at least 30%", "more than 30%", "up to 30%", "about 30%"):
        by, v = run(BASE + f"median setup time fell by {phrase}.")
        assert codes(by)["value"] == ("unknown", "VALUE_QUALIFIER_MISMATCH"), phrase
        assert v.status.value == "NEEDS_HUMAN_REVIEW", phrase

def test_matching_bound_in_both_texts_is_supported():
    ev = BASE + "median setup time fell by up to 30%."
    by, v = run(BASE + "median setup time fell by up to 30%.", evidence=ev)
    assert v.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE"

def test_negated_change_is_not_read_as_the_same_direction():
    by, v = run(BASE + "median setup time did not fall by 30%.")
    assert codes(by)["value"] == ("contradicted", "DIRECTION_NEGATED")
    assert v.status.value == "NOT_SUPPORTED"

def test_percentage_number_is_not_captured_as_sample_size():
    from app.extraction.heuristic import HeuristicExtractor
    f = HeuristicExtractor().extract("Median setup time fell by 40 percent for small-business customers in a 30-day test using Pro.", "claim")
    assert f.dimensions["population"].raw == "small-business customers" and f.dimensions["population"].data["n"] is None

def test_improved_is_not_a_direction_and_does_not_contradict():
    by, v = run(BASE + "performance improved by 30%.")
    assert codes(by)["value"] == ("unknown", "DIRECTION_UNCLEAR")
    assert codes(by)["metric"][0] == "unknown" and v.status.value == "NEEDS_HUMAN_REVIEW"

def test_value_contradiction_is_downgraded_when_metric_is_unresolved():
    by, _ = run("Revenue rose by 90%.", evidence=EVIDENCE)
    assert codes(by)["metric"][0] != "supported"
    assert codes(by)["value"][0] != "contradicted"

def test_group_noun_change_is_terminology_review_not_widening():
    by, v = run("In a 30-day test of 120 small businesses using Pro, median setup time fell by 30%.")
    assert codes(by)["population"] == ("unknown", "POPULATION_TERMINOLOGY_REVIEW")
    assert v.status.value == "NEEDS_HUMAN_REVIEW"

def test_dropping_a_real_qualifier_is_still_widening():
    by, _ = run("In a 30-day test of 120 customers using Pro, median setup time fell by 30%.")
    assert codes(by)["population"] == ("contradicted", "POPULATION_WIDENED")

def test_findings_carry_needs_human_flag():
    by, _ = run("Median setup time fell by 30% for 120 small-business customers.")
    assert by["time_window"].needs_human and not by["metric"].needs_human

def test_rewrite_keeps_a_bound_from_the_evidence():
    from app.extraction.heuristic import HeuristicExtractor
    from app.rewrite import build_template
    t = build_template(HeuristicExtractor().extract(BASE + "median setup time fell by up to 30%.", "evidence"))
    assert "by up to 30%" in t

def test_rewrite_refuses_ambiguous_or_negated_evidence():
    from app.extraction.heuristic import HeuristicExtractor
    from app.rewrite import build_template
    X = HeuristicExtractor()
    assert build_template(X.extract(EVIDENCE + " Support tickets fell by 12%.", "evidence")) is None
    assert build_template(X.extract(BASE + "median setup time did not fall by 30%.", "evidence")) is None
