"""Deterministic engine behaviour (owner: verification engine). Heuristic extraction feeds the engine."""
from .conftest import EVIDENCE, DRAFT, run

def codes(by): return {k: (v.status.value, v.reason_code) for k, v in by.items()}

def test_critical_example_is_never_approved():
    by, v = run(DRAFT)
    assert v.status.value == "NOT_SUPPORTED"
    assert codes(by)["value"] == ("contradicted", "VALUE_EXCEEDS_EVIDENCE")
    assert codes(by)["population"] == ("contradicted", "POPULATION_WIDENED")
    assert codes(by)["time_window"] == ("unknown", "QUALIFIER_OMITTED")
    assert codes(by)["conditions"] == ("unknown", "CONDITION_OMITTED")
    assert codes(by)["strength"] == ("contradicted", "UNIVERSAL_UNSUPPORTED")
    assert codes(by)["metric"][0] == "supported" and codes(by)["unit"][0] == "supported"

def test_faithful_wording_is_supported():
    by, v = run(EVIDENCE)
    assert v.status.value == "SUPPORTED_BY_SUPPLIED_EVIDENCE"
    assert all(c.status.value == "supported" for c in by.values())

def test_population_expansion_to_all_customers():
    by, _ = run("In a 30-day test of 120 customers using Pro, median setup time fell by 30%.")
    assert codes(by)["population"] == ("contradicted", "POPULATION_WIDENED")

def test_population_sample_size_mismatch():
    by, _ = run("In a 30-day test of 500 small-business customers using Pro, median setup time fell by 30%.")
    assert codes(by)["population"] == ("contradicted", "POPULATION_SIZE_MISMATCH")

def test_missing_time_and_condition_are_unknown_not_supported():
    by, v = run("Median setup time fell by 30% for 120 small-business customers.")
    assert codes(by)["time_window"][0] == "unknown"
    assert codes(by)["conditions"][0] == "unknown"
    assert v.status.value == "NEEDS_HUMAN_REVIEW" and v.needs_human

def test_longer_time_window_is_contradicted():
    by, _ = run("In a 90-day test of 120 small-business customers using Pro, median setup time fell by 30%.")
    assert codes(by)["time_window"] == ("contradicted", "TIME_WINDOW_EXCEEDS")

def test_statistic_mismatch_mean_vs_median():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, average setup time fell by 30%.")
    assert codes(by)["value"] == ("contradicted", "STATISTIC_MISMATCH")

def test_statistic_omitted_is_unknown():
    by, v = run("In a 30-day test of 120 small-business customers using Pro, setup time fell by 30%.")
    assert codes(by)["value"] == ("unknown", "STATISTIC_OMITTED")
    assert v.status.value == "NEEDS_HUMAN_REVIEW"

def test_percent_vs_percentage_points_is_unknown():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30 percentage points.")
    assert codes(by)["unit"] == ("unknown", "UNIT_PERCENT_VS_POINTS")

def test_unit_mismatch_hours_vs_percent():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, median setup time fell by 2 hours.")
    assert codes(by)["unit"][0] in ("contradicted", "unknown")
    assert codes(by)["value"][0] == "unknown"  # never compared across incompatible units

def test_opposite_direction_is_contradicted():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, median setup time rose by 30%.")
    assert codes(by)["value"] == ("contradicted", "DIRECTION_MISMATCH")

def test_understated_value_not_auto_supported():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, median setup time fell by 20%.")
    assert codes(by)["value"] == ("unknown", "VALUE_BELOW_EVIDENCE")

def test_universal_words_contradicted():
    for w in ("always", "every", "all"):
        by, v = run(f"Setup time fell by 30% {w} time for all customers using Pro.")
        assert v.status.value != "SUPPORTED_BY_SUPPLIED_EVIDENCE"

def test_superlative_needs_comparative_evidence():
    by, v = run("In a 30-day test of 120 small-business customers using Pro, the fastest setup time fell by 30%.")
    assert codes(by)["strength"][0] == "unknown"
    assert v.status.value != "SUPPORTED_BY_SUPPLIED_EVIDENCE"

def test_generalized_present_tense_is_unknown():
    by, _ = run("Pro cuts setup time by 30%.")
    assert codes(by)["strength"] == ("unknown", "GENERALIZED_FROM_OBSERVED")

def test_different_metric_is_contradicted():
    by, _ = run("In a 30-day test of 120 small-business customers using Pro, median revenue fell by 30%.")
    assert codes(by)["metric"][0] == "contradicted"

def test_condition_mismatch_contradicted():
    by, _ = run("In a 30-day test of 120 small-business customers using Basic, median setup time fell by 30%.")
    assert codes(by)["conditions"] == ("contradicted", "CONDITION_MISMATCH")

def test_ambiguous_multiple_numbers_is_unknown():
    by, _ = run(EVIDENCE, evidence=EVIDENCE + " Support tickets fell by 12%.")
    assert codes(by)["value"] == ("unknown", "VALUE_AMBIGUOUS")

def test_empty_evidence_never_supported():
    by, v = run(DRAFT, evidence="No numbers here at all.")
    assert v.status.value != "SUPPORTED_BY_SUPPLIED_EVIDENCE"
    assert codes(by)["value"][0] == "unknown"

def test_unknown_is_never_promoted_property():
    by, v = run("Setup time fell.", evidence="Nothing relevant.")
    assert v.status.value == "NEEDS_HUMAN_REVIEW" or v.status.value == "NOT_SUPPORTED"
