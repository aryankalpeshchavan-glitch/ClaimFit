"""Deterministic comparison engine. Pure Python: no model calls, no network, no randomness.
Rule: unknown is NEVER promoted to supported. 'Supported' means the supplied evidence supports the
wording, not that the claim is objectively true."""
from __future__ import annotations
from typing import Optional
from ..models import LanguageRisk, DimensionComparison, DimensionValue, Frame, Status, Verdict, VerdictStatus, DIMENSIONS
from ..extraction.parsers import GROUP_NOUNS, TIME_SECONDS

ENGINE_VERSION = "rules-1.1"
S, C, U = Status.supported, Status.contradicted, Status.unknown


def _cmp(dim, status, code, why, c: DimensionValue, e: DimensionValue) -> DimensionComparison:
    return DimensionComparison(dimension=dim, status=status, reason_code=code, explanation=why,
                               claim_raw=c.raw, evidence_raw=e.raw, claim_span=c.span, evidence_span=e.span)


def _metric(c, e):
    if c.raw is None: return U, "CLAIM_METRIC_MISSING", "The draft does not name what is being measured."
    if e.raw is None: return U, "EVIDENCE_METRIC_MISSING", "The evidence does not clearly name the measured metric."
    ct, et = set(c.data.get("tokens", [])), set(e.data.get("tokens", []))
    if not ct or not et: return U, "METRIC_UNPARSEABLE", "The metric could not be parsed reliably."
    if ct <= et or et <= ct: return S, "METRIC_MATCH", "Claim and evidence measure the same thing."
    if ct & et: return U, "METRIC_AMBIGUOUS", "The metrics partly overlap; a reviewer should confirm they are the same."
    return C, "METRIC_MISMATCH", "The claim measures something different from the evidence."


def _unit_of(f: Optional[Frame]) -> Optional[str]:
    return f.dimensions["unit"].data.get("unit") if f else None


def _unit(c, e):
    if c.raw is None: return U, "CLAIM_UNIT_MISSING", "The draft gives no unit for its number."
    if e.raw is None: return U, "EVIDENCE_UNIT_MISSING", "The evidence gives no unit for its number."
    cu, eu = c.data.get("unit"), e.data.get("unit")
    if not cu or not eu: return U, "UNIT_UNRECOGNIZED", "A unit could not be recognised; a reviewer should check it."
    if cu == eu: return S, "UNIT_MATCH", "Same unit in claim and evidence."
    if {cu, eu} == {"percent", "percentage_points"}:
        return U, "UNIT_PERCENT_VS_POINTS", "Percent and percentage points are different and are never treated as interchangeable."
    if cu in TIME_SECONDS and eu in TIME_SECONDS:
        return S, "UNIT_CONVERTED", f"Units differ but convert exactly ({cu} to {eu})."
    return C, "UNIT_MISMATCH", f"The claim uses {cu}; the evidence uses {eu}."


def _value(c, e, cf: Frame, ef: Frame):
    if c.raw is None: return U, "CLAIM_VALUE_MISSING", "The draft states no number to check."
    if e.raw is None: return U, "EVIDENCE_VALUE_MISSING", "The evidence states no number to check against."
    cn, en = c.data.get("number"), e.data.get("number")
    if cn is None or en is None: return U, "VALUE_UNPARSEABLE", "A number could not be parsed reliably."
    if c.data.get("candidates", 0) > 1 or e.data.get("candidates", 0) > 1:
        return U, "VALUE_AMBIGUOUS", "More than one number appears in the text, so the compared number is ambiguous."
    cd, ed = c.data.get("direction"), e.data.get("direction")
    if c.data.get("negated") != e.data.get("negated"):
        return C, "DIRECTION_NEGATED", "One text negates the change (for example “did not fall”) and the other does not, so they say opposite things."
    if cd is None or ed is None:
        if c.data.get("valence_only") or e.data.get("valence_only"):
            return U, "DIRECTION_UNCLEAR", "“Improved/better” does not say whether the number went up or down; a reviewer must confirm the direction."
        return U, "DIRECTION_UNCLEAR", "The direction of change (increase or decrease) is unclear."
    if cd != ed: return C, "DIRECTION_MISMATCH", "The claim and evidence describe opposite directions of change."
    cu, eu = _unit_of(cf), _unit_of(ef)
    if cu and eu and cu != eu:
        if cu in TIME_SECONDS and eu in TIME_SECONDS:
            cn = cn * TIME_SECONDS[cu] / TIME_SECONDS[eu]
        else:
            return U, "VALUE_UNIT_INCOMPATIBLE", "The numbers use different units, so they cannot be compared directly."
    cs, es = c.data.get("statistic"), e.data.get("statistic")
    extra = ""
    if es and not cs: extra = f" The draft also omits the evidence's statistic ({es})."
    if abs(cn - en) > 1e-9:
        if cn > en: return C, "VALUE_EXCEEDS_EVIDENCE", f"The claim states {c.raw}; the evidence supports {e.raw}.{extra}"
        return U, "VALUE_BELOW_EVIDENCE", f"The claim understates the evidence ({c.raw} vs {e.raw}); a reviewer should decide if that wording is acceptable."
    cm, em = c.data.get("modifier"), e.data.get("modifier")
    if cm != em:
        word = c.data.get("modifier_raw") or e.data.get("modifier_raw")
        return U, "VALUE_QUALIFIER_MISMATCH", (f"The wording around the number differs (“{word}”). A bound or approximation such as "
                                              "“at least”, “up to” or “about” is not the same as the exact figure the evidence reports.")
    if es and not cs: return U, "STATISTIC_OMITTED", f"Numbers match but the draft drops the statistic ({es}) that the evidence states."
    if cs and es and cs != es: return C, "STATISTIC_MISMATCH", f"The claim implies {cs}; the evidence reports {es}."
    if cs and not es: return U, "STATISTIC_NOT_IN_EVIDENCE", f"The claim names a statistic ({cs}) the evidence does not state."
    return S, "VALUE_MATCH", "The number, direction and statistic match the evidence."


def _population(c, e):
    ce, ee = c.raw is None, e.raw is None
    if ce and ee: return S, "NOT_STATED_IN_EITHER", "Neither text states a population, so there is nothing to compare."
    if ce: return U, "POPULATION_OMITTED", "The evidence names a specific population; the draft does not."
    if ee: return U, "POPULATION_NOT_IN_EVIDENCE", "The draft names a population the evidence does not state."
    cs, es = c.data.get("scope"), e.data.get("scope")
    if cs == "universal":
        if es == "universal": return S, "POPULATION_MATCH", "Both state a universal scope."
        return C, "POPULATION_WIDENED", f"The draft widens the audience to “{c.raw}”; the evidence covers “{e.raw}”."
    if es == "universal": return S, "POPULATION_COVERED", "The evidence covers all populations."
    cn, en = c.data.get("n"), e.data.get("n")
    if cn and en and cn != en: return C, "POPULATION_SIZE_MISMATCH", "The sample sizes differ between claim and evidence."
    ct, et = set(c.data.get("tokens", [])), set(e.data.get("tokens", []))
    if ct == et and ct: return S, "POPULATION_MATCH", "Same population in claim and evidence."
    cq, eq = {t for t in ct if t not in GROUP_NOUNS}, {t for t in et if t not in GROUP_NOUNS}
    if ct != et and cq == eq:
        return U, "POPULATION_TERMINOLOGY_REVIEW", (f"The draft says “{c.raw}” and the evidence says “{e.raw}”. The qualifying words match but the group "
                                                    "noun differs, so a reviewer should confirm they mean the same group.")
    if ct < et: return C, "POPULATION_WIDENED", f"The draft’s audience (“{c.raw}”) is broader than the evidence’s (“{e.raw}”)."
    if ct > et: return U, "POPULATION_NARROWER_REVIEW", "The draft names a narrower group than the evidence; a reviewer should confirm the result applies to it."
    return U, "POPULATION_AMBIGUOUS", "The groups cannot be compared reliably; a reviewer should check."


def _time(c, e):
    ce, ee = c.raw is None, e.raw is None
    if ce and ee: return S, "NOT_STATED_IN_EITHER", "Neither text states a time window."
    if ce: return U, "QUALIFIER_OMITTED", f"The evidence is limited to “{e.raw}”; the draft drops that time qualifier."
    if ee: return U, "TIME_NOT_IN_EVIDENCE", "The draft states a time window the evidence does not."
    cd, ed = c.data, e.data
    if not cd or not ed: return U, "TIME_UNPARSEABLE", "A time window could not be parsed reliably."
    cn, cu, en, eu = cd["n"], cd["unit"], ed["n"], ed["unit"]
    if cu != eu:
        mult = {"day": 1, "week": 7}
        if cu in mult and eu in mult: cn, en = cn * mult[cu], en * mult[eu]
        else: return U, "TIME_UNITS_NOT_COMPARABLE", "The time units differ and do not convert exactly."
    if cn == en: return S, "TIME_MATCH", "Same time window."
    if cn > en: return C, "TIME_WINDOW_EXCEEDS", "The draft claims a longer period than the evidence covers."
    return U, "TIME_WINDOW_NARROWER_REVIEW", "The draft states a shorter period than the evidence; a reviewer should confirm."


def _conditions(c, e):
    ci, ei = set(c.data.get("items", [])) if c.raw else set(), set(e.data.get("items", [])) if e.raw else set()
    if not ci and not ei: return S, "NOT_STATED_IN_EITHER", "Neither text states conditions such as a plan or setting."
    if ei and not ci: return U, "CONDITION_OMITTED", f"The evidence applies “{e.raw}”; the draft drops that condition."
    if ci and not ei: return U, "CONDITION_NOT_IN_EVIDENCE", "The draft states a condition the evidence does not."
    if ci == ei: return S, "CONDITION_MATCH", "Same conditions."
    if ci > ei: return C, "CONDITION_NOT_IN_EVIDENCE", "The draft adds conditions the evidence does not support."
    if ci < ei: return U, "CONDITION_OMITTED", "The draft drops some of the evidence’s conditions."
    return C, "CONDITION_MISMATCH", "The draft’s conditions differ from the evidence’s."


def _strength(c, e):
    cl, el = c.data.get("level"), e.data.get("level")
    if cl is None: return U, "STRENGTH_UNCLEAR", "The strength of the draft’s wording could not be determined."
    if cl == "universal":
        if el == "universal": return S, "STRENGTH_MATCH", "Evidence also makes a universal statement."
        return C, "UNIVERSAL_UNSUPPORTED", f"Universal wording (“{c.raw}”) is not supported by an evidence sample."
    if cl == "superlative":
        if el == "superlative": return S, "STRENGTH_MATCH", "Evidence makes a matching comparative statement."
        return U, "SUPERLATIVE_NEEDS_COMPARATIVE_EVIDENCE", "Superlatives need evidence naming the comparison set."
    if cl == "generalized":
        if el in ("generalized", "universal"): return S, "STRENGTH_MATCH", "Evidence supports general wording."
        return U, "GENERALIZED_FROM_OBSERVED", "The draft states a general result; the evidence reports an observed test result."
    if el is None: return U, "EVIDENCE_STRENGTH_UNCLEAR", "The evidence does not clearly report an observed result."
    return S, "STRENGTH_MATCH", "The draft reports an observed result, as the evidence does."


def compare_frames(cf: Frame, ef: Frame) -> list[DimensionComparison]:
    out = []
    for d in DIMENSIONS:
        c, e = cf.dimensions[d], ef.dimensions[d]
        if not c.verified or not e.verified:
            out.append(_cmp(d, U, "SPAN_UNVERIFIABLE", "A proposed quote could not be verified verbatim in the source, so this dimension is unresolved.", c, e))
            continue
        if d == "value": st, code, why = _value(c, e, cf, ef)
        else: st, code, why = {"metric": _metric, "unit": _unit, "population": _population,
                               "time_window": _time, "conditions": _conditions, "strength": _strength}[d](c, e)
        out.append(_cmp(d, st, code, why, c, e))
    metric = next(x for x in out if x.dimension == "metric")
    if metric.status != S:
        for x in out:
            if x.dimension == "value" and x.status == C:
                x.explanation = (f"{x.explanation} Not treated as a contradiction because the metric itself is unresolved "
                                 f"({metric.reason_code}); numbers about different or unclear measures are not comparable.")
                x.reason_code, x.status = "VALUE_METRIC_UNRESOLVED", U
    for x in out:
        x.needs_human = x.status == U
    return out


def decide(comparisons: list[DimensionComparison], *, degraded: bool = False, injection: bool = False,
           language_risks: Optional[list[LanguageRisk]] = None) -> Verdict:
    counts = {s.value: sum(1 for x in comparisons if x.status == s) for s in Status}
    open_risks = [r for r in (language_risks or []) if r.severity == "review"]
    counts["language_risks"] = len(open_risks)
    reasons: list[str] = []
    if counts["contradicted"]:
        status, human = VerdictStatus.NOT_SUPPORTED, False
        n, u = counts["contradicted"], counts["unknown"]
        summary = f"{n} of 7 dimensions contradict the evidence" + (f" and {u} cannot be resolved from it." if u else ".")
    elif counts["unknown"]:
        status, human = VerdictStatus.NEEDS_HUMAN_REVIEW, True
        u = counts["unknown"]
        summary = f"{u} of 7 dimensions cannot be resolved from the supplied evidence, so a person needs to look." if u else "Wording risks need a person’s judgement before this can be approved."
        reasons = [x.reason_code for x in comparisons if x.status == U] + (["LANGUAGE_RISK_UNRESOLVED"] if open_risks else [])
    else:
        status, human = VerdictStatus.SUPPORTED_BY_SUPPLIED_EVIDENCE, False
        summary = "Every checked dimension is supported by the supplied evidence. This does not prove the claim is objectively true."
        if degraded or injection or open_risks:
            status, human = VerdictStatus.NEEDS_HUMAN_REVIEW, True
            reasons = (["EXTRACTION_DEGRADED"] if degraded else []) + (["INSTRUCTION_LIKE_EVIDENCE"] if injection else []) \
                + (["LANGUAGE_RISK_UNRESOLVED"] if open_risks else [])
            summary = "All dimensions looked supported, but approval is withheld: " + ", ".join(reasons).lower().replace("_", " ") + "."
    return Verdict(status=status, needs_human=human, summary=summary, abstain_reasons=reasons, counts=counts)
