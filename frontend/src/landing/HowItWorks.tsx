import { useRef } from "react";
import { Reveal } from "../motion/Reveal";
import { useInView } from "../motion/useInView";
import { LANDING_COPY } from "./copy";

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { threshold: 0.2 });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section how-it-works-section"
      aria-labelledby="hiw-heading"
    >
      <div className="section-head">
        <h2 id="hiw-heading">{LANDING_COPY.howItWorks.title}</h2>
        <p>{LANDING_COPY.howItWorks.subtitle}</p>
      </div>

      <div className="hiw-container">
        {/* Connecting line */}
        <div className={`hiw-track-line ${inView ? "drawn" : ""}`} aria-hidden="true">
          <div className="hiw-track-progress" />
        </div>

        <div className="hiw-steps-grid">
          {LANDING_COPY.howItWorks.steps.map((st, idx) => (
            <Reveal key={st.number} staggerIndex={idx} className="hiw-step-col">
              <div className="hiw-card panel">
                <div className="hiw-step-header">
                  <span className="hiw-step-num">{st.number}</span>
                  <div className="hiw-step-icon" aria-hidden="true">
                    {idx === 0 && (
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.8" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="14" y2="17" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.8" fill="none">
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="12" r="3" />
                        <path d="M9 12h6" strokeDasharray="2 2" />
                        <path d="M12 7v10" strokeLinecap="round" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="1.8" fill="none">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="hiw-step-title">{st.title}</h3>
                <p className="hiw-step-desc">{st.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
