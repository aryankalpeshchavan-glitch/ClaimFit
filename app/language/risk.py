"""Language-risk layer. Rule-based, deterministic, separate from the seven dimensions.

A risk means "this wording may go beyond the evidence and a person should look"; it is NOT a proven factual
contradiction. Every risk carries verified character offsets into the original text. A risk is suppressed when the
evidence itself uses the same wording (the evidence then covers it). Severity 'review' withholds approval; 'note' is
shown but does not block.

Known limits: English only; word lists, not understanding. A reworded absolute ("a 100% record") or irony will be missed,
and a listed word used innocently can be flagged. That is why unresolved items go to a person rather than being decided here."""
from __future__ import annotations
import re
from typing import Optional
from ..models import LanguageRisk, Span

I = re.IGNORECASE


def _span(text: str, m: re.Match, group: int = 0) -> Span:
    s, e = m.start(group), m.end(group)
    assert text[s:e] == m.group(group)  # offsets are verified against the original, never trusted from elsewhere
    return Span(start=s, end=e, quote=text[s:e])


def _first(rx: re.Pattern, text: str) -> Optional[re.Match]:
    return rx.search(text)


# (category, severity, regex, title, explanation, resolution)
RULES: list[tuple] = [
    ("BROADER_APPLICABILITY", "review",
     re.compile(r"\b(for\s+businesses\s+(?:of\s+all\s+sizes|like\s+yours)|any\s+(?:business|team|company|customer|user)s?|across\s+(?:all\s+)?industr(?:y|ies)|all\s+industries|worldwide|anywhere|in\s+any\s+(?:market|region|setting)|teams?\s+like\s+yours|works\s+for\s+(?:everyone|any\w*)|for\s+anyone)\b", I),
     "Broader applicability than the evidence",
     "“{q}” implies the result applies beyond the group that was measured.",
     "State who was measured, or add evidence from the wider groups the wording implies."),
    ("ABSOLUTE_LANGUAGE", "review",
     re.compile(r"\b(always|never|every|everyone|everybody|everything|all\s+(?:of\s+)?(?:our\s+|your\s+|the\s+)?\w+|without\s+exception|in\s+every\s+case|each\s+and\s+every)\b", I),
     "Absolute wording",
     "Words like “{q}” state that something holds without exception. A test of a sample cannot establish that.",
     "Supply evidence that covers every case, or limit the wording to the group, period and conditions that were actually tested."),
    ("GUARANTEE", "review",
     re.compile(r"\b(guarantee[sd]?|guaranteed|promise[sd]?|assured|risk[- ]free|foolproof|fail[- ]safe|no\s+risk|ensures?)\b", I),
     "Guarantee-like wording",
     "“{q}” turns an observed result into a promise about future or other cases.",
     "Describe what was observed (for example “fell by 30% in the test”), or provide a warranty or contractual basis."),
    ("SUPERLATIVE", "review",
     re.compile(r"(?:\b(best|fastest|cheapest|easiest|simplest|smartest|greatest|leading|top[- ]rated|unmatched|unrivall?ed|world[- ]class|industry[- ]leading|market[- ]leading|number\s+one|only)\b|#\s*1\b)", I),
     "Unsupported superlative",
     "“{q}” implies a ranking against alternatives. Nothing in the supplied evidence names a comparison set or measures competitors.",
     "Add evidence that compares named alternatives on the same measure, or drop the superlative."),
    ("COMPARATIVE", "review",
     re.compile(r"\b((?:better|faster|cheaper|easier|smarter|safer|stronger|more\s+\w+|less\s+\w+)\s+than|outperform\w*|beats?|superior\s+to|ahead\s+of)\b", I),
     "Unsupported comparison",
     "“{q}” compares against something the evidence does not measure.",
     "Provide evidence for both sides of the comparison under the same conditions, or remove the comparison."),
    ("CAUSAL", "review",
     re.compile(r"\b(caused?|causes|because\s+of|thanks\s+to|due\s+to|resulted\s+in|results\s+in|led\s+to|leads\s+to|drove|drives|responsible\s+for|is\s+why|proves?|proved|proven\s+to)\b", I),
     "Causal wording",
     "“{q}” asserts that one thing produced another. A before/after observation in a test does not by itself show cause.",
     "Provide a controlled comparison or other causal evidence, or use observational wording such as “was associated with” or “fell by”."),
    ("CAUSAL", "note",
     re.compile(r"\b(cuts?|reduces?|slashes|lowers?|boosts?|improves?|speeds?\s+up|saves?|eliminates?|doubles|halves)\b", I),
     "Attributes the change to the product",
     "Present-tense action verbs such as “{q}” attribute the change to the product. The evidence reports that a number moved.",
     "Prefer past-tense, observed wording that names the test, for example “fell by 30% in a 30-day test”."),
    ("PROMOTIONAL_CERTAINTY", "review",
     re.compile(r"\b(proven|undeniabl[ye]|scientifically|clinically|instantly|instant|effortless(?:ly)?|flawless(?:ly)?|zero|completely|totally|entirely|100\s*%|perfect(?:ly)?|never\s+fails?)\b", I),
     "Excess certainty",
     "“{q}” signals more certainty than a sampled result supports.",
     "Replace with the measured figure and its context, or add evidence that justifies the certainty (for example a published method)."),
    ("PROMOTIONAL_CERTAINTY", "note",
     re.compile(r"\b(revolutionary|game[- ]chang\w+|incredible|amazing|unbelievable|dramatic(?:ally)?|massive(?:ly)?|skyrocket\w*|transform\w*|supercharge\w*)\b", I),
     "Promotional tone",
     "“{q}” is promotional colour. It is not rejected on its own, but it adds weight the numbers do not carry.",
     "Consider letting the measured result speak; keep the adjective only if you are comfortable it is fair."),
]

# Qualifiers that limit evidence; if the evidence has one and the claim drops it, the claim reads stronger than the source.
EVIDENCE_QUALIFIERS = re.compile(
    r"\b(preliminary|pilot|early\s+results?|self[- ]reported|survey(?:ed)?|anecdotal|estimated|projected|simulated|internal(?:ly)?|"
    r"small\s+sample|non[- ]randomi[sz]ed|unaudited|in\s+our\s+(?:own\s+)?(?:test|testing|data)|approximately|roughly|self[- ]selected|"
    r"vendor[- ](?:run|reported)|case\s+study)\b", I)

# Related-but-not-equivalent terms. If the evidence uses one and the claim uses a different one of the same group
# (and not the evidence's), the meaning may have shifted.
TERM_GROUPS: list[tuple[str, list[str]]] = [
    ("what is being timed", ["setup", "onboarding", "implementation", "installation", "activation", "configuration", "time to value", "time-to-value", "time to first value"]),
    ("who was measured", ["customers", "users", "clients", "accounts", "subscribers", "members", "visitors"]),
    ("money measure", ["revenue", "profit", "sales", "income", "margin", "bookings", "savings", "cost", "price", "spend"]),
    ("loss measure", ["churn", "cancellations", "attrition", "downgrades", "refunds"]),
    ("speed measure", ["speed", "latency", "load time", "response time", "throughput", "uptime"]),
    ("engagement measure", ["engagement", "retention", "adoption", "usage", "activity", "satisfaction"]),
    ("conversion measure", ["conversion", "sign-ups", "signups", "trials", "leads", "purchases"]),
    ("work measure", ["productivity", "efficiency", "output", "throughput", "performance"]),
]


def _word_rx(term: str) -> re.Pattern:
    return re.compile(r"(?<![A-Za-z])" + re.escape(term).replace(r"\ ", r"[\s-]+") + r"(?:s|es)?(?![A-Za-z])", I)


def _norm(q: str) -> str:
    return re.sub(r"[\s\-]+", " ", q.lower()).strip()


def analyze_language(claim: str, evidence: str) -> list[LanguageRisk]:
    risks: list[LanguageRisk] = []
    seen: set[tuple[str, int]] = set()
    ev_norm = _norm(evidence)

    for cat, sev, rx, title, why, fix in RULES:
        for m in rx.finditer(claim):
            q = m.group(0)
            if _norm(q) in ev_norm:           # the evidence uses the same words, so the evidence covers it
                continue
            key = (cat, m.start())
            # overlapping matches describe the same words: keep the first (rules are ordered most specific first)
            if key in seen or any(r.claim_span and m.start() < r.claim_span.end and r.claim_span.start < m.end() for r in risks):
                continue
            seen.add(key)
            # a 'note' never duplicates a 'review' for the same words
            if sev == "note" and any(r.claim_span and r.claim_span.start == m.start() and r.severity == "review" for r in risks):
                continue
            risks.append(LanguageRisk(category=cat, severity=sev, title=title, explanation=why.format(q=q), resolution=fix, claim_span=_span(claim, m)))

    for m in EVIDENCE_QUALIFIERS.finditer(evidence):
        q = m.group(0)
        if _norm(q) in _norm(claim):
            continue
        risks.append(LanguageRisk(
            category="MISSING_QUALIFIER", severity="review", title="Evidence limitation not carried into the draft",
            explanation=f"The evidence describes its result as “{q}”, but the draft does not carry that limitation, so it reads as firmer than its source.",
            resolution="Keep the limitation in the wording (for example “in a preliminary pilot”) or supply stronger evidence.",
            evidence_span=_span(evidence, m)))
        break  # one is enough to send it to a person

    for label, terms in TERM_GROUPS:
        in_claim = [(t, _word_rx(t).search(claim)) for t in terms]
        in_claim = [(t, m) for t, m in in_claim if m]
        in_ev = [(t, _word_rx(t).search(evidence)) for t in terms]
        in_ev = [(t, m) for t, m in in_ev if m]
        if not in_claim or not in_ev:
            continue
        ev_terms = {t for t, _ in in_ev}
        if any(t in ev_terms for t, _ in in_claim):   # the claim also uses a word the evidence uses
            continue
        (ct, cm), (et, em) = in_claim[0], in_ev[0]
        risks.append(LanguageRisk(
            category="TERMINOLOGY_CHANGE", severity="review", title="Terminology changed",
            explanation=f"The draft says “{cm.group(0)}” where the evidence says “{em.group(0)}” ({label}). These are related but not necessarily the same thing.",
            resolution=f"Use the evidence’s term, or show that “{cm.group(0)}” and “{em.group(0)}” are measured the same way.",
            claim_span=_span(claim, cm), evidence_span=_span(evidence, em)))
    risks.sort(key=lambda r: (r.claim_span.start if r.claim_span else 10**9, r.category))
    return risks


def verified_model_risks(claim: str, evidence: str, flags: list[dict]) -> tuple[list[LanguageRisk], int]:
    """Turn model-proposed flags into risks ONLY if every quotation is found verbatim in the original text.
    Returns (risks, dropped_count). Model flags can only add review items; they never remove or approve anything."""
    out, dropped = [], 0
    for f in flags:
        cq, eq = f.get("claim_quote"), f.get("evidence_quote")
        cs = es = None
        if cq:
            i = claim.find(cq)
            if i < 0: dropped += 1; continue
            cs = Span(start=i, end=i + len(cq), quote=cq)
        if eq:
            j = evidence.find(eq)
            if j < 0: dropped += 1; continue
            es = Span(start=j, end=j + len(eq), quote=eq)
        if not cs and not es:
            dropped += 1; continue
        out.append(LanguageRisk(
            category="SEMANTIC_FLAG", severity="review", source="model", title=f.get("title", "Possible meaning mismatch")[:80],
            explanation=(f.get("note") or "A model flagged a possible mismatch in meaning.")[:300],
            resolution="A person should compare the two passages and decide whether the wording stays within the evidence.",
            claim_span=cs, evidence_span=es))
    return out, dropped
