from app.extraction.heuristic import HeuristicExtractor
from app.extraction.frame import build_frame
from .conftest import EVIDENCE, DRAFT

def test_spans_match_original_text():
    f = HeuristicExtractor().extract(EVIDENCE, "evidence")
    for d in f.dimensions.values():
        if d.span:
            assert EVIDENCE[d.span.start:d.span.end] == d.span.quote == d.raw

def test_invalid_offsets_are_rejected_not_trusted():
    f = build_frame("short text", "claim", {"value": (5, 999)})
    assert f.dimensions["value"].verified is False

def test_claim_dimensions():
    f = HeuristicExtractor().extract(DRAFT, "claim")
    assert f.dimensions["value"].raw == "40" and f.dimensions["unit"].raw == "%"
    assert f.dimensions["population"].data["scope"] == "universal"
    assert f.dimensions["time_window"].raw is None and f.dimensions["conditions"].raw is None
