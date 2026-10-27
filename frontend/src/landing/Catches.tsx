import { Link } from "../router";
import { Reveal } from "../motion/Reveal";
import { prefetchChecker } from "../Shell";
import { GlareHover } from "../vendor/reactbits/GlareHover";
import { LANDING_COPY, type CatchCard } from "./copy";

export function Catches() {
  const renderClaimWithUnderline = (claim: string, stretched: string) => {
    const idx = claim.indexOf(stretched);
    if (idx === -1) {
      return <em>“{claim}”</em>;
    }
    const before = claim.slice(0, idx);
    const after = claim.slice(idx + stretched.length);
    return (
      <span className="catch-claim-quote">
        “{before}
        <mark className="stretched-underline">{stretched}</mark>
        {after}”
      </span>
    );
  };

  return (
    <section id="what-it-catches" className="section catches-section" aria-labelledby="catches-heading">
      <div className="section-head">
        <h2 id="catches-heading">{LANDING_COPY.catches.title}</h2>
        <p>{LANDING_COPY.catches.subtitle}</p>
      </div>

      <div className="catches-bento-grid">
        {LANDING_COPY.catches.cards.map((card: CatchCard, idx: number) => (
          <Reveal key={card.id} staggerIndex={idx} className="catch-card-wrapper">
            <GlareHover className="panel catch-bento-card">
              <div className="catch-card-head">
                <span className="catch-tag">Scenario #{idx + 1}</span>
                <h3 className="catch-card-title">{card.title}</h3>
              </div>

              <div className="catch-diff-box">
                <div className="catch-diff-row claim-row">
                  <span className="diff-label">Draft:</span>
                  <div className="diff-text serif-claim">
                    {renderClaimWithUnderline(card.claimSnippet, card.stretchedPart)}
                  </div>
                </div>

                <div className="catch-diff-row evidence-row">
                  <span className="diff-label">Evidence:</span>
                  <div className="diff-text sans-evidence">
                    “{card.evidenceSnippet}”
                  </div>
                </div>
              </div>

              <p className="catch-explanation">{card.explanation}</p>

              <div className="catch-card-actions">
                <Link
                  href={`/check?example=${card.exampleId}`}
                  className="btn small catch-load-btn"
                  prefetch={prefetchChecker}
                >
                  Test in checker →
                </Link>
              </div>
            </GlareHover>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
