import { useEffect, useState } from "react";
import { Link } from "../router";
import { getExamples } from "../api";
import { prefetchChecker } from "../Shell";
import { Reveal } from "../motion/Reveal";
import type { Example } from "../types";

export function Scenarios() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getExamples()
      .then(setExamples)
      .catch(() => setExamples([]));
  }, []);

  const visible = showAll ? examples : examples.slice(0, 5);

  return (
    <section className="section scenarios-section" aria-labelledby="scenarios-h">
      <div className="section-head">
        <h2 id="scenarios-h">Try a scenario</h2>
        <p>Test real pre-packaged scenarios to explore how the engine evaluates different claims.</p>
      </div>

      <Reveal className="scenarios-panel panel">
        <div className="scenarios-inner">
          <div className="scenarios-chips-row">
            <span className="scenarios-label">Preset cases:</span>
            {visible.map((ex) => (
              <Link
                key={ex.id}
                href={`/check?example=${ex.id}`}
                className="chip scenario-chip-link"
                prefetch={prefetchChecker}
              >
                {ex.title}
                <small className="chip-tag">{ex.tag}</small>
              </Link>
            ))}

            {examples.length > 5 && (
              <button
                type="button"
                className="chip link"
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
              >
                {showAll ? "less" : `+${examples.length - 5} more`}
              </button>
            )}
          </div>

          <p className="scenario-note">
            Illustrative teaching scenarios, not a benchmark or real-world validation.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
