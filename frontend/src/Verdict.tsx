import type { Review } from "./types";
import { ABSTAIN_LABEL, DIM_LABEL, MODE_LABEL, VERDICT_TITLE, reasonLabel } from "./labels";
import { DIMENSIONS } from "./types";
import { Icon, statusTone, verdictTone } from "./ui";

export function VerdictCard({ review, onPickDimension }: { review: Review; onPickDimension: (d: string) => void }) {
  const v = review.verdict, tone = verdictTone(v.status);
  const open = review.comparisons.filter((c) => c.status !== "supported");
  const byDim = new Map(review.comparisons.map((c) => [c.dimension, c]));
  const risks = review.language_risks.filter((r) => r.severity === "review").length;
  return (
    <section className={`panel verdict ${tone}`} aria-labelledby="verdict-title" role="region">
      <div>
        <h2 id="verdict-title">{VERDICT_TITLE[v.status]}</h2>
        <p className="sum">{v.summary}</p>
        {open.length > 0 && (
          <ul className="why" aria-label="Why">
            {open.slice(0, 5).map((c) => (
              <li key={c.dimension}><span className="ic" style={{ color: `var(--${statusTone(c.status) === "bad" ? "bad" : "warn"})` }}><Icon tone={statusTone(c.status)} size={15} /></span>
                <span><b>{DIM_LABEL[c.dimension]}:</b> {c.explanation}</span></li>
            ))}
            {open.length > 5 && <li><span className="ic" /><span>…and {open.length - 5} more in the findings below.</span></li>}
          </ul>
        )}
        {v.abstain_reasons.filter((r) => ABSTAIN_LABEL[r]).map((r) => <p key={r} className="note-panel">{ABSTAIN_LABEL[r]}</p>)}
        <p className="scope">Checked only against the evidence you supplied. “Supported” never means the claim is objectively true.</p>
        <div className="meta-line">
          <span>{MODE_LABEL[review.extractor_mode]}</span><span>Engine {review.engine_version}</span>
          <span>{risks > 0 ? `${risks} language risk${risks > 1 ? "s" : ""} to judge` : "No blocking language risks"}</span>
        </div>
      </div>
      <div className="rail" role="group" aria-label="Seven dimensions">
        {DIMENSIONS.map((d, i) => {
          const c = byDim.get(d); const t = c ? statusTone(c.status) : "warn";
          return <button key={d} className={t} style={{ ["--i" as string]: i }} onClick={() => onPickDimension(d)}
            aria-label={`${DIM_LABEL[d]}: ${c ? reasonLabel(c.reason_code) : "no result"}`} title={`${DIM_LABEL[d]}: ${c ? reasonLabel(c.reason_code) : ""}`}><Icon tone={t} size={14} /></button>;
        })}
        <span className="rail-cap">Seven dimensions</span>
      </div>
    </section>
  );
}
