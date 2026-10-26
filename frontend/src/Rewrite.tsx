import { useState } from "react";
import type { Review, RewriteResult } from "./types";
import { DIMENSIONS } from "./types";
import { DIM_LABEL, VERDICT_TITLE, reasonLabel } from "./labels";
import { Icon, statusTone, verdictTone } from "./ui";

interface Props {
  review: Review; draft: string; setDraft: (s: string) => void; result: RewriteResult | null; verifiedText: string | null;
  busy: "suggest" | "verify" | null; error: string; exampleCandidate?: string;
  onSuggest: () => void; onVerify: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  deterministic_template: "Built only from the evidence’s own wording",
  evidence_sentence: "The evidence’s own sentence, quoted verbatim",
  llm: "Model-proposed wording",
  reviewer_edit: "Your edited wording",
};

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}

export function RewritePanel({ review, draft, setDraft, result, verifiedText, busy, error, exampleCandidate, onSuggest, onVerify }: Props) {
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const hasResult = !!result && result.text !== null;
  const stale = hasResult && verifiedText !== draft;
  const current = hasResult && !stale ? result : null;
  const verdict = current?.verdict ?? null;
  const verified = !!current?.passes_recheck;
  const tone = verdict ? verdictTone(verdict.status) : null;
  const open = current ? current.comparisons.filter((c) => c.status !== "supported") : [];
  const risks = current ? current.language_risks : [];

  const doCopy = async () => {
    const suffix = verified ? `\n\n[${VERDICT_TITLE.SUPPORTED_BY_SUPPLIED_EVIDENCE}. Checked only against the supplied evidence; this does not prove the claim is objectively true.]` : "";
    setCopied((await copy(draft + suffix)) ? "ok" : "fail"); window.setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="panel rw">
      <div className="rw-top">
        {!hasResult && !draft && <span className="badge sugg">No wording yet</span>}
        {draft && !hasResult && <span className="badge stale">Typed by you · not verified</span>}
        {hasResult && !stale && result.source !== "reviewer_edit" && <span className="badge sugg">Suggestion · {SOURCE_LABEL[result.source] ?? result.source}</span>}
        {hasResult && !stale && result.source === "reviewer_edit" && <span className="badge sugg">{SOURCE_LABEL.reviewer_edit}</span>}
        {stale && <span className="badge stale">Edited · not verified yet</span>}
        {verdict && tone && <span className={`badge ver-${tone}`}><Icon tone={tone} size={13} />Re-verified: {VERDICT_TITLE[verdict.status]}</span>}
      </div>

      <label htmlFor="rewrite" className="sr">Proposed wording</label>
      <textarea id="rewrite" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000}
        placeholder="Ask for a narrower rewrite, or type your own wording here and re-verify it." />

      <div className="rw-actions">
        <button className="btn" onClick={onSuggest} disabled={!!busy}>{busy === "suggest" && <span className="spin" aria-hidden="true" />}Suggest narrower wording</button>
        <button className="btn primary small" onClick={onVerify} disabled={!!busy || !draft.trim()}>{busy === "verify" && <span className="spin" aria-hidden="true" />}Re-verify this wording</button>
        <button className="btn small" onClick={doCopy} disabled={!draft.trim()}>{verified ? "Copy verified wording" : "Copy wording (not verified)"}</button>
        {exampleCandidate && draft !== exampleCandidate && <button className="chip" onClick={() => setDraft(exampleCandidate)}>Load the example’s inflated edit</button>}
        <span className="toast" role="status">{copied === "ok" ? "Copied." : copied === "fail" ? "Copy failed. Select the text and copy it manually." : ""}</span>
      </div>
      <p className="code">A suggestion is never approved just because it was suggested. Every suggestion and every edit goes through the same seven-dimension check and language-risk review as the original draft.</p>

      {error && <div className="banner bad" role="alert"><span>{error}</span></div>}

      {result && result.text === null && (
        <div className="result-box warn"><div className="result-head"><Icon tone="warn" size={16} />No safe rewrite could be built</div>
          <div className="result-body"><p>{result.notes[0]}</p><p><b>Next step:</b> ask a person to write the wording, or supply evidence that states one metric, number, unit and direction clearly. ScopeLock will not invent evidence.</p></div></div>
      )}

      {stale && <div className="note-panel">The wording changed since the last check. Select “Re-verify this wording” — the earlier result no longer applies to this text.</div>}

      {current && verdict && tone && (
        <div className={`result-box ${tone}`} aria-live="polite">
          <div className="result-head"><Icon tone={tone} size={16} />{verified ? "Passed re-verification" : "Did not pass re-verification"} — {VERDICT_TITLE[verdict.status]}</div>
          <div className="mini">
            {DIMENSIONS.map((d) => { const c = current.comparisons.find((x) => x.dimension === d); if (!c) return null;
              return <div key={d}><span style={{ color: `var(--${statusTone(c.status)})` }}><Icon tone={statusTone(c.status)} size={13} /></span><span><b>{DIM_LABEL[d]}</b> · {reasonLabel(c.reason_code)}</span></div>; })}
          </div>
          <div className="result-body">
            {verified ? <p>Every dimension matches the supplied evidence and no wording risk needs judgement. This is still a check against your evidence only; it does not prove the statement is objectively true.</p>
              : <><p><b>Why it did not pass:</b></p>
                <ul>{open.map((c) => <li key={c.dimension}><b>{DIM_LABEL[c.dimension]}:</b> {c.explanation}</li>)}
                  {risks.filter((r) => r.severity === "review").map((r, i) => <li key={i}><b>{r.title}:</b> {r.explanation}</li>)}
                  {verdict.abstain_reasons.includes("INSTRUCTION_LIKE_EVIDENCE") && <li>Instruction-like text in the input withholds approval.</li>}</ul></>}
            {risks.filter((r) => r.severity === "note").length > 0 && <p className="code">Non-blocking notes: {risks.filter((r) => r.severity === "note").map((r) => r.title).join(", ")}.</p>}
            {current.notes.filter((n) => !SOURCE_LABEL[current.source] || n).slice(0, 3).map((n, i) => <p key={i} className="code">{n}</p>)}
          </div>
        </div>
      )}
      {review.verdict.status === "SUPPORTED_BY_SUPPLIED_EVIDENCE" && !result && <p className="code">The original draft already passed. You can still test an edited version here.</p>}
    </div>
  );
}
