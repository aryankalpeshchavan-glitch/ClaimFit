import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
}

export function CountUp({ to, from = 0, duration = 1.2, className = "" }: CountUpProps) {
  const [value, setValue] = useState(from);
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setValue(to);
      return;
    }

    if (!ref.current || started.current) return;

    let animId: number;
    const startVal = from;
    const endVal = to;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    // Use IntersectionObserver to start counting when element becomes visible
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !started.current) {
            started.current = true;
            animId = requestAnimationFrame(tick);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
      return () => {
        observer.disconnect();
        cancelAnimationFrame(animId);
      };
    } else {
      started.current = true;
      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    }
  }, [to, from, duration, reducedMotion]);

  return (
    <span ref={ref} className={`count-up ${className}`}>
      {reducedMotion ? to : value}
    </span>
  );
}
