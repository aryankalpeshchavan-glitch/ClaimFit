import { useState } from "react";
import { Reveal } from "../motion/Reveal";
import { LANDING_COPY, type FaqItem } from "./copy";

export function Faq() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["why-not-llm"]));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="section faq-section" aria-labelledby="faq-heading">
      <div className="section-head">
        <h2 id="faq-heading">{LANDING_COPY.faq.title}</h2>
        <p>Common questions about deterministic claim verification and safety boundaries.</p>
      </div>

      <Reveal className="faq-list-wrapper">
        <div className="panel faq-panel">
          {LANDING_COPY.faq.items.map((item: FaqItem) => {
            const isOpen = openIds.has(item.id);
            return (
              <div key={item.id} className={`faq-item ${isOpen ? "open" : ""}`}>
                <button
                  id={`faq-btn-${item.id}`}
                  type="button"
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={`faq-body-${item.id}`}
                  onClick={() => toggle(item.id)}
                >
                  <span className="faq-question">{item.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div
                  id={`faq-body-${item.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${item.id}`}
                  className="faq-body"
                >
                  <div className="faq-body-inner">
                    <p className="faq-answer-text">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
