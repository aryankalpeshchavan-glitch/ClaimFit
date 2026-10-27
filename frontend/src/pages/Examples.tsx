import { useEffect, useMemo, useState } from "react";
import { getExamples } from "../api";
import { Link } from "../router";
import { prefetchChecker } from "../Shell";
import type { Example } from "../types";

type CategoryFilter =
  | "all"
  | "supported_stretched"
  | "statistics"
  | "conditions"
  | "language"
  | "safety";

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All Scenarios" },
  { id: "supported_stretched", label: "Supported & Stretched" },
  { id: "statistics", label: "Statistics & Units" },
  { id: "conditions", label: "Conditions & Qualifiers" },
  { id: "language", label: "Language Risk" },
  { id: "safety", label: "Safety & Prompt Injection" },
];

function matchesCategory(example: Example, cat: CategoryFilter): boolean {
  if (cat === "all") return true;
  const tag = (example.tag || "").toLowerCase();
  switch (cat) {
    case "supported_stretched":
      return tag.includes("stretched") || tag.includes("supported");
    case "statistics":
      return (
        tag.includes("statistic") ||
        tag.includes("unit") ||
        tag.includes("direction") ||
        tag.includes("value") ||
        tag.includes("metric")
      );
    case "conditions":
      return tag.includes("condition") || tag.includes("rewrite");
    case "language":
      return tag.includes("language");
    case "safety":
      return tag.includes("safety");
    default:
      return true;
  }
}

function outcomeTone(expected?: string): { label: string; toneClass: string } {
  switch (expected) {
    case "SUPPORTED_BY_SUPPLIED_EVIDENCE":
      return { label: "Supported", toneClass: "supported" };
    case "NOT_SUPPORTED":
      return { label: "Not supported", toneClass: "not-supported" };
    case "NEEDS_HUMAN_REVIEW":
    default:
      return { label: "Needs human review", toneClass: "needs-review" };
  }
}

export default function Examples() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getExamples()
      .then((data) => {
        setExamples(data);
        setError(null);
      })
      .catch(() => {
        setError("Could not load examples from the server. Please check your connection.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return examples.filter((ex) => {
      if (!matchesCategory(ex, category)) return false;
      if (!q) return true;
      const haystack = `${ex.title} ${ex.tag} ${ex.blurb} ${ex.claim} ${ex.evidence}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [examples, category, search]);

  return (
    <div className="shell examples-page">
      <header className="examples-header">
        <div className="examples-eyebrow">
          <span className="eyebrow-pill">Pre-verified test cases</span>
        </div>
        <h1 className="examples-h1">Real-World Claim Scenarios</h1>
        <p className="examples-sub">
          Explore typical marketing statements across SaaS, health, metrics, and risk categories.
          Every scenario is drawn from the backend test suite to demonstrate how ClaimFit’s
          deterministic seven-dimension checks detect claim drift.
        </p>
        <p className="examples-note">
          <i>Note: Expected outcomes shown are from test fixtures. Opening any card in the checker runs an actual live verification request against the backend.</i>
        </p>
      </header>

      {/* Controls Bar: Category Filter Pills + Search */}
      <section className="examples-controls panel" aria-label="Filter and search examples">
        <div className="examples-categories" role="tablist" aria-label="Example categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={category === cat.id}
              className={`cat-pill ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="examples-search-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <line x1="13" y1="13" x2="18" y2="18" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims, metrics, or words…"
            aria-label="Search example scenarios"
            className="examples-search-input"
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Grid of Example Cards */}
      {loading ? (
        <div className="panel checking" role="status" aria-live="polite">
          <div className="dots" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ ["--i" as string]: i }} />
            ))}
          </div>
          <p>Loading example scenarios…</p>
        </div>
      ) : error ? (
        <div className="banner bad" role="alert">
          <div>
            <b>Failed to load examples.</b> {error}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel examples-empty" role="status">
          <h3>No matching scenarios found</h3>
          <p>We couldn’t find any examples matching "{search}". Try searching for another term or resetting filters.</p>
          <button
            className="btn small"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="examples-grid" role="feed" aria-label="Scenarios list">
          {filtered.map((item) => {
            const outcome = outcomeTone(item.expected);
            return (
              <article key={item.id} className="example-card panel" aria-labelledby={`ex-title-${item.id}`}>
                <div className="example-card-head">
                  <span className="example-tag-badge">{item.tag}</span>
                  <span className={`example-outcome-pill ${outcome.toneClass}`} title="Expected outcome from test fixture">
                    {outcome.label}
                  </span>
                </div>

                <h2 id={`ex-title-${item.id}`} className="example-card-title">
                  {item.title}
                </h2>
                <p className="example-card-blurb">{item.blurb}</p>

                <div className="example-snippets">
                  <div className="example-snippet-box claim-box">
                    <span className="snippet-label">Draft marketing claim</span>
                    <blockquote className="snippet-quote">“{item.claim}”</blockquote>
                  </div>

                  <div className="example-snippet-box evidence-box">
                    <span className="snippet-label">Audited evidence</span>
                    <blockquote className="snippet-quote">“{item.evidence}”</blockquote>
                  </div>
                </div>

                <div className="example-card-foot">
                  <Link
                    href={`/check?example=${encodeURIComponent(item.id)}`}
                    className="btn primary small example-open-cta"
                    prefetch={prefetchChecker}
                  >
                    <span>Try this in Checker</span>
                    <span aria-hidden="true"> →</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
