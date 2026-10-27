import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, navigate, type Route } from "./router";
import { getHealth } from "./api";
import type { Health } from "./types";

export const prefetchChecker = () => {
  import("./pages/Checker");
};

interface ShellProps {
  currentRoute: Route;
  children: ReactNode;
  hideFooter?: boolean;
}

export function Shell({ currentRoute, children, hideFooter }: ShellProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealthErr(true));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (currentRoute.name === "landing") {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${hash}`);
        return;
      }
    }
    navigate(`/#${hash}`);
  };

  const mode = health ? (health.llm_configured ? "llm" : "rules") : "";

  return (
    <div className="app-shell">
      <nav
        className={`shell-nav ${scrolled ? "condensed" : ""}`}
        aria-label="Main navigation"
      >
        <div className="shell-nav-inner">
          <Link href="/" className="shell-brand" aria-label="ClaimFit Home">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#14213D" />
              <path d="M8 16h6m4 0h6" stroke="#FBF8F1" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="16" cy="16" r="3.2" fill="#2F7F79" />
            </svg>
            <span className="brand-name">ClaimFit</span>
          </Link>

          <div className="shell-nav-links desktop-only">
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works")}>
              How it works
            </a>
            <a href="#what-it-catches" onClick={(e) => handleNavClick(e, "what-it-catches")}>
              What it catches
            </a>
            <a href="#limits" onClick={(e) => handleNavClick(e, "limits")}>
              Limits
            </a>
            <a href="#faq" onClick={(e) => handleNavClick(e, "faq")}>
              FAQ
            </a>
          </div>

          <div className="shell-nav-actions desktop-only">
            <Link
              href="/check"
              className="btn primary small nav-cta"
              prefetch={prefetchChecker}
            >
              Check a claim
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            className="mobile-nav-toggle mobile-only"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-nav-menu" className="mobile-nav-drawer mobile-only">
            <div className="mobile-nav-items">
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works")}>
                How it works
              </a>
              <a href="#what-it-catches" onClick={(e) => handleNavClick(e, "what-it-catches")}>
                What it catches
              </a>
              <a href="#limits" onClick={(e) => handleNavClick(e, "limits")}>
                Limits
              </a>
              <a href="#faq" onClick={(e) => handleNavClick(e, "faq")}>
                FAQ
              </a>
              <Link
                href="/check"
                className="btn primary mobile-cta"
                onClick={() => setMenuOpen(false)}
                prefetch={prefetchChecker}
              >
                Check a claim
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main id="main-content" className="shell-main">
        {children}
      </main>

      {!hideFooter && (
        <footer className="landing-footer">
          <div className="footer-container">
            <div className="footer-top">
              <div className="footer-brand-col">
                <div className="brand">
                  <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
                    <rect width="32" height="32" rx="8" fill="#14213D" />
                    <path d="M8 16h6m4 0h6" stroke="#FBF8F1" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx="16" cy="16" r="3.2" fill="#2F7F79" />
                  </svg>
                  <span className="brand-name">ClaimFit</span>
                </div>
                <p className="footer-tagline">
                  Deterministic claim verification for marketing and compliance.
                </p>
                <div className={`mode ${mode} footer-mode`} role="status" aria-live="polite">
                  <i aria-hidden="true" />
                  {healthErr ? (
                    <span>Server status unavailable</span>
                  ) : !health ? (
                    <span>Checking server…</span>
                  ) : health.llm_configured ? (
                    <span>
                      Model-assisted <small>· deterministic checks decide</small>
                    </span>
                  ) : (
                    <span>
                      Rule-based mode <small>· code decides</small>
                    </span>
                  )}
                </div>
              </div>

              <div className="footer-links-grid">
                <div className="footer-col">
                  <h4>Product</h4>
                  <ul>
                    <li>
                      <Link href="/check" prefetch={prefetchChecker}>
                        Check a claim
                      </Link>
                    </li>
                    <li>
                      <a href="#what-it-catches" onClick={(e) => handleNavClick(e, "what-it-catches")}>
                        Examples
                      </a>
                    </li>
                    <li>
                      <a href="#limits" onClick={(e) => handleNavClick(e, "limits")}>
                        Limits
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Project</h4>
                  <ul>
                    <li>
                      <a href="https://github.com/aryankalpeshchavan-glitch/ClaimFit" target="_blank" rel="noopener noreferrer">
                        GitHub repository
                      </a>
                    </li>
                    <li>
                      <a href="https://github.com/aryankalpeshchavan-glitch/ClaimFit#readme" target="_blank" rel="noopener noreferrer">
                        README
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="footer-col">
                  <h4>Team</h4>
                  <ul>
                    <li>Aryan · Engineering & UI</li>
                    <li>Anjishnu · Rules & Reference Architecture</li>
                    <li>Ananya · Evaluation & Quality Assurance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>
                ClaimFit is a rule-based checker with optional model assistance. It does not browse, fetch sources or judge
                whether the evidence itself is reliable, and it supports English text only. Example scenarios are illustrative
                and are not a benchmark. No accuracy figure is claimed.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
