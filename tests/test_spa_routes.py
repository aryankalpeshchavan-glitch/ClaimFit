import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.service import ReviewService
from app.store import Store


def test_spa_routes_serve_index_html(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    index_file = tmp_path / "index.html"
    index_file.write_text("<!doctype html><html><body>ClaimFit Stub</body></html>", encoding="utf-8")
    monkeypatch.setenv("SCOPELOCK_WEB_DIR", str(tmp_path))

    svc = ReviewService(Store(":memory:"))
    app = create_app(svc, rate_limit=0)
    client = TestClient(app)

    # 1. / serves the built UI
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert "ClaimFit Stub" in r_root.text

    # 2. /check serves the UI
    r_check = client.get("/check")
    assert r_check.status_code == 200
    assert "ClaimFit Stub" in r_check.text

    # 3. /check?example=critical works
    r_check_param = client.get("/check?example=critical")
    assert r_check_param.status_code == 200
    assert "ClaimFit Stub" in r_check_param.text

    # 4. Implemented review route serves UI and loads requested review correctly
    # First create a review via API
    resp_create = client.post(
        "/api/reviews",
        json={
            "claim_text": "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
            "evidence_text": "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        },
    )
    assert resp_create.status_code == 201
    rev_id = resp_create.json()["id"]

    # Verify /r/{review_id} serves UI
    r_review = client.get(f"/r/{rev_id}")
    assert r_review.status_code == 200
    assert "ClaimFit Stub" in r_review.text

    # Verify review can be retrieved by API
    r_api_rev = client.get(f"/api/reviews/{rev_id}")
    assert r_api_rev.status_code == 200
    assert r_api_rev.json()["id"] == rev_id

    # 5. Unknown API routes still return JSON 404 responses
    r_api_nope = client.get("/api/nope")
    assert r_api_nope.status_code == 404
    assert r_api_nope.headers.get("content-type", "").startswith("application/json")
    assert "detail" in r_api_nope.json() or "error" in r_api_nope.json()

    # 6. API paths are not swallowed by frontend routes
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"


def test_spa_routes_frontend_not_built_503(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    empty_dir = tmp_path / "nonexistent_web"
    empty_dir.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("SCOPELOCK_WEB_DIR", str(empty_dir))

    svc = ReviewService(Store(":memory:"))
    app = create_app(svc, rate_limit=0)
    client = TestClient(app)

    # All frontend paths return 503 when build is missing
    r_root = client.get("/")
    assert r_root.status_code == 503
    assert "ClaimFit API is running" in r_root.text
    assert "web interface has not been built" in r_root.text

    r_check = client.get("/check")
    assert r_check.status_code == 503
    assert "ClaimFit API is running" in r_check.text

    r_rev = client.get("/r/abc")
    assert r_rev.status_code == 503
    assert "ClaimFit API is running" in r_rev.text

    # API endpoints still work even if frontend build is missing
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
