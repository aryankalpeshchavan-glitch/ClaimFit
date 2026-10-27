import { useEffect, useState } from "react";
import { Link } from "../router";
import { getHealth } from "../api";
import type { Health } from "../types";
import { prefetchChecker } from "../Shell";
import { Magnet } from "../vendor/reactbits/Magnet";
import { ShinyText } from "../vendor/reactbits/ShinyText";
import { HeroDemo } from "./HeroDemo";
import { LANDING_COPY } from "./copy";

export function Hero() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    getHealth()
      .then((h) => {
        setHealth(h);
      })
      .catch(() => {})
      .finally(() => setHealthLoading(false));
  }, []);

  return (
    <section className="hero-section" aria-label="Introduction">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow" role="status">
            {healthLoading || !health ? (
              <span className="eyebrow-pill neutral">ClaimFit checker</span>
            ) : health.llm_configured ? (
              <span className="eyebrow-pill model-ok">
                <i className="status-dot green" aria-hidden="true" />
                Model-assisted · deterministic checks decide
              </span>
            ) : (
              <span className="eyebrow-pill rule-mode">
                <i className="status-dot amber" aria-hidden="true" />
                Rule-based mode · code decides
              </span>
            )}
          </div>

          <h1 className="hero-h1">
            <ShinyText text={LANDING_COPY.hero.headline} speed={5} />
          </h1>

          <p className="hero-sub">{LANDING_COPY.hero.sub}</p>

          <div className="hero-actions">
            <Magnet padding={30} strength={0.2}>
              <Link href="/check" className="btn primary hero-primary-btn" prefetch={prefetchChecker}>
                {LANDING_COPY.hero.ctaPrimary}
              </Link>
            </Magnet>
            <Link href="/check?example=critical" className="btn hero-secondary-btn" prefetch={prefetchChecker}>
              {LANDING_COPY.hero.ctaSecondary}
            </Link>
          </div>

          <p className="hero-disclaimer">{LANDING_COPY.hero.quietNote}</p>
        </div>

        <div className="hero-visual">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
