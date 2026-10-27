# ClaimFit — Evidence-First Marketing Claim Verification

**ClaimFit** verifies whether a marketing claim stays strictly inside the boundaries of its **supplied evidence**.

> **Crucial Distinction**: Passing a check in ClaimFit never means a claim is objectively true in the real world. It means only that the claim is **supported by the supplied evidence document**. ClaimFit evaluates fidelity to the provided source text, not universal factuality.

---

## 1. The Problem ClaimFit Solves

Marketing and growth teams frequently draft high-impact copy based on legitimate internal case studies, whitepapers, or benchmarks:
* *Evidence*: "In our 30-day trial of 40 Pro Plan teams, median onboarding time fell by 30%."
* *Draft Claim*: "Cuts setup time by 40% for every business!"

Even when backed by genuine evidence, marketing claims routinely drift through:
- **Number inflation** (e.g. 30% becoming 40%)
- **Statistical category shifts** (median to mean, percentage to percentage points)
- **Population widening** (Pro tier to "every business", trial cohort to general public)
- **Dropped scope conditions** (omitting "30-day trial" or "requires enterprise add-on")
- **Unsupported superlatives and guarantees** ("guaranteed", "fastest", "eliminates all delays")
- **Correlation presented as causation** ("using our tool cuts churn")

ClaimFit stops this drift with a **deterministic, verifiable comparison** before copy goes live.

---

## 2. The Verification Workflow

```
[Draft Claim] + [Supplied Evidence Text]
                    │
                    ▼
     ┌─────────────────────────────┐
     │  Extraction Layer           │
     │  - Rule-based parser        │
     │  - Optional Claude adapter  │
     └──────────────┬──────────────┘
                    │ Verbatim quotation verification (character offset check)
                    ▼
     ┌─────────────────────────────┐
     │  7-Dimension Engine         │◄─── Deterministic rules only (No LLM in comparison)
     │  Supported / Contradicted   │
     │  / Unknown                  │
     └──────────────┬──────────────┘
                    │
                    ▼
     ┌─────────────────────────────┐
     │  Separate Language-Risk     │◄─── Evaluates tone, guarantees, superlatives,
     │  Review Layer               │     dropped limitations, causal wording
     └──────────────┬──────────────┘
                    │
                    ▼
     ┌─────────────────────────────┐
     │  Verdict Synthesis          │
     │  - SUPPORTED_BY_SUPPLIED... │
     │  - NOT_SUPPORTED            │
     │  - NEEDS_HUMAN_REVIEW       │
     └──────────────┬──────────────┘
                    │
                    ▼
     ┌─────────────────────────────┐
     │  Constrained Rewrite        │◄─── Generated only from evidence text words;
     │  & Mandatory Re-check       │     Any edit invalidates approval until re-verified
     └─────────────────────────────┘
```

1. **Submission**: User submits a draft claim and the source evidence text.
2. **Span Extraction**: The system locates candidate spans for all dimensions. Every quotation is strictly verified against character offsets in the original text. If a quote cannot be verified verbatim, extraction drops it to prevent hallucinations.
3. **Deterministic Dimension Evaluation**: Pure Python comparison rules evaluate the 7 dimensions. The evaluation is completely deterministic and runs without model calls.
4. **Independent Language-Risk Review**: Evaluates rhetoric and qualitative drift (guarantees, causal leaps, superlatives, terminology changes). This layer never manufactures a factual contradiction; it flags items for human review.
5. **Verdict Generation**:
   - `SUPPORTED_BY_SUPPLIED_EVIDENCE`: Every dimension is supported AND zero language-risk flags require human judgement.
   - `NOT_SUPPORTED`: At least one dimension is contradicted.
   - `NEEDS_HUMAN_REVIEW`: Missing or unknown dimensions, prompt injection/instruction-like text detected, or language-risk flags present.
6. **Narrower Rewrite & Re-Verification**: Suggests a faithful claim strictly bounded by evidence vocabulary. If the user edits the suggested rewrite, previous approval is immediately revoked until re-checked through the same pipeline.

---

## 3. The Seven Dimensions

ClaimFit decomposes every claim and evidence pair across seven explicit dimensions:

| Dimension | Description | Example Supported | Example Contradiction |
|---|---|---|---|
| **1. Metric** | The subject or KPI measured | "onboarding time" vs "onboarding time" | "revenue" vs "customer retention" |
| **2. Value / Statistic** | The numerical magnitude | 30% vs 30%, "at least 20%" vs 25% | 40% vs 30%, mean vs median |
| **3. Unit** | Unit of measurement or scale | percent, percentage points, days | percent vs percentage points, hours vs days |
| **4. Population** | Target audience or sample scope | "Pro tier teams" vs "Pro tier teams" | "every business" vs "40 Pro teams" |
| **5. Time Window** | Duration or reference timeframe | "in 30 days" vs "in 30 days" | "over 1 year" vs "in 30 days" |
| **6. Conditions** | Pre-requisites or limitations | "with Pro plan" vs "with Pro plan" | Dropping "requires enterprise tier" |
| **7. Strength of Wording**| Modality and certainty level | "can improve" vs "may improve" | "guarantees" vs "observed in trial" |

---

## 4. The Separate Language-Risk Layer

Language risks represent qualitative, rhetorical, or regulatory hazards rather than direct numerical contradictions. ClaimFit keeps this layer explicitly separate from factual contradictions:

- **Tone & Absolutes**: "always", "never", "all", "entirely".
- **Guarantees**: "guaranteed", "risk-free", "foolproof".
- **Superlatives & Comparisons**: "fastest", "number one", "better than all competitors".
- **Causal Leaps**: Converting an observed correlation or trial delta into an active causal statement ("cuts churn", "drives growth") without causal proof.
- **Terminology Drift**: Changing specific technical terms into broad consumer concepts. A terminology shift triggers human review, not an automatic factual contradiction.
- **Dropped Limitations**: Omitting explicit qualifiers present in the evidence.

> **Rule of Independence**: A language risk alone can downgrade a verdict to `NEEDS_HUMAN_REVIEW`, but it **never** manufactures a factual contradiction on a dimension.

---

## 5. System Architecture & Technologies

- **Backend**: Python 3.12+ / FastAPI
  - `app/rules/engine.py`: Pure deterministic comparison engine.
  - `app/extraction/`: Verbatim span locators, parsers, and optional Anthropic Claude adapter.
  - `app/language/risk.py`: Language risk analyzer with exact character offset tracking.
  - `app/service.py`: Orchestration pipeline with injection detection and fallbacks.
  - `app/rewrite.py`: Conservative rewrite synthesizer.
  - `app/store.py`: Persistent SQLite storage for audit reviews.
- **Frontend**: React 18 + TypeScript + Vite
  - `frontend/src/App.tsx`: Responsive workspace with real-time state and scenario presets.
  - `frontend/src/Inspector.tsx`: Interactive Evidence Inspector with custom dynamic SVG threads connecting claim and evidence spans.
  - `frontend/src/Rewrite.tsx`: Rewrite generator and live re-verification editor.
  - `frontend/src/styles.css`: Pure Vanilla CSS design system using warm ivory, deep navy, muted teal, amber, and red accents. Responsive from 360px mobile to 1440px+ desktop. Fully respects `prefers-reduced-motion`.
- **Packaging**: Multi-stage Docker container (`node:22-slim` builder + `python:3.12-slim` server).

---

## 6. Environment Variables

All variables are optional. The system functions out-of-the-box in offline rule-based mode.

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(empty)* | Optional API key for Anthropic Claude. If omitted, ClaimFit runs purely on deterministic rule-based extractors. |
| `SCOPELOCK_MODEL` | `claude-sonnet-5-5` | Model identifier passed to Anthropic adapter if key is present. |
| `SCOPELOCK_LLM_TIMEOUT` | `10.0` | Timeout in seconds for LLM extraction requests. |
| `SCOPELOCK_DB` | `scopelock.db` | Path to SQLite database file. |
| `SCOPELOCK_RATE_LIMIT_PER_MIN` | `60` | In-memory IP rate limiter (set to `0` to disable during tests). |
| `SCOPELOCK_LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `SCOPELOCK_WEB_DIR` | `app/web` | Directory serving compiled static frontend assets. |
| `SCOPELOCK_DISABLE_LLM` | `0` | Set to `1` to force rule-based extraction even if API key is present. |

> **Note on `SCOPELOCK_*` prefix**: Environment variable names use the `SCOPELOCK_*` prefix to maintain backward compatibility with existing deployment environments, configurations, and scripts.

---

## 7. Local Installation & Setup (Windows / macOS / Linux)

### Prerequisites
- Python 3.10+ (tested on Python 3.12 and 3.14)
- Node.js 18+ and npm 9+

### Windows (PowerShell) Setup

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/aryankalpeshchavan-glitch/ClaimFit.git
   cd ClaimFit
   ```

2. **Set up Python Virtual Environment**:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Build the Frontend Bundle**:
   ```powershell
   cd frontend
   npm ci
   npm run build
   cd ..
   ```
   *Note: This builds the production React application directly into `app/web`.*

4. **Run the Application**:
   ```powershell
   uvicorn app.main:app --port 8000
   ```
   Open **http://127.0.0.1:8000** in your browser. The single FastAPI server serves both the REST API and the compiled React UI.

5. **Frontend Development with Hot Reload (Optional)**:
   In a separate terminal:
   ```powershell
   cd frontend
   npm run dev
   ```
   Vite runs at `http://localhost:5173` and proxies API requests to `http://127.0.0.1:8000`.

---

## 8. Running Tests

### Backend Unit & Regression Tests
```powershell
python -m pytest -q
```
Runs 94 test cases covering deterministic rule engines, span extraction, injection safety, edge cases, and regression suites.

### Frontend Highlight Unit Tests
```powershell
cd frontend
npm test
cd ..
```
Runs Vitest unit tests verifying character offset splitting, highlight overlaps, and text preservation.

### Playwright End-to-End Browser Tests
Requires Playwright and a running server:
```powershell
pip install playwright
playwright install chromium
$env:SCOPELOCK_RATE_LIMIT_PER_MIN="0"
uvicorn app.main:app --port 8000   # (in background)
python tests/e2e/test_ui.py
```
Validates the full workflow: loading examples, verifying non-supported verdicts, checking dimensions, generating rewrites, re-verifying altered claims, testing empty/oversized inputs, rate limits, and mobile viewport layouts.

---

## 9. API Reference

All requests and responses use JSON.

### Endpoints

- `POST /api/reviews`
  - Body: `{"claim_text": "...", "evidence_text": "..."}`
  - Returns: Complete review analysis, 7 dimension comparisons, language risks, and verdict.
- `GET /api/reviews/{id}`
  - Returns: Cached review by UUID.
- `POST /api/reviews/{id}/rewrite`
  - Body: Optional `{"candidate_text": "..."}` to re-verify custom user edits, or empty body `{}` to generate narrower wording.
  - Returns: Verified candidate text and updated verification status.
- `GET /api/examples`
  - Returns: Built-in illustrative scenarios (Critical example, Faithful wording, Causal leap, etc.).
- `GET /api/health`
  - Returns: `{"status": "ok", "app": "ClaimFit"}`.

### Error Format
Errors return a standard JSON envelope:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "claim_text cannot be empty"
  }
}
```

---

## 10. Deployment & Docker Status

### Dockerfile
The project includes a multi-stage `Dockerfile`:
- Stage 1: Builds the React application with Node 22 slim.
- Stage 2: Copies the build into Python 3.12 slim and executes `uvicorn app.main:app`.

### Docker Build Verification
- Docker CLI version 29.7.2 was detected on the test system.
- The local Docker Desktop daemon was not running during this session (`failed to connect to docker API at npipe`). The Docker image was therefore not built or tested locally during this development session.

### Deployment Configuration (`render.yaml`)
`render.yaml` defines a web service named `claimfit` using Docker runtime and free tier with `/api/health` health checks.
- **Honest Status**: No public cloud deployment currently exists or has been tested. The application has been verified locally on desktop and mobile viewports.

---

## 11. Known Limitations

1. **Language Scope**: English text only.
2. **Single Primary Metric & Value**: Currently parses the primary numerical claim per block. Multiple competing metrics are flagged for human review.
3. **Implicit vs Explicit Time Windows**: If evidence does not state a timeframe, the dimension is marked *unknown*, even if the claim is faithful.
4. **LLM Provider Testing**: Production tests were run with mocked model providers and rule-based extraction. Real Anthropic API calls depend on external API keys.
5. **Illustrative Examples**: The built-in examples are regression test fixtures, not an external statistical benchmark. No claims of broad real-world accuracy percentages are made.

---

## 12. Team Ownership

| Team Member | Component Ownership |
|---|---|
| **Aryan** | `app/main.py`, `app/service.py`, `app/extraction/llm.py`, `frontend/` (React UI, SVG Thread, CSS), `Dockerfile`, `render.yaml` |
| **Anjishnu** | `app/rules/engine.py`, `app/extraction/parsers.py`, `app/language/risk.py`, `tests/` (unit & regression test suites) |
| **Ananya** | `README.md`, `docs/DEMO_SCRIPT.md`, `docs/QA_SCENARIOS.md`, UI accessibility and manual QA verification |
