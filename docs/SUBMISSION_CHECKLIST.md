# ClaimFit Submission Checklist

- [ ] Deploy (Render or alternate host) and verify the public URL manually. (Currently verified on local server only).
- [ ] Run the live URL through `docs/QA_SCENARIOS.md` on desktop and mobile.
- [ ] Decide on the Anthropic model key: with a key, run the examples; without, state "rule-based extractor" honestly.
- [ ] Repository pushed: verify that a clean clone runs tests (`pytest -q`, `npm test`, `python tests/e2e/test_ui.py`).
- [ ] Demo video / screenshots: captures are saved in `docs/screenshot_desktop.png` and `docs/screenshot_mobile.png`.
- [ ] Submission text reflects only verified features (see README "Known Limitations").
- [ ] No fake benchmarks, accuracy statistics, or exaggerated claims.
- [ ] Team names, contact, and ownership details completed.
- [ ] Confirm Docker build on an environment where the Docker daemon is active (Docker CLI version 29.7.2 confirmed present).
