import { useEffect, useState } from "react";
import { getPrefersReducedMotion } from "./viewTransition";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => getPrefersReducedMotion());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else if ((mq as any).addListener) {
      (mq as any).addListener(handler);
      return () => (mq as any).removeListener(handler);
    }
  }, []);

  return reduced;
}
