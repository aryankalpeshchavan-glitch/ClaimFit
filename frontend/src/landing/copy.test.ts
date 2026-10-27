import { describe, expect, it } from "vitest";
import { LANDING_COPY } from "./copy";

describe("Landing copy validation", () => {
  const allText = JSON.stringify(LANDING_COPY).toLowerCase();

  it("does not contain banned credibility claims (trusted by, testimonial, outperform)", () => {
    expect(allText).not.toContain("trusted by");
    expect(allText).not.toContain("testimonial");
    expect(allText).not.toContain("outperform");
  });

  it("only mentions accuracy in honest disclaimer context", () => {
    // If accuracy appears, it must be part of "not an accuracy figure"
    if (allText.includes("accuracy")) {
      expect(allText).toContain("not an accuracy figure");
      // Check there are no claims like "99% accuracy" or "high accuracy"
      expect(allText).not.toMatch(/\b\d+%\s*accuracy\b/);
      expect(allText).not.toMatch(/\bhigh\s*accuracy\b/);
      expect(allText).not.toMatch(/\baccurate\s*to\b/);
    }
  });

  it("includes clear disclaimer that Supported is not objectively true", () => {
    expect(allText).toContain("cannot tell you a claim is true");
    expect(allText).toContain("never means objectively true");
  });
});
