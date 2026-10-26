"""Rule-based extractor. Clearly labeled as the no-API-key / provider-failure fallback."""
from __future__ import annotations
from ..models import Frame
from . import parsers as P
from .frame import build_frame


class HeuristicExtractor:
    mode = "heuristic"

    def extract(self, text: str, role: str) -> Frame:
        locs = P.locate_all(text)
        level, span = P.strength_level(text, role)
        locs["strength"] = span
        return build_frame(text, role, locs, level=level)
