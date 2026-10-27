import { Hero } from "../landing/Hero";
import { TickerRow } from "../landing/TickerRow";
import { TrustRow } from "../landing/TrustRow";
import { HowItWorks } from "../landing/HowItWorks";
import { Catches } from "../landing/Catches";
import { Dimensions } from "../landing/Dimensions";
import { Scenarios } from "../landing/Scenarios";
import { BenchmarkBand } from "../landing/BenchmarkBand";
import { Limits } from "../landing/Limits";
import { Faq } from "../landing/Faq";
import { CtaBand } from "../landing/CtaBand";

interface LandingProps {
  notFound?: boolean;
}

export default function Landing({ notFound }: LandingProps) {
  return (
    <div className="landing-page-root">
      <div className="shell landing-shell">
        {notFound && (
          <div className="banner warn" role="alert" style={{ marginTop: 24, marginBottom: 12 }}>
            <div>
              <b>Page not found.</b> The URL you visited does not exist. We’ve brought you to the ClaimFit home page.
            </div>
          </div>
        )}

        {/* Hero and interactive demo card */}
        <Hero />

        {/* Claim shapes ticker */}
        <TickerRow />

        {/* Trust row */}
        <TrustRow />

        {/* How it works */}
        <HowItWorks />

        {/* What it catches */}
        <Catches />

        {/* Seven dimensions explorer */}
        <Dimensions />

        {/* Try a scenario */}
        <Scenarios />

        {/* Benchmark band (only renders if real benchmark data exists) */}
        <BenchmarkBand />

        {/* Limits */}
        <Limits />

        {/* FAQ */}
        <Faq />
      </div>

      {/* Closing call to action (full width) */}
      <CtaBand />
    </div>
  );
}
