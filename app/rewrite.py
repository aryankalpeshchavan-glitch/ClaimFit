"""Constrained rewrite: built only from the evidence's own verified wording. Always re-verified by the caller."""
from __future__ import annotations
from typing import Optional
from .models import Frame

TEST_WORDS = ("test", "trial", "study", "pilot", "period", "window")


def build_template(ef: Frame) -> Optional[str]:
    d = ef.dimensions
    for k in ("metric", "value", "unit"):
        if d[k].raw is None or not d[k].verified:
            return None
    direction = d["value"].data.get("direction")
    if direction not in ("decrease", "increase"):
        return None
    # Refuse rather than guess: several competing numbers, or a negated change, cannot be rewritten safely.
    if d["value"].data.get("candidates", 0) > 1 or d["value"].data.get("negated"):
        return None
    verb = "fell" if direction == "decrease" else "rose"
    unit_raw = d["unit"].raw.strip()
    mod = d["value"].data.get("modifier_raw")            # keep "up to" / "at least" / "about" so the bound is not lost
    val = (mod + " " if mod else "") + d["value"].raw + (unit_raw if unit_raw == "%" else " " + unit_raw)
    stat = d["value"].data.get("statistic_raw")
    core = f"{(stat + ' ') if stat else ''}{d['metric'].raw} {verb} by {val}"
    tw = d["time_window"].raw if d["time_window"].verified else None
    pop = d["population"].raw if d["population"].verified and d["population"].data.get("scope") == "bounded" else None
    cond = d["conditions"].raw if d["conditions"].verified else None
    if tw:
        lead = f"In a {tw}" if tw.lower().split()[-1].split("-")[-1] in TEST_WORDS else f"Over {tw}"
        if pop:
            lead += f" of {pop}"
    elif pop:
        lead = f"Among {pop}"
    else:
        lead = "In the supplied evidence"
    if cond:
        lead += f" {cond}"
    sentence = f"{lead}, {core}."
    return sentence[0].upper() + sentence[1:]


def evidence_sentence(ef: Frame) -> Optional[str]:
    """Fallback candidate: the evidence's own sentence that holds the number, verbatim. Keeps every qualifier the evidence has."""
    v = ef.dimensions["value"]
    if not v.span or v.data.get("candidates", 0) > 1:
        return None
    text, pos = ef.text, v.span.start
    start = max([text.rfind(x, 0, pos) for x in (". ", "! ", "? ", "\n")] + [-1])
    start = 0 if start < 0 else start + 2
    ends = [i for i in (text.find(x, pos) for x in (". ", "! ", "? ", "\n")) if i >= 0]
    end = min(ends) + 1 if ends else len(text)
    sent = text[start:end].strip()
    return sent if 0 < len(sent) <= 600 else None
