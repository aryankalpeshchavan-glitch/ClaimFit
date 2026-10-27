import { describe, expect, it } from "vitest";
import { parseRoute } from "./router";

describe("router parseRoute", () => {
  it("matches root landing page", () => {
    const r = parseRoute("/");
    expect(r.name).toBe("landing");
    expect(r.notFound).toBeFalsy();
    expect(r.exampleId).toBeUndefined();
  });

  it("matches root landing page with query string", () => {
    const r = parseRoute("/?example=critical");
    expect(r.name).toBe("landing");
    expect(r.exampleId).toBe("critical");
  });

  it("matches checker path", () => {
    const r = parseRoute("/check");
    expect(r.name).toBe("checker");
    expect(r.notFound).toBeFalsy();
    expect(r.exampleId).toBeUndefined();
  });

  it("matches checker path with example param", () => {
    const r = parseRoute("/check?example=critical");
    expect(r.name).toBe("checker");
    expect(r.exampleId).toBe("critical");
  });

  it("matches saved review path /r/:id", () => {
    const r = parseRoute("/r/demo-critical");
    expect(r.name).toBe("review");
    expect(r.reviewId).toBe("demo-critical");
    expect(r.notFound).toBeFalsy();
  });

  it("matches review path with query param", () => {
    const r = parseRoute("/r/rev123?example=foo");
    expect(r.name).toBe("review");
    expect(r.reviewId).toBe("rev123");
    expect(r.exampleId).toBe("foo");
  });

  it("treats empty review id as landing with notFound", () => {
    const r = parseRoute("/r/");
    expect(r.name).toBe("landing");
    expect(r.notFound).toBe(true);
  });

  it("marks unknown path as landing with notFound", () => {
    const r = parseRoute("/unknown-page");
    expect(r.name).toBe("landing");
    expect(r.notFound).toBe(true);
  });
});
