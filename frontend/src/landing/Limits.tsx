import { Reveal } from "../motion/Reveal";
import { LANDING_COPY } from "./copy";

export function Limits() {
  return (
    <section id="limits" className="section limits-section" aria-labelledby="limits-heading">
      <div className="section-head">
        <h2 id="limits-heading">{LANDING_COPY.limits.title}</h2>
        <p>{LANDING_COPY.limits.subtitle}</p>
      </div>

      <Reveal className="limits-grid-wrapper">
        <div className="panel limits-panel">
          <div className="limits-grid">
            {LANDING_COPY.limits.items.map((item, idx) => (
              <div key={idx} className="limit-item">
                <div className="limit-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="8" />
                    <line x1="4" y1="4" x2="16" y2="16" />
                  </svg>
                </div>
                <div className="limit-text">
                  <h3 className="limit-title">{item.title}</h3>
                  <p className="limit-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
