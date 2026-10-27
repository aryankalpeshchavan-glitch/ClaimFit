import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createReview, getExamples, getHealth, getReview, requestRewrite } from "./api";

describe("api client module", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("getHealth calls /api/health and returns payload", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", engine_version: "0.3.0" }),
    });

    const res = await getHealth();
    expect(res.status).toBe("ok");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ headers: expect.objectContaining({ "content-type": "application/json" }) })
    );
  });

  it("getExamples calls /api/examples and extracts examples list", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ examples: [{ id: "critical", title: "Critical Example" }] }),
    });

    const res = await getExamples();
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("critical");
  });

  it("createReview posts JSON body to /api/reviews", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "rev_1", verdict: { status: "NOT_SUPPORTED" } }),
    });

    const res = await createReview("claim text", "evidence text");
    expect(res.id).toBe("rev_1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/reviews",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ claim_text: "claim text", evidence_text: "evidence text" }),
      })
    );
  });

  it("getReview fetches /api/reviews/{id}", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "rev_123", claim_text: "claim", evidence_text: "evidence" }),
    });

    const res = await getReview("rev_123");
    expect(res.id).toBe("rev_123");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/reviews/rev_123",
      expect.objectContaining({ headers: expect.objectContaining({ "content-type": "application/json" }) })
    );
  });

  it("getReview throws ApiError with code on 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "REVIEW_NOT_FOUND", message: "No review with that id." } }),
    });

    await expect(getReview("nonexistent")).rejects.toThrow("No review with that id.");
    try {
      await getReview("nonexistent");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("REVIEW_NOT_FOUND");
    }
  });

  it("requestRewrite posts candidate text to /api/reviews/{id}/rewrite", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "supported", text: "Rewritten wording" }),
    });

    const res = await requestRewrite("rev_123", "candidate wording");
    expect(res.text).toBe("Rewritten wording");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/reviews/rev_123/rewrite",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ candidate_text: "candidate wording" }),
      })
    );
  });
});
