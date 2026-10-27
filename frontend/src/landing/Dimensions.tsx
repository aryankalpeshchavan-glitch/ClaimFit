import { useState, type KeyboardEvent } from "react";
import { DIM_LABEL, DIM_HELP, STATUS_LABEL, reasonLabel } from "../labels";
import { statusTone } from "../ui";
import { Reveal } from "../motion/Reveal";
import type { Dimension } from "../types";
import { HERO_SAMPLE } from "./heroSample";
import { LANDING_COPY } from "./copy";

const ALL_DIMENSIONS: Dimension[] = [
  "metric",
  "value",
  "unit",
  "population",
  "time_window",
  "conditions",
  "strength",
];

export function Dimensions() {
  const [selected, setSelected] = useState<Dimension>("value");

  const activeCmp = HERO_SAMPLE.comparisons.find((c) => c.dimension === selected);
  const tone = activeCmp ? statusTone(activeCmp.status) : "warn";

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % ALL_DIMENSIONS.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + ALL_DIMENSIONS.length) % ALL_DIMENSIONS.length;
    } else {
      return;
    }
    const nextDim = ALL_DIMENSIONS[nextIndex];
    setSelected(nextDim);
    const targetBtn = document.getElementById(`dim-tab-${nextDim}`);
    targetBtn?.focus();
  };

  return (
    <section className="section dimensions-section" aria-labelledby="dim-explorer-h">
      <div className="section-head">
        <h2 id="dim-explorer-h">{LANDING_COPY.dimensions.title}</h2>
        <p>{LANDING_COPY.dimensions.subtitle}</p>
      </div>

      <Reveal className="dimensions-explorer-wrap">
        <div className="dimensions-two-pane panel">
          {/* Tablist on left (desktop) / top scrollable (mobile) */}
          <div
            className="dimensions-nav"
            role="tablist"
            aria-label="Seven comparison dimensions"
            aria-orientation="vertical"
          >
            {ALL_DIMENSIONS.map((dim, idx) => {
              const cmp = HERO_SAMPLE.comparisons.find((c) => c.dimension === dim);
              const isSelected = selected === dim;
              const dimTone = cmp ? statusTone(cmp.status) : "warn";

              return (
                <button
                  key={dim}
                  id={`dim-tab-${dim}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`dim-panel-${dim}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`dim-tab-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelected(dim)}
                  onMouseEnter={() => setSelected(dim)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <span className={`dim-status-indicator ${dimTone}`} aria-hidden="true" />
                  <div className="dim-tab-text">
                    <span className="dim-tab-title">{DIM_LABEL[dim]}</span>
                    <small className="dim-tab-help">{DIM_HELP[dim]}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Worked example on right panel */}
          <div
            id={`dim-panel-${selected}`}
            role="tabpanel"
            aria-labelledby={`dim-tab-${selected}`}
            className="dim-panel-content"
            key={selected}
          >
            <div className="dim-panel-head">
              <div>
                <span className="dim-badge">Dimension focus</span>
                <h3 className="dim-title">{DIM_LABEL[selected]}</h3>
                <p className="dim-summary">{DIM_HELP[selected]}</p>
              </div>

              {activeCmp && (
                <div className={`tag ${tone} dim-status-tag`}>
                  {STATUS_LABEL[activeCmp.status]}
                </div>
              )}
            </div>

            <div className="dim-worked-example">
              <div className="dim-quotes-grid">
                <div className="quote-box">
                  <span className="quote-label">In draft claim:</span>
                  <div className="quote-content">
                    {activeCmp?.claim_span?.quote ? (
                      <mark className={`dim-quote-mark ${tone}`}>
                        “{activeCmp.claim_span.quote}”
                      </mark>
                    ) : (
                      <span className="quote-none">Not stated in draft</span>
                    )}
                  </div>
                </div>

                <div className="quote-box">
                  <span className="quote-label">In supplied evidence:</span>
                  <div className="quote-content">
                    {activeCmp?.evidence_span?.quote ? (
                      <mark className={`dim-quote-mark ${tone}`}>
                        “{activeCmp.evidence_span.quote}”
                      </mark>
                    ) : (
                      <span className="quote-none">Not stated in evidence</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="dim-reason-box">
                <span className="dim-reason-title">Engine finding:</span>
                <p className="dim-reason-text">
                  {activeCmp ? (activeCmp.explanation || reasonLabel(activeCmp.reason_code)) : "Evaluating dimension…"}
                </p>
                <small className="dim-reason-sub">
                  Verified character positions: Claim [{activeCmp?.claim_span?.start ?? "-"},{" "}
                  {activeCmp?.claim_span?.end ?? "-"}] · Evidence [{activeCmp?.evidence_span?.start ?? "-"},{" "}
                  {activeCmp?.evidence_span?.end ?? "-"}]
                </small>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
