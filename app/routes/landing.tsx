import { LandingNav } from "~/blocks/landing/landing-nav";
import { LandingHero } from "~/blocks/landing/landing-hero";
import { UnifiedBridge } from "~/blocks/landing/unified-bridge";
import { FeaturesSection } from "~/blocks/landing/features-section";
import { HowItWorks } from "~/blocks/landing/how-it-works";
import { StatsBand } from "~/blocks/landing/stats-band";
import { FinalCta } from "~/blocks/landing/final-cta";
import { LandingFooter } from "~/blocks/landing/landing-footer";

/** Marketing landing page for OmniBridge, separate from the app dashboard. */
export default function Landing() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <UnifiedBridge />
        <FeaturesSection />
        <HowItWorks />
        <StatsBand />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
