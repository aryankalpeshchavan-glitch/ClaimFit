"""Browser end-to-end checks against a RUNNING server (default http://localhost:8000).

Not part of the default `pytest` run (needs Playwright + Chromium + a built frontend).
Run:  SCOPELOCK_URL=http://localhost:8000 python tests/e2e/test_ui.py
Exits non-zero if any check fails."""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.getenv("SCOPELOCK_URL", "http://localhost:8000/")
R: list[tuple[str, bool]] = []
errors: list[str] = []


def check(name: str, cond, extra: str = ""):
    R.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""), flush=True)


def main() -> int:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_context(viewport={"width": 1280, "height": 900}).new_page()
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(URL)
        pg.wait_for_selector(".scenarios")

        # validation
        pg.click("text=Check claim")
        pg.wait_for_selector(".field-foot .err[role=alert]")
        check("empty submit shows claim+evidence errors", pg.locator(".field-foot .err[role=alert]").count() == 2)
        check("no verdict on empty submit", pg.locator(".verdict").count() == 0)
        pg.fill("#evidence", "x" * 20001)
        check("over-limit evidence flagged", "Shorten the evidence" in pg.inner_text("#ev-f"))
        pg.fill("#evidence", "")

        # critical example via keyboard
        pg.click("text=Critical example")
        pg.focus("#claim")
        pg.keyboard.press("Control+Enter")
        pg.wait_for_selector(".verdict")
        check("Ctrl+Enter submits; original not approved", pg.inner_text(".verdict h2") == "Not supported by the evidence")
        check("7 dimension findings", pg.locator(".finding").count() == 7)
        check("7 rail buttons", pg.locator(".rail button").count() == 7)

        # selection, thread, escape
        pg.focus(".finding:nth-child(2) > button")
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(700)
        check("Enter expands finding (aria-expanded)", pg.get_attribute(".finding:nth-child(2) > button", "aria-expanded") == "true")
        check("selected finding highlights both panes",
              pg.locator(".doc[data-pane=claim] mark.sel").count() >= 1 and pg.locator(".doc[data-pane=evidence] mark.sel").count() >= 1)
        check("evidence thread drawn on desktop", pg.locator(".thread path").count() == 1)
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(200)
        check("Escape clears selection + thread", pg.locator("mark.sel").count() == 0 and pg.locator(".thread path").count() == 0)

        # language risk selection
        pg.click(".risk >> nth=0")
        pg.wait_for_timeout(500)
        check("selecting a language risk highlights its words", pg.locator("mark.sel").count() >= 1)
        pg.keyboard.press("Escape")

        # rewrite -> verified
        pg.click("text=Suggest narrower wording")
        pg.wait_for_selector(".result-box")
        check("rewrite fills editable textarea", pg.input_value("#rewrite").startswith("In a 30-day test of 120 small-business customers using Pro"))
        check("suggestion re-verified as supported", "Passed re-verification" in pg.inner_text(".result-box"))
        check("suggestion vs verified badges distinct", pg.locator(".badge.sugg").count() == 1 and pg.locator(".badge.ver-ok").count() == 1)
        check("copy label says verified", "Copy verified wording" in pg.inner_text(".rw-actions"))

        # editing -> stale, no approval shown for edited text
        pg.fill("#rewrite", "Setup time fell by 35% for all businesses.")
        check("edit: stale notice, result hidden", pg.locator(".result-box").count() == 0 and "wording changed" in pg.inner_text(".rw"))
        check("edit: copy label says not verified", "not verified" in pg.inner_text(".rw-actions"))
        pg.click("text=Re-verify this wording")
        pg.wait_for_selector(".result-box")
        check("inflated edit fails re-verification", "Did not pass" in pg.inner_text(".result-box") and pg.locator(".badge.ver-bad").count() == 1)
        check("failure is explained", "Why it did not pass" in pg.inner_text(".result-box"))

        # injection scenario
        pg.click("text=more")
        pg.click("text=Instruction-like text in evidence")
        pg.click("text=Check claim")
        pg.wait_for_selector(".verdict.warn")
        check("injection: needs human review + explained", pg.inner_text(".verdict h2") == "Needs human review" and "instruction-like" in pg.inner_text(".verdict").lower())

        # markup is text, never HTML
        pg.fill("#claim", "<img src=x onerror=window.__pwn=1> Median setup time fell by 30%.")
        pg.fill("#evidence", "<b>bold</b> In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.")
        pg.click("text=Check claim")
        pg.wait_for_selector(".inspector")
        check("no element injected from input", pg.locator(".doc img").count() == 0 and pg.locator(".doc b").count() == 0 and pg.evaluate("window.__pwn") is None)
        check("angle brackets shown as text", "<img" in pg.inner_text(".doc[data-pane=claim]"))

        # reset
        pg.click("text=Reset")
        check("reset clears everything", pg.input_value("#claim") == "" and pg.locator(".verdict").count() == 0)

        # network failure
        pg.route("**/api/reviews", lambda r: r.abort())
        pg.fill("#claim", "a 30% claim")
        pg.fill("#evidence", "some evidence")
        pg.click("text=Check claim")
        pg.wait_for_selector(".banner.bad")
        check("network failure -> friendly error", "Could not reach" in pg.inner_text(".banner.bad"))
        pg.unroute("**/api/reviews")
        real = [e for e in errors if "Failed to load resource" not in e and "ERR_FAILED" not in e]
        check("no unexpected console/page errors", not real, str(real))
        b.close()
    print(f"\n{sum(ok for _, ok in R)}/{len(R)} checks passed")
    return 0 if all(ok for _, ok in R) else 1


if __name__ == "__main__":
    sys.exit(main())
