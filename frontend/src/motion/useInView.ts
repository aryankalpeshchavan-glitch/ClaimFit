import { useEffect, useState, type RefObject } from "react";
import { getPrefersReducedMotion } from "./viewTransition";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const { threshold = 0.15, rootMargin = "0px", triggerOnce = true } = options;

  // Safe SSR and reduced motion check
  const [inView, setInView] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (getPrefersReducedMotion()) return true;
    if (typeof window.IntersectionObserver === "undefined") return true;
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getPrefersReducedMotion() || typeof window.IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    let unmounted = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!unmounted) setInView(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            if (!unmounted) setInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      unmounted = true;
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, triggerOnce]);

  return inView;
}
