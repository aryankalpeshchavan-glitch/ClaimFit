# ClaimFit — Ownership and Honest Status

| Owner | Primary Components | Status |
|---|---|---|
| **Aryan** | `app/main.py`, `app/service.py`, `app/extraction/llm.py`, `frontend/` (React UI, SVG Thread, CSS), `Dockerfile`, `render.yaml` | Built, layout bugs resolved, and tested across viewports (360px–1440px) locally; Docker CLI inspected (daemon was inactive); live public deployment not yet performed. |
| **Anjishnu** | `app/rules/engine.py`, `app/extraction/parsers.py`, `app/language/risk.py`, `tests/` | Deterministic engine verified; 94 backend tests passing; regression suite expanded to cover edge cases, language-risk separation, and dropped qualifiers. |
| **Ananya** | `README.md`, `docs/DEMO_SCRIPT.md`, `docs/QA_SCENARIOS.md`, UI manual QA pass | Documentation completely updated for ClaimFit; script, checklist, and test scenarios aligned with verified implementation. |
