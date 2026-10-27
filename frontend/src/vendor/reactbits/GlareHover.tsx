import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../motion/useReducedMotion";

interface GlareHoverProps {
  children: ReactNode;
  className?: string;
  glareColor?: string;
  maxOpacity?: number;
}

export function GlareHover({
  children,
  className = "",
  glareColor = "rgba(255, 255, 255, 0.4)",
  maxOpacity = 0.35,
}: GlareHoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 0, y: 0, opacity: 0 });
  const reducedMotion = useReducedMotion();

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlare({ x, y, opacity: maxOpacity });
  };

  const handleMouseLeave = () => {
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glare-hover-card ${className}`}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {children}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            background: `radial-gradient(circle 260px at ${glare.x}px ${glare.y}px, ${glareColor}, transparent 80%)`,
            opacity: glare.opacity,
            transition: "opacity 0.25s ease-out",
          }}
        />
      )}
    </div>
  );
}
