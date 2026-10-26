import type { Status, VerdictStatus } from "./types";
import { STATUS_LABEL, VERDICT_TONE } from "./labels";

export type Tone = "ok" | "bad" | "warn";
export const statusTone = (s: Status): Tone => (s === "supported" ? "ok" : s === "contradicted" ? "bad" : "warn");

export function Icon({ tone, size = 16 }: { tone: Tone; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (tone === "ok") return <svg {...common}><path d="M3.5 8.5l3 3 6-6.5" /></svg>;
  if (tone === "bad") return <svg {...common}><path d="M4 4l8 8M12 4l-8 8" /></svg>;
  return <svg {...common}><path d="M6.2 6.2a1.9 1.9 0 113 1.5c-.7.5-1.2.9-1.2 1.7M8 12v.01" /></svg>;
}

export function StatusTag({ status }: { status: Status }) {
  const t = statusTone(status);
  return <span className={`tag ${t}`}><Icon tone={t} size={13} />{STATUS_LABEL[status]}</span>;
}

export const verdictTone = (v: VerdictStatus): Tone => VERDICT_TONE[v];

export function Chevron() {
  return <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5l4.5 4.5L6 12.5" /></svg>;
}
