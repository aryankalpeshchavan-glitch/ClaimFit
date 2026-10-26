import type { Comparison, Dimension, LanguageRisk } from "./types";
import { CATEGORY_LABEL, DIM_HELP, DIM_LABEL, reasonLabel } from "./labels";
import { Chevron, Icon, StatusTag, statusTone } from "./ui";

export function Findings({ comparisons, selected, onSelect }: { comparisons: Comparison[]; selected: string | null; onSelect: (id: string | null) => void }) {
  return (
    <div className="panel findings" role="list">
      {comparisons.map((c, i) => {
        const open = selected === c.dimension, panelId = `f-${c.dimension}`;
        return (
          <div key={c.dimension} role="listitem" className={`finding${open ? " open sel" : ""}`} style={{ ["--i" as string]: i }}>
            <button aria-expanded={open} aria-controls={panelId} onClick={() => onSelect(open ? null : c.dimension)}>
              <span style={{ color: `var(--${statusTone(c.status)})` }}><Icon tone={statusTone(c.status)} /></span>
              <span className="f-name">{DIM_LABEL[c.dimension as Dimension]}<small>{DIM_HELP[c.dimension as Dimension]}</small></span>
              <span className="f-reason">{reasonLabel(c.reason_code)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><StatusTag status={c.status} /><Chevron /></span>
            </button>
            <div className="detail" id={panelId} role="region" aria-label={`${DIM_LABEL[c.dimension as Dimension]} details`}>
              <div><div className="detail-in">
                <p>{c.explanation}</p>
                <div className="quotes">
                  <div className="quote"><small>Draft says</small>{c.claim_raw ? <q>{c.claim_raw}</q> : <span className="none">Not stated in the draft</span>}</div>
                  <div className="quote"><small>Evidence says</small>{c.evidence_raw ? <q>{c.evidence_raw}</q> : <span className="none">Not stated in the evidence</span>}</div>
                </div>
                {c.needs_human && <div className="human"><Icon tone="warn" size={15} />A person should review this finding.</div>}
                <span className="code">Reason code: {c.reason_code}</span>
              </div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Risks({ risks, selected, onSelect }: { risks: LanguageRisk[]; selected: string | null; onSelect: (id: string | null) => void }) {
  if (!risks.length) return <div className="panel empty">No wording risks found by the rule-based checks. That is not a guarantee: the rules cover a fixed list of patterns in English.</div>;
  return (
    <div className="panel risks">
      {risks.map((r, i) => {
        const id = `risk:${i}`, sel = selected === id;
        return (
          <button key={id} className={`risk${sel ? " sel" : ""}`} aria-pressed={sel} onClick={() => onSelect(sel ? null : id)}>
            <span className="risk-head">{r.title}
              <span className={`tag ${r.severity === "review" ? "warn" : "ok"}`} style={r.severity === "note" ? { color: "var(--ink-2)", background: "var(--sunk)", borderColor: "var(--rule-strong)" } : undefined}>{r.severity === "review" ? "Needs judgement" : "Note"}</span>
              <span className="code">{CATEGORY_LABEL[r.category] ?? r.category}{r.source === "model" ? " · model-flagged, quote verified" : ""}</span></span>
            <p>{r.explanation}</p>
            <p className="fix"><b>What would resolve it:</b> {r.resolution}</p>
          </button>
        );
      })}
    </div>
  );
}
