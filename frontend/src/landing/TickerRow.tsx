import { LogoLoop, type TickerItem } from "../vendor/reactbits/LogoLoop";

const VERIFIED_SHAPES: TickerItem[] = [
  { id: "pct", label: "Percent change", code: "±N%" },
  { id: "time", label: "Time window", code: "N-day test" },
  { id: "pop", label: "Population cohort", code: "N users" },
  { id: "cond", label: "Plan / condition", code: "using Tier" },
  { id: "stat", label: "Median vs mean", code: "median ≠ avg" },
  { id: "pp", label: "Percentage points", code: "pts ≠ %" },
];

export function TickerRow() {
  return (
    <div className="ticker-section-wrapper" aria-label="Supported claim shapes">
      <LogoLoop items={VERIFIED_SHAPES} speed={30} />
    </div>
  );
}
