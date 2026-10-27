import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, createReview, getExamples, getHealth, getReview, requestRewrite } from "../api";
import { Findings, Risks } from "../Findings";
import { Inspector } from "../Inspector";
import { RewritePanel } from "../Rewrite";
import { VerdictCard } from "../Verdict";
import { Workspace } from "../Workspace";
import type { Example, Health, Review, RewriteResult } from "../types";

const FALLBACK_LIMITS: Health["limits"] = { claim_chars: 1000, evidence_chars: 20000 };

interface CheckerProps {
  exampleId?: string;
  reviewId?: string;
}

export default function Checker({ exampleId, reviewId }: CheckerProps) {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState(false);
  const [examples, setExamples] = useState<Example[]>([]);
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const [claim, setClaim] = useState("");
  const [evidence, setEvidence] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [rw, setRw] = useState<RewriteResult | null>(null);
  const [verifiedText, setVerifiedText] = useState<string | null>(null);
  const [busy, setBusy] = useState<"suggest" | "verify" | null>(null);
  const [rwError, setRwError] = useState("");

  const verdictRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);
  const initialExampleLoaded = useRef(false);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealthErr(true));
    getExamples().then(setExamples).catch(() => setExamples([]));
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  // Handle ?example=<id> once examples load
  useEffect(() => {
    if (!initialExampleLoaded.current && exampleId && examples.length > 0) {
      const match = examples.find((e) => e.id === exampleId);
      if (match) {
        setClaim(match.claim);
        setEvidence(match.evidence);
        setActiveExample(match.id);
        setTouched(false);
        initialExampleLoaded.current = true;
      }
    }
  }, [exampleId, examples]);

  // Handle /r/:id loading
  useEffect(() => {
    if (!reviewId) return;
    setLoading(true);
    setError("");
    getReview(reviewId)
      .then((r) => {
        setReview(r);
        setClaim(r.claim_text);
        setEvidence(r.evidence_text);
        setTouched(false);
        window.setTimeout(() => {
          verdictRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start",
          });
        }, 80);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.code === "REVIEW_NOT_FOUND") {
          setError("Review not found (404). This saved result may have expired or does not exist.");
        } else {
          setError(e instanceof ApiError ? e.message : "Could not load saved review.");
        }
      })
      .finally(() => setLoading(false));
  }, [reviewId]);

  const limits = health?.limits ?? FALLBACK_LIMITS;
  const reduce = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clearResults = () => {
    setReview(null);
    setSelected(null);
    setRw(null);
    setDraft("");
    setVerifiedText(null);
    setRwError("");
    setError("");
  };

  const submit = useCallback(async () => {
    setTouched(true);
    if (!claim.trim() || !evidence.trim() || claim.length > limits.claim_chars || evidence.length > limits.evidence_chars) return;
    setLoading(true);
    clearResults();
    try {
      const r = await createReview(claim, evidence);
      setReview(r);
      if (typeof window !== "undefined" && window.history && r.id) {
        window.history.pushState(null, "", `/r/${r.id}`);
      }
      window.setTimeout(() => {
        verdictRef.current?.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start", inline: "nearest" });
        // Move focus to the verdict for screen readers, but never steal it from a user who has already moved on.
        const a = document.activeElement;
        if (!a || a === document.body || document.getElementById("workspace")?.contains(a)) {
          verdictRef.current?.focus({ preventScroll: true });
        }
      }, 60);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [claim, evidence, limits]);

  const reset = () => {
    setClaim("");
    setEvidence("");
    setTouched(false);
    setActiveExample(null);
    clearResults();
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState(null, "", "/check");
    }
  };

  const loadExample = (e: Example) => {
    setClaim(e.claim);
    setEvidence(e.evidence);
    setActiveExample(e.id);
    setTouched(false);
    clearResults();
  };

  const pick = (d: string) => {
    setSelected(d);
    inspectorRef.current?.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "center", inline: "nearest" });
  };

  const suggest = async () => {
    if (!review) return;
    setBusy("suggest");
    setRwError("");
    try {
      const r = await requestRewrite(review.id);
      setRw(r);
      if (r.text) {
        setDraft(r.text);
        setVerifiedText(r.text);
      } else {
        setVerifiedText(null);
      }
    } catch (e) {
      setRwError(e instanceof ApiError ? e.message : "Could not build a rewrite. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const verify = async () => {
    if (!review || !draft.trim()) return;
    setBusy("verify");
    setRwError("");
    try {
      const r = await requestRewrite(review.id, draft);
      setRw(r);
      setVerifiedText(draft);
    } catch (e) {
      setRwError(e instanceof ApiError ? e.message : "Could not verify this wording. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const example = examples.find((e) => e.id === activeExample);
  const mode = health ? (health.llm_configured ? "llm" : "rules") : "";

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#14213D" />
            <path d="M8 16h6m4 0h6" stroke="#FBF8F1" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="16" cy="16" r="3.2" fill="#2F7F79" />
          </svg>
          <div>
            <div className="brand-name">ClaimFit</div>
          </div>
        </div>
        <div className={`mode ${mode}`} role="status" aria-live="polite">
          <i aria-hidden="true" />
          {healthErr ? (
            <span>Server status unavailable</span>
          ) : !health ? (
            <span>Checking server…</span>
          ) : health.llm_configured ? (
            <span>
              Model assistance configured <small>deterministic rules make the decision</small>
            </span>
          ) : (
            <span>
              Rule-based fallback active <small>no model configured</small>
            </span>
          )}
        </div>
      </header>

      <section className="lede">
        <h1>Does the wording stay inside the evidence?</h1>
        <p>
          Paste a marketing claim and the evidence behind it. ClaimFit compares seven dimensions, shows the exact words each
          finding rests on, and sends anything unclear to a person. It checks your supplied evidence only; it cannot tell you a
          claim is true.
        </p>
      </section>

      <div id="workspace">
        <Workspace
          claim={claim}
          evidence={evidence}
          setClaim={setClaim}
          setEvidence={setEvidence}
          limits={limits}
          examples={examples}
          activeExample={activeExample}
          onExample={loadExample}
          onSubmit={submit}
          onReset={reset}
          loading={loading}
          touched={touched}
        />
      </div>

      {error && (
        <div className="banner bad" role="alert">
          <div>
            <b>Could not complete the check.</b> {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="panel checking" role="status" aria-live="polite">
          <div className="dots" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <p>Comparing the seven dimensions against your evidence…</p>
        </div>
      )}

      {review && !loading && (
        <div key={review.id}>
          <div ref={verdictRef} tabIndex={-1} style={{ outline: "none", scrollMarginTop: "80px" }}>
            {review.warnings.filter((w) => !w.startsWith("Running with the rule-based extractor")).length > 0 && (
              <div className="banner warn" role="note" style={{ marginTop: 28 }}>
                <div>
                  {review.warnings
                    .filter((w) => !w.startsWith("Running with the rule-based extractor"))
                    .map((w, i) => (
                      <p key={i}>{w}</p>
                    ))}
                </div>
              </div>
            )}
            <VerdictCard review={review} onPickDimension={pick} />
          </div>

          <section className="section" ref={inspectorRef} aria-labelledby="insp-h">
            <div className="section-head">
              <h2 id="insp-h">Evidence inspector</h2>
              <p>Draft and evidence side by side, highlighted from verified character positions in your own text.</p>
            </div>
            <Inspector
              claim={review.claim_text}
              evidence={review.evidence_text}
              comparisons={review.comparisons}
              risks={review.language_risks}
              selected={selected}
              onSelect={setSelected}
            />
          </section>

          <section className="section" aria-labelledby="find-h">
            <div className="section-head">
              <h2 id="find-h">Seven dimensions</h2>
              <p>Select a finding to focus its words in the inspector. Anything marked “needs review” is never treated as supported.</p>
            </div>
            <Findings comparisons={review.comparisons} selected={selected} onSelect={setSelected} />
          </section>

          <section className="section" aria-labelledby="risk-h">
            <div className="section-head">
              <h2 id="risk-h">Language risks</h2>
              <p>
                Possible overreach in tone or meaning. These are flags for a person to judge, kept apart from the seven
                dimensions, and not proof of a factual contradiction.{" "}
                {review.language_review.startsWith("rules+")
                  ? "Model-flagged items are shown only when their quotations were found verbatim."
                  : "Rule-based checks only."}
              </p>
            </div>
            <Risks risks={review.language_risks} selected={selected} onSelect={setSelected} />
          </section>

          <section className="section" aria-labelledby="rw-h">
            <div className="section-head">
              <h2 id="rw-h">Rewrite and re-verify</h2>
              <p>Get narrower wording built from the evidence, edit it, and check it again. Nothing carries over from the original verdict.</p>
            </div>
            <RewritePanel
              review={review}
              draft={draft}
              setDraft={setDraft}
              result={rw}
              verifiedText={verifiedText}
              busy={busy}
              error={rwError}
              exampleCandidate={example?.candidate}
              onSuggest={suggest}
              onVerify={verify}
            />
          </section>
        </div>
      )}

      <footer>
        ClaimFit is a rule-based checker with optional model assistance. It does not browse, fetch sources or judge whether
        the evidence itself is reliable, and it supports English text only. Example scenarios are illustrative and are not a
        benchmark. No accuracy figure is claimed.
      </footer>
    </div>
  );
}
