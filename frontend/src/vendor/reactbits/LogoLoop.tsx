import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

export interface TickerItem {
  id: string;
  label: string;
  code: string;
}

interface LogoLoopProps {
  items: TickerItem[];
  speed?: number; // seconds per full loop
}

export function LogoLoop({ items, speed = 25 }: LogoLoopProps) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setPaused(true);
      } else {
        setPaused(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (reducedMotion) {
    return (
      <div className="shapes-ticker static-wrapped" aria-label="Supported claim shapes">
        <span className="ticker-label">Shapes verified:</span>
        <div className="ticker-chips">
          {items.map((it) => (
            <span key={it.id} className="chip">
              <code>{it.code}</code> {it.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Duplicate items for continuous marquee
  const trackItems = [...items, ...items];

  return (
    <div
      ref={containerRef}
      className="shapes-ticker"
      aria-label="Supported claim shapes ticker"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      <div className="ticker-fade left" aria-hidden="true" />
      <div
        className="ticker-track"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {trackItems.map((it, idx) => (
          <span key={`${it.id}-${idx}`} className="chip ticker-chip">
            <span className="ticker-code">{it.code}</span>
            <span>{it.label}</span>
          </span>
        ))}
      </div>
      <div className="ticker-fade right" aria-hidden="true" />
    </div>
  );
}
