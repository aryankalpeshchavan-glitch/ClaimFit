from __future__ import annotations
import logging, os, time
from collections import defaultdict, deque
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from .examples import EXAMPLES
from .extraction.llm import LlmClient
from .models import ReviewRequest, RewriteRequest
from .rules.engine import ENGINE_VERSION
from .service import ReviewService
from .store import Store

MAX_CLAIM, MAX_EVIDENCE = 1000, 20000
WEB = Path(os.getenv("SCOPELOCK_WEB_DIR", str(Path(__file__).parent / "web")))   # built React app (npm run build)
log = logging.getLogger("scopelock")
logging.basicConfig(level=os.getenv("SCOPELOCK_LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


class RateLimiter:
    def __init__(self, per_minute: int):
        self.per_minute, self.hits = per_minute, defaultdict(deque)

    def check(self, key: str):
        if self.per_minute <= 0:
            return
        now, q = time.monotonic(), self.hits[key]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= self.per_minute:
            raise ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.")
        q.append(now)


def build_service_from_env() -> ReviewService:
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    llm: Optional[LlmClient] = None
    if key and os.getenv("SCOPELOCK_DISABLE_LLM") != "1":
        llm = LlmClient(key, os.getenv("SCOPELOCK_MODEL", "claude-sonnet-5-5"),
                        timeout=float(os.getenv("SCOPELOCK_LLM_TIMEOUT", "20")))
    return ReviewService(Store(os.getenv("SCOPELOCK_DB", "scopelock.db")), llm)


def create_app(service: Optional[ReviewService] = None, rate_limit: Optional[int] = None) -> FastAPI:
    svc = service or build_service_from_env()
    limiter = RateLimiter(rate_limit if rate_limit is not None else int(os.getenv("SCOPELOCK_RATE_LIMIT_PER_MIN", "40")))
    app = FastAPI(title="ScopeLock", version="0.3.0")

    def err(status, code, message):
        return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})

    @app.exception_handler(ApiError)
    async def _api(_, e: ApiError): return err(e.status, e.code, e.message)

    @app.exception_handler(RequestValidationError)
    async def _val(_, e): return err(422, "INVALID_INPUT", "The request body is not valid.")

    @app.exception_handler(Exception)
    async def _any(request, e):
        log.error("unhandled %s on %s %s", type(e).__name__, request.method, request.url.path)   # type only; never user text
        return err(500, "INTERNAL_ERROR", "Something went wrong on our side. No verdict was produced; please send this case to human review.")

    async def read_json(request: Request) -> dict:
        ctype = request.headers.get("content-type", "")
        if not ctype.startswith("application/json"):
            raise ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Only JSON text input is supported in this version (no file uploads).")
        try:
            body = await request.json()
        except Exception:
            raise ApiError(422, "INVALID_JSON", "The request body is not valid JSON.")
        if not isinstance(body, dict):
            raise ApiError(422, "INVALID_INPUT", "The request body must be a JSON object.")
        return body

    def client_key(request: Request) -> str:
        return request.client.host if request.client else "unknown"

    @app.get("/api/health")
    def health():
        return {"status": "ok", "extractor_mode": svc.configured_mode, "llm_configured": svc.llm is not None,
                "engine_version": ENGINE_VERSION, "language_review": "rules+model" if svc.llm else "rules",
                "limits": {"claim_chars": MAX_CLAIM, "evidence_chars": MAX_EVIDENCE}}

    @app.get("/api/examples")
    def examples():
        return {"note": "Illustrative teaching scenarios, not a benchmark or real-world validation.", "examples": EXAMPLES}

    @app.post("/api/reviews", status_code=201)
    async def create_review(request: Request):
        limiter.check(client_key(request))
        try:
            req = ReviewRequest.model_validate(await read_json(request))
        except ValidationError:
            raise ApiError(422, "INVALID_INPUT", "claim_text and evidence_text must be strings.")
        if not req.claim_text.strip():
            raise ApiError(400, "CLAIM_REQUIRED", "Enter the marketing claim you want to check.")
        if not req.evidence_text.strip():
            raise ApiError(400, "EVIDENCE_REQUIRED", "Paste the evidence that is meant to support the claim.")
        if len(req.claim_text) > MAX_CLAIM:
            raise ApiError(413, "CLAIM_TOO_LONG", f"The claim is limited to {MAX_CLAIM} characters.")
        if len(req.evidence_text) > MAX_EVIDENCE:
            raise ApiError(413, "EVIDENCE_TOO_LONG", f"Evidence is limited to {MAX_EVIDENCE} characters.")
        return svc.review(req.claim_text, req.evidence_text)

    @app.get("/api/reviews/{review_id}")
    def get_review(review_id: str):
        r = svc.store.get(review_id)
        if not r:
            raise ApiError(404, "REVIEW_NOT_FOUND", "No review with that id.")
        return r

    @app.post("/api/reviews/{review_id}/rewrite")
    async def rewrite(review_id: str, request: Request):
        limiter.check(client_key(request))
        r = svc.store.get(review_id)
        if not r:
            raise ApiError(404, "REVIEW_NOT_FOUND", "No review with that id.")
        body = await read_json(request) if request.headers.get("content-length", "0") not in ("0", "") else {}
        try:
            req = RewriteRequest.model_validate(body)
        except ValidationError:
            raise ApiError(422, "INVALID_INPUT", "candidate_text must be a string.")
        if req.candidate_text is not None:
            if not req.candidate_text.strip():
                raise ApiError(400, "CANDIDATE_EMPTY", "The edited wording is empty.")
            if len(req.candidate_text) > MAX_CLAIM:
                raise ApiError(413, "CLAIM_TOO_LONG", f"Wording is limited to {MAX_CLAIM} characters.")
        return svc.rewrite(r, req.candidate_text)

    if (WEB / "index.html").exists():
        if (WEB / "assets").is_dir():
            app.mount("/assets", StaticFiles(directory=WEB / "assets"), name="assets")

        @app.get("/", include_in_schema=False)
        def index():
            return FileResponse(WEB / "index.html")

        @app.get("/favicon.svg", include_in_schema=False)
        def favicon():
            return FileResponse(WEB / "favicon.svg")
    else:
        @app.get("/", include_in_schema=False)
        def index_missing():
            # Deliberately NOT a silent fallback to an old page: say plainly that the frontend was not built.
            return HTMLResponse("<h1>ScopeLock API is running</h1><p>The web interface has not been built. "
                                "Run <code>cd frontend &amp;&amp; npm ci &amp;&amp; npm run build</code>, or use the Docker image. "
                                "The API is available under <code>/api</code>.</p>", status_code=503)

    return app


app = create_app()
