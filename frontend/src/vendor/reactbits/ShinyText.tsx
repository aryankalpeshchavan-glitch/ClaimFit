import type { CSSProperties } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

export function ShinyText({ text, disabled = false, speed = 4, className = "", style = {} }: ShinyTextProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !disabled && !reducedMotion;

  const animationStyle: CSSProperties = shouldAnimate
    ? {
        backgroundImage:
          "linear-gradient(120deg, var(--ink) 0%, var(--ink) 35%, var(--ok) 50%, var(--ink) 65%, var(--ink) 100%)",
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animationDuration: `${speed}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationName: "shiny-shimmer",
        display: "inline-block",
        ...style,
      }
    : {
        color: "var(--ink)",
        display: "inline-block",
        ...style,
      };

  return (
    <span className={`shiny-text ${className}`} style={animationStyle}>
      {text}
    </span>
  );
}
