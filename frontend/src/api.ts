import type { Example, Health, Review, RewriteResult } from "./types";

export class ApiError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

async function call<T>(path: string, init?: RequestInit, timeoutMs = 45000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, signal: ctl.signal, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const e = (body as { error?: { code?: string; message?: string } } | null)?.error;
      throw new ApiError(e?.code ?? "HTTP_" + res.status, e?.message ?? "The server could not complete the request.");
    }
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") throw new ApiError("TIMEOUT", "The check took too long. Try again, or shorten the evidence.");
    throw new ApiError("NETWORK", "Could not reach the ScopeLock server. Check your connection and try again.");
  } finally { clearTimeout(timer); }
}

export const getHealth = () => call<Health>("/api/health", undefined, 8000);
export const getExamples = () => call<{ examples: Example[] }>("/api/examples", undefined, 8000).then((r) => r.examples);
export const createReview = (claim_text: string, evidence_text: string) =>
  call<Review>("/api/reviews", { method: "POST", body: JSON.stringify({ claim_text, evidence_text }) });
export const requestRewrite = (id: string, candidate_text?: string) =>
  call<RewriteResult>(`/api/reviews/${id}/rewrite`, { method: "POST", body: JSON.stringify(candidate_text === undefined ? {} : { candidate_text }) });
