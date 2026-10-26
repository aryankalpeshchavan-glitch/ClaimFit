import os
os.environ["SCOPELOCK_DB"] = ":memory:"
import pytest
from fastapi.testclient import TestClient
from app.extraction.heuristic import HeuristicExtractor
from app.main import create_app
from app.service import ReviewService
from app.store import Store

EVIDENCE = "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%."
DRAFT = "Our platform cuts setup time by 40% for every business."


@pytest.fixture
def service():
    return ReviewService(Store(":memory:"))


@pytest.fixture
def client(service):
    return TestClient(create_app(service, rate_limit=0))


def run(claim, evidence=EVIDENCE):
    from app.rules.engine import compare_frames, decide
    x = HeuristicExtractor()
    cmps = compare_frames(x.extract(claim, "claim"), x.extract(evidence, "evidence"))
    return {c.dimension: c for c in cmps}, decide(cmps)
