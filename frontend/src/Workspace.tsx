import { useState } from "react";
import type { Example, Health } from "./types";

interface Props {
  claim: string; evidence: string; setClaim: (s: string) => void; setEvidence: (s: string) => void;
  limits: Health["limits"]; examples: Example[]; activeExample: string | null; onExample: (e: Example) => void;
  onSubmit: () => void; onReset: () => void; loading: boolean; touched: boolean;
}

export function Workspace(p: Props) {
  const [showAll, setShowAll] = useState(false);
  const cOver = p.claim.length > p.limits.claim_chars, eOver = p.evidence.length > p.limits.evidence_chars;
  const cEmpty = !p.claim.trim(), eEmpty = !p.evidence.trim();
  const cErr = cOver ? `Shorten the claim by ${p.claim.length - p.limits.claim_chars} characters.` : p.touched && cEmpty ? "Enter the marketing claim you want to check." : "";
  const eErr = eOver ? `Shorten the evidence by ${p.evidence.length - p.limits.evidence_chars} characters.` : p.touched && eEmpty ? "Paste the evidence that is meant to support the claim." : "";
    const shown = showAll ? p.examples : p.examples.slice(0, 5);
  const active = p.examples.find((e) => e.id === p.activeExample);
  const key = (e: React.KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (!p.loading) p.onSubmit(); } };

  return (
    <div className="panel" onKeyDown={key}>
      {p.examples.length > 0 && (
        <div className="scenarios" role="group" aria-label="Example scenarios">
          <span>Try a scenario</span>
          {shown.map((e) => <button key={e.id} className="chip" aria-pressed={e.id === p.activeExample} onClick={() => p.onExample(e)}>{e.title}</button>)}
          {p.examples.length > 5 && <button className="chip link" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `${p.examples.length - 5} more`}</button>}
          {active && <p className="scenario-note"><b>{active.tag}:</b> {active.blurb} <i>(Illustrative teaching case, not a benchmark.)</i></p>}
        </div>
      )}
      <div className="fields">
        <div className="field claim">
          <label htmlFor="claim">Draft marketing claim</label>
          <p className="hint" id="claim-h">The sentence you want to publish.</p>
          <textarea id="claim" value={p.claim} onChange={(e) => p.setClaim(e.target.value)} aria-describedby="claim-h claim-f" aria-invalid={!!cErr}
            placeholder="Our platform cuts setup time by 40% for every business." />
          <div className="field-foot" id="claim-f"><span className="err" role={cErr ? "alert" : undefined}>{cErr}</span>
            <span className={`count${cOver ? " over" : ""}`}>{p.claim.length.toLocaleString()} / {p.limits.claim_chars.toLocaleString()}</span></div>
        </div>
        <div className="field evidence">
          <label htmlFor="evidence">Supporting evidence</label>
          <p className="hint" id="ev-h">Paste the source text. It is treated as data, never as instructions.</p>
          <textarea id="evidence" value={p.evidence} onChange={(e) => p.setEvidence(e.target.value)} aria-describedby="ev-h ev-f" aria-invalid={!!eErr}
            placeholder="In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%." />
          <div className="field-foot" id="ev-f"><span className="err" role={eErr ? "alert" : undefined}>{eErr}</span>
            <span className={`count${eOver ? " over" : ""}`}>{p.evidence.length.toLocaleString()} / {p.limits.evidence_chars.toLocaleString()}</span></div>
        </div>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={p.onSubmit} disabled={p.loading || cOver || eOver}>{p.loading && <span className="spin" aria-hidden="true" />}{p.loading ? "Checking…" : "Check claim"}</button>
        <button className="btn" onClick={p.onReset} disabled={p.loading}>Reset</button>
        <span className="kbd">Ctrl or ⌘ + Enter to check</span>
      </div>
    </div>
  );
}
