export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function transitionRoute(updateFn: () => void): void {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function" &&
    !getPrefersReducedMotion()
  ) {
    (document as any).startViewTransition(() => {
      updateFn();
    });
  } else {
    updateFn();
  }
}
