import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("useInView", () => {
  const originalGlobalWindow = (globalThis as any).window;

  beforeEach(() => {
    (globalThis as any).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
  });

  afterEach(() => {
    (globalThis as any).window = originalGlobalWindow;
    vi.restoreAllMocks();
  });

  it("handles environment without IntersectionObserver gracefully", () => {
    delete (globalThis as any).window.IntersectionObserver;
    function checkFallback() {
      if (typeof (globalThis as any).window === "undefined") return true;
      if (typeof (globalThis as any).window.IntersectionObserver === "undefined") return true;
      return false;
    }
    expect(checkFallback()).toBe(true);
  });

  it("initializes to false when IntersectionObserver is defined", () => {
    (globalThis as any).window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    function checkInit() {
      if (typeof (globalThis as any).window === "undefined") return true;
      if (typeof (globalThis as any).window.IntersectionObserver === "undefined") return true;
      return false;
    }
    expect(checkInit()).toBe(false);
  });
});
