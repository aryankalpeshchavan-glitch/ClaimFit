import type { Span } from "./types";

export interface Mark { id: string; span: Span; tone: "ok" | "bad" | "warn" | "lr" }
export interface Segment { text: string; ids: string[]; tones: Mark["tone"][] }

/** Keep only spans whose offsets are valid AND whose quote equals the original text at those offsets. */
export function verifiedMarks(text: string, marks: Mark[]): Mark[] {
  return marks.filter(({ span: s }) => Number.isInteger(s.start) && Number.isInteger(s.end) && s.start >= 0 && s.start < s.end && s.end <= text.length && text.slice(s.start, s.end) === s.quote);
}

/** Split text into segments at every mark boundary. Pure text out: callers render with React nodes, never innerHTML. */
export function buildSegments(text: string, marks: Mark[]): Segment[] {
  const ok = verifiedMarks(text, marks);
  const cuts = new Set<number>([0, text.length]);
  ok.forEach((m) => { cuts.add(m.span.start); cuts.add(m.span.end); });
  const pts = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const cover = ok.filter((m) => m.span.start <= a && m.span.end >= b);
    out.push({ text: text.slice(a, b), ids: cover.map((m) => m.id), tones: cover.map((m) => m.tone) });
  }
  return out;
}
