"""Builds a verified Frame from located spans. Used by BOTH the heuristic and the LLM extractor,
so quotes are always checked against the original text and parsed by deterministic code."""
from __future__ import annotations
from typing import Optional
from ..models import DIMENSIONS, DimensionValue, Frame, Span
from . import parsers as P


def build_frame(text: str, role: str, locs: dict, level: Optional[str] = None,
                unverified: Optional[dict] = None) -> Frame:
    unverified = unverified or {}
    dims: dict[str, DimensionValue] = {}
    for d in DIMENSIONS:
        if d in unverified:
            dims[d] = DimensionValue(dimension=d, raw=unverified[d], span=None, verified=False,
                                     notes=["Proposed quote was not found verbatim in the source text."])
            continue
        loc = locs.get(d)
        if not loc:
            dims[d] = DimensionValue(dimension=d)
            continue
        s, e = loc
        if not (0 <= s < e <= len(text)):
            dims[d] = DimensionValue(dimension=d, raw=None, verified=False, notes=["Invalid span offsets."])
            continue
        quote = text[s:e]
        data = P.parse_dimension(d, quote, text, role, level)
        notes = []
        if d == "value":
            kind, raw_mod = P.quantifier_before(text[:s])
            data["modifier"], data["modifier_raw"] = kind, raw_mod
            if kind:
                notes.append(f"The number is qualified by “{raw_mod}”.")
        if d == "value" and data.get("candidates", 0) > 1:
            notes.append("Several different numeric values appear in this text.")
        dims[d] = DimensionValue(dimension=d, raw=quote, span=Span(start=s, end=e, quote=quote), data=data, notes=notes)
    if role == "claim":
        # A model may never downgrade universal or superlative wording: deterministic scan escalates.
        sd = dims["strength"]
        det_level, det_span = P.strength_level(text, "claim")
        if det_level in ("universal", "superlative") and sd.data.get("level") != det_level:
            q = text[det_span[0]:det_span[1]]
            dims["strength"] = DimensionValue(dimension="strength", raw=q,
                                              span=Span(start=det_span[0], end=det_span[1], quote=q),
                                              data={"level": det_level},
                                              notes=["Level set by deterministic wording scan."])
    return Frame(role=role, text=text, dimensions=dims)
