import { describe, expect, it } from "vitest";
import { buildSegments, verifiedMarks } from "./highlight";

const text = "Cuts setup time by 40% for every <b>business</b>.";
const mk = (id: string, start: number, end: number): { id: string; span: { start: number; end: number; quote: string }; tone: "ok" } =>
  ({ id, tone: "ok", span: { start, end, quote: text.slice(start, end) } });

describe("highlight offsets", () => {
  it("round-trips the original text exactly", () => {
    const segs = buildSegments(text, [mk("value", 19, 21), mk("pop", 26, 32)]);
    expect(segs.map((s) => s.text).join("")).toBe(text);
  });
  it("rejects spans whose quote does not match the text", () => {
    const bad = { id: "x", tone: "ok" as const, span: { start: 0, end: 4, quote: "nope" } };
    expect(verifiedMarks(text, [bad])).toEqual([]);
  });
  it("rejects out-of-range and empty spans", () => {
    const m = (s: number, e: number) => ({ id: "x", tone: "ok" as const, span: { start: s, end: e, quote: "" } });
    expect(verifiedMarks(text, [m(5, 5), m(-1, 3), m(10, 999)])).toEqual([]);
  });
  it("keeps markup-looking user text as plain text segments (no HTML construction)", () => {
    const segs = buildSegments(text, [mk("pop", 33, 36)]);
    expect(segs.some((s) => s.text.includes("<b>"))).toBe(true);
  });
  it("handles overlapping marks by listing every covering id", () => {
    const segs = buildSegments(text, [mk("a", 0, 10), mk("b", 5, 15)]);
    expect(segs.find((s) => s.ids.length === 2)).toBeTruthy();
  });
});
