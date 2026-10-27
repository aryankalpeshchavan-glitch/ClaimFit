import { useRef, type CSSProperties, type ReactNode } from "react";
import { useInView } from "./useInView";
import { useReducedMotion } from "./useReducedMotion";

interface RevealProps {
  children: ReactNode;
  delay?: number; // ms
  staggerIndex?: number;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

export function Reveal({
  children,
  delay = 0,
  staggerIndex = 0,
  className = "",
  style = {},
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15, triggerOnce: true });
  const reducedMotion = useReducedMotion();

  const totalDelayMs = delay + staggerIndex * 60; // --stagger: 60ms

  const Component = as as any;

  if (reducedMotion) {
    return (
      <Component ref={ref} className={`reveal-item revealed ${className}`} style={style}>
        {children}
      </Component>
    );
  }

  const animStyle: CSSProperties = {
    ...style,
    transition: `opacity var(--dur-3) var(--ease-out) ${totalDelayMs}ms, transform var(--dur-3) var(--ease-out) ${totalDelayMs}ms`,
  };

  return (
    <Component
      ref={ref}
      className={`reveal-item ${inView ? "revealed" : "pre-reveal"} ${className}`}
      style={animStyle}
    >
      {children}
    </Component>
  );
}
