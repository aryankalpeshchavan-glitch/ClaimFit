import { Fragment, useCallback, useLayoutEffect, useRef, useState } from "react";
import { buildSegments, type Mark } from "./highlight";
import type { Comparison, LanguageRisk } from "./types";
import { statusTone } from "./ui";

interface Props {
  claim: string; evidence: string; comparisons: Comparison[]; risks: LanguageRisk[];
  selected: string | null; onSelect: (id: string | null) => void;
}

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Doc({ text, marks, pane, selected, onSelect, docRef }: {
  text: string; marks: Mark[]; pane: "claim" | "evidence"; selected: string | null; onSelect: (id: string | null) => void; docRef: React.RefObject<HTMLDivElement>;
}) {
  const segs = buildSegments(text, marks);
  const tone = new Map(marks.map((m) => [m.id, m.tone]));
  return (
    <div ref={docRef} className={`doc${selected ? " has-sel" : ""}`} data-pane={pane} tabIndex={0} aria-label={pane === "claim" ? "Draft claim text with highlights" : "Evidence text with highlights"}>
      {segs.map((s, i) => {
        if (!s.ids.length) return <Fragment key={i}>{s.text}</Fragment>;   // plain text node: React escapes it, no HTML is built
        const isSel = selected !== null && s.ids.includes(selected);
        const primary = isSel ? (selected as string) : s.ids[0];
        return (
          <mark key={i} data-ids={s.ids.join(" ")} className={`${tone.get(primary) ?? "warn"}${isSel ? " sel" : ""}`}
            onClick={() => onSelect(isSel ? null : primary)} title="Click to focus this finding">{s.text}</mark>
        );
      })}
    </div>
  );
}

export function Inspector({ claim, evidence, comparisons, risks, selected, onSelect }: Props) {
  const wrap = useRef<HTMLDivElement>(null), claimRef = useRef<HTMLDivElement>(null), evRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<{ d: string; x1: number; y1: number; x2: number; y2: number } | null>(null);

  const claimMarks: Mark[] = [], evMarks: Mark[] = [];
  comparisons.forEach((c) => {
    const tone = statusTone(c.status);
    if (c.claim_span) claimMarks.push({ id: c.dimension, span: c.claim_span, tone });
    if (c.evidence_span) evMarks.push({ id: c.dimension, span: c.evidence_span, tone });
  });
  risks.forEach((r, i) => {
    if (r.claim_span) claimMarks.push({ id: `risk:${i}`, span: r.claim_span, tone: "lr" });
    if (r.evidence_span) evMarks.push({ id: `risk:${i}`, span: r.evidence_span, tone: "lr" });
  });

  const find = (root: HTMLElement | null, id: string) =>
    root ? ([...root.querySelectorAll<HTMLElement>("mark")].find((m) => (m.dataset.ids ?? "").split(" ").includes(id)) ?? null) : null;

  const layout = useCallback(() => {
    const w = wrap.current;
    if (!w || !selected) return setThread(null);
    const a = find(claimRef.current, selected), b = find(evRef.current, selected);
    const pa = claimRef.current, pb = evRef.current;
    if (!a || !b || !pa || !pb) return setThread(null);
    const W = w.getBoundingClientRect(), A = a.getBoundingClientRect(), B = b.getBoundingClientRect(), PA = pa.getBoundingClientRect(), PB = pb.getBoundingClientRect();
    if (PB.left < PA.right - 4) return setThread(null);                         // stacked (mobile) layout: no thread
    const inside = (r: DOMRect, p: DOMRect) => r.bottom > p.top && r.top < p.bottom;
    if (!inside(A, PA) || !inside(B, PB)) return setThread(null);                // target scrolled out of its pane
    const x1 = PA.right - W.left, y1 = A.top + A.height / 2 - W.top, x2 = PB.left - W.left, y2 = B.top + B.height / 2 - W.top;   // anchored at the pane edges, level with each highlight
    const mx = (x1 + x2) / 2;
    setThread({ d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 });
  }, [selected, claim, evidence, comparisons, risks]);

  useLayoutEffect(() => {
    if (!selected) { setThread(null); return; }
    const center = (pane: HTMLDivElement | null) => {
      const m = find(pane, selected);
      if (pane && m) pane.scrollTo({ top: m.offsetTop - pane.clientHeight / 2 + m.offsetHeight / 2, behavior: reduceMotion() ? "auto" : "smooth" });
    };
    center(claimRef.current); center(evRef.current);
    layout();
    const t = window.setTimeout(layout, 380);                                     // after smooth scroll settles
    const ro = new ResizeObserver(layout);
    if (wrap.current) ro.observe(wrap.current);
    [claimRef.current, evRef.current].forEach((p) => p?.addEventListener("scroll", layout, { passive: true }));
    window.addEventListener("resize", layout);
    return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener("resize", layout); [claimRef.current, evRef.current].forEach((p) => p?.removeEventListener("scroll", layout)); };
  }, [selected, layout]);

  return (
    <div className="panel">
      <div className="inspector" ref={wrap}>
        <svg className="thread" aria-hidden="true">
          {thread && <g key={`${selected}-${thread.d}`}><path d={thread.d} /><circle cx={thread.x1} cy={thread.y1} r="4" /><circle cx={thread.x2} cy={thread.y2} r="4" /></g>}
        </svg>
        <div className="pane"><h3>Draft claim <span>{claim.length} characters</span></h3>
          <Doc text={claim} marks={claimMarks} pane="claim" selected={selected} onSelect={onSelect} docRef={claimRef} /></div>
        <div className="pane"><h3>Supplied evidence <span>{evidence.length} characters</span></h3>
          <Doc text={evidence} marks={evMarks} pane="evidence" selected={selected} onSelect={onSelect} docRef={evRef} /></div>
      </div>
      <div className="legend" aria-label="Highlight legend">
        <span><i style={{ background: "rgba(47,127,121,.45)" }} />Supported</span>
        <span><i style={{ background: "rgba(180,68,63,.5)" }} />Contradicted</span>
        <span><i style={{ background: "rgba(169,112,26,.5)" }} />Needs review</span>
        <span><i style={{ background: "transparent", borderBottom: "2px dashed rgba(169,112,26,.9)", height: 6, borderRadius: 0 }} />Language risk</span>
      </div>
      <p className="insp-hint">{selected ? "The thread links the draft wording to the evidence wording it was compared with. Press Escape or select the finding again to clear." : "Select a finding below, or click a highlight, to see which words it rests on. Only text found verbatim in your input is highlighted."}</p>
    </div>
  );
}
