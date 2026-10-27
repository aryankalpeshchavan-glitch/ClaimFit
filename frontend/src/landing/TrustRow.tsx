import { Reveal } from "../motion/Reveal";
import { LANDING_COPY } from "./copy";

export function TrustRow() {
  return (
    <section className="section trust-section" aria-label="Trust and soundness principles">
      <div className="section-head">
        <h2>Not a vibe check</h2>
        <p>Three architectural guarantees behind every decision.</p>
      </div>

      <div className="trust-grid">
        {LANDING_COPY.trustRow.map((item, idx) => (
          <Reveal key={idx} staggerIndex={idx} className="trust-card-wrapper">
            <div className="panel trust-card">
              <div className="trust-card-num" aria-hidden="true">
                0{idx + 1}
              </div>
              <h3 className="trust-card-title">{item.title}</h3>
              <p className="trust-card-desc">{item.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
