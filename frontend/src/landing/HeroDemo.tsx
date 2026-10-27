import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Doc } from "../Doc";
import type { Mark } from "../highlight";
import { useReducedMotion } from "../motion/useReducedMotion";
import { Link } from "../router";
import { prefetchChecker } from "../Shell";
import { statusTone } from "../ui";
import { HERO_SAMPLE } from "./heroSample";
import { LANDING_COPY } from "./copy";

export function HeroDemo() {
  const reducedMotion = useReducedMotion();
  const [animStep, setAnimStep] = useState(reducedMotion ? 3 : 0);
  const [thread, setThread] = useState<{ d: string; x1: number; y1: number; x2: number; y2: number } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  const evRef = useRef<HTMLDivElement>(null);

  // Build marks from sample comparisons
  const claimMarks: Mark[] = [];
  const evMarks: Mark[] = [];
  HERO_SAMPLE.comparisons.forEach((c) => {
    const tone = statusTone(c.status);
    if (c.claim_span) claimMarks.push({ id: c.dimension, span: c.claim_span, tone });
    if (c.evidence_span) evMarks.push({ id: c.dimension, span: c.evidence_span, tone });
  });

  const layoutThread = useCallback(() => {
    const w = cardRef.current;
    const pa = claimRef.current;
    const pb = evRef.current;
    if (!w || !pa || !pb) return setThread(null);

    // Look for value marks ("40" and "30")
    const a = pa.querySelector<HTMLElement>("mark[data-ids*='value']");
    const b = pb.querySelector<HTMLElement>("mark[data-ids*='value']");
    if (!a || !b) return setThread(null);

    const W = w.getBoundingClientRect();
    const A = a.getBoundingClientRect();
    const B = b.getBoundingClientRect();
    const PA = pa.getBoundingClientRect();
    const PB = pb.getBoundingClientRect();

    // If stacked layout on mobile, don't draw thread across panels
    if (PB.left < PA.right - 10) return setThread(null);

    const x1 = PA.right - W.left;
    const y1 = A.top + A.height / 2 - W.top;
    const x2 = PB.left - W.left;
    const y2 = B.top + B.height / 2 - W.top;
    const mx = (x1 + x2) / 2;

    setThread({
      d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`,
      x1,
      y1,
      x2,
      y2,
    });
  }, []);

  const runAnimation = useCallback(() => {
    if (reducedMotion) {
      setAnimStep(3);
      layoutThread();
      return;
    }
    setAnimStep(0);
    setThread(null);

    const t1 = setTimeout(() => {
      setAnimStep(1); // highlights in
      layoutThread();
    }, 180);

    const t2 = setTimeout(() => {
      setAnimStep(2); // thread in
      layoutThread();
    }, 550);

    const t3 = setTimeout(() => {
      setAnimStep(3); // verdict chip in
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reducedMotion, layoutThread]);

  useEffect(() => {
    const cancel = runAnimation();
    return () => cancel?.();
  }, [runAnimation]);

  useLayoutEffect(() => {
    window.addEventListener("resize", layoutThread);
    return () => window.removeEventListener("resize", layoutThread);
  }, [layoutThread]);

  const handleReplay = () => {
    if (!reducedMotion) {
      runAnimation();
    }
  };

  return (
    <div className="hero-demo-container">
      <div
        ref={cardRef}
        className={`hero-demo-card panel ${animStep >= 1 ? "step-highlight" : ""} ${
          animStep >= 2 ? "step-thread" : ""
        } ${animStep >= 3 ? "step-verdict" : ""}`}
        onMouseEnter={handleReplay}
        onFocus={handleReplay}
        tabIndex={0}
        role="region"
        aria-label="Interactive demonstration of claim verification"
        aria-describedby="hero-demo-accessible-summary"
      >
        <div className="hero-demo-topbar">
          <div className="demo-window-controls" aria-hidden="true">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="demo-badge">Illustrative sample: Critical scenario</span>
          {animStep >= 3 && (
            <div className="verdict-chip bad animate-pop" role="status">
              <span className="chip-dot" />
              Not supported
            </div>
          )}
        </div>

        <div className="hero-demo-body">
          <svg className="demo-thread-svg" aria-hidden="true">
            {animStep >= 2 && thread && (
              <g>
                <path d={thread.d} className="thread-path-anim" />
                <circle cx={thread.x1} cy={thread.y1} r="3.5" className="thread-dot" />
                <circle cx={thread.x2} cy={thread.y2} r="3.5" className="thread-dot" />
              </g>
            )}
          </svg>

          <div className="demo-pane">
            <div className="demo-pane-header">
              <span className="demo-pane-title">Draft claim</span>
              <span className="demo-pane-stat">40% vs 30%</span>
            </div>
            <Doc
              text={HERO_SAMPLE.claim_text}
              marks={animStep >= 1 ? claimMarks : []}
              pane="claim"
              selected={animStep >= 2 ? "value" : null}
              onSelect={() => {}}
              docRef={claimRef}
            />
          </div>

          <div className="demo-pane">
            <div className="demo-pane-header">
              <span className="demo-pane-title">Supplied evidence</span>
              <span className="demo-pane-stat">Bounded test</span>
            </div>
            <Doc
              text={HERO_SAMPLE.evidence_text}
              marks={animStep >= 1 ? evMarks : []}
              pane="evidence"
              selected={animStep >= 2 ? "value" : null}
              onSelect={() => {}}
              docRef={evRef}
            />
          </div>
        </div>

        <div className="hero-demo-footer">
          <span className="demo-metric-tag bad">Value: 40% exceeds 30%</span>
          <span className="demo-metric-tag bad">Scope: “every business” exceeds 120 cohort</span>
          <Link
            href="/check?example=critical"
            className="btn small hero-demo-run-cta"
            prefetch={prefetchChecker}
            style={{ marginLeft: "auto", textDecoration: "none" }}
          >
            Run in live checker →
          </Link>
        </div>
      </div>

      <p className="hero-demo-caption">{LANDING_COPY.hero.cardCaption}</p>

      {/* Screen-reader summary */}
      <div id="hero-demo-accessible-summary" className="sr">
        Sample comparison: Claim states "Our platform cuts setup time by 40% for every business." Evidence states "In a
        30-day test of 120 small-business customers using Pro, median setup time fell by 30%." Result is Not supported
        because value 40% exceeds evidence 30%, and population is overextended from 120 small-business customers to every
        business.
      </div>
    </div>
  );
}
