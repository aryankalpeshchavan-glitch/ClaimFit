# ScopeLock (Round 2 build)

Checks whether a marketing claim stays inside the **supplied** evidence. Passing a check never means the claim is objectively true.

Flow: claim + evidence → extract 7 dimensions (metric, value/statistic, unit, population, time window, conditions, strength of wording) → verify every quote against the original text → deterministic rules mark each dimension **supported / contradicted / unknown** → a separate **language-risk** review (tone, absolutes, guarantees, superlatives, comparisons, causal wording, terminology changes, dropped limitations) → verdict → optional narrower rewrite → the rewrite goes through the *same* pipeline. Unclear cases go to a human.

## Run locally
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm ci && npm run build && cd ..   # builds the React app into app/web
uvicorn app.main:app --reload                      # http://127.0.0.1:8000  (API + UI, same origin)
pytest -q                                          # backend tests
cd frontend && npm test                            # frontend unit tests (highlight offsets)
```
Frontend development with hot reload: run uvicorn on :8000, then `cd frontend && npm run dev` (Vite proxies `/api` to :8000).
If `app/web` has not been built, `/` returns an explicit 503 notice; the API under `/api` still works.

Browser end-to-end checks (needs `pip install playwright && playwright install chromium`, a built frontend, and a running server;
start it with `SCOPELOCK_RATE_LIMIT_PER_MIN=0` because the suite makes many calls):
```bash
python tests/e2e/test_ui.py
```

## Environment variables (all optional)
`ANTHROPIC_API_KEY` (server-side only; without it the app runs on the labelled rule-based extractor) · `SCOPELOCK_MODEL` · `SCOPELOCK_LLM_TIMEOUT` · `SCOPELOCK_DB` · `SCOPELOCK_RATE_LIMIT_PER_MIN` (0 disables) · `SCOPELOCK_LOG_LEVEL` · `SCOPELOCK_WEB_DIR` · `SCOPELOCK_DISABLE_LLM`. See `.env.example`.

## Deploy (Render, Docker)
The Dockerfile is multi-stage: Node builds the React app, then the Python image serves API and UI from one process. `render.yaml` defines one Docker web service with health check `/api/health`. Create the service from the repo, optionally set `ANTHROPIC_API_KEY`, deploy, then open the public URL and run `docs/QA_SCENARIOS.md`. Not deployed from this session.

## Architecture
`app/rules/engine.py` deterministic comparator (no model calls) · `app/extraction/` locators/parsers, rule-based extractor, LLM adapter (proposes verbatim quotes and language flags only) · `app/language/risk.py` language-risk rules with verified spans · `app/service.py` orchestrator + fallback · `app/rewrite.py` constrained rewrite · `app/examples.py` illustrative scenarios (pinned by tests) · `app/main.py` API + serves the built UI · `app/store.py` SQLite · `frontend/` React + TypeScript + Vite (no 3D library: the claim-to-evidence thread is SVG).

The model can only propose verbatim quotes, language flags, or wording. Code verifies every quotation, parses values, compares, and re-verifies every rewrite. Model flags can only add review items; nothing a model returns can approve a claim.

## API
`POST /api/reviews` `{claim_text, evidence_text}` · `GET /api/reviews/{id}` · `POST /api/reviews/{id}/rewrite` (optional `{candidate_text}` to verify edited wording) · `GET /api/health` · `GET /api/examples`.
Errors: `{"error":{"code","message"}}` with 400, 413, 415, 422, 429, 404, 500.

## Verdicts
`SUPPORTED_BY_SUPPLIED_EVIDENCE` only if every dimension is supported **and** no language risk needs judgement · any contradicted dimension → `NOT_SUPPORTED` · otherwise `NEEDS_HUMAN_REVIEW`. Approval is also withheld if the model step failed or the input contains instruction-like text. Language risks never produce a "contradicted" status by themselves.

## Known limits
English only. Rule-based extraction understands a fixed set of phrasings; unusual wording becomes *unknown*, not *supported*. Language risks come from word lists and a small related-terms table, so they miss rewordings and can flag innocent uses. Only the first number/population per text is compared (several numbers are flagged ambiguous). Evidence without an explicit time window or conditions yields *unknown* for those dimensions even when the claim copies the evidence. The rate limiter keys on the connecting IP (behind a proxy all users may share one bucket). Model-assisted paths are tested only with mocked providers. Example scenarios are illustrative, not a benchmark; no accuracy figure is claimed.
