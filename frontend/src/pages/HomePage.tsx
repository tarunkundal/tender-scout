import { Faq } from "@/components/landing/Faq"
import { FeatureCards } from "@/components/landing/FeatureCards"
import { FinalCta } from "@/components/landing/FinalCta"
import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { MarketingFooter } from "@/components/layout/MarketingFooter"
import { MarketingHeader } from "@/components/layout/MarketingHeader"
import { SkipToContent } from "@/components/layout/SkipToContent"

export default function HomePage() {
  return (
    <>
      <title>TenderScout · Find government tenders you can win</title>
      <SkipToContent />
      <MarketingHeader />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <HowItWorks />
        <FeatureCards />
        <Faq />
        <FinalCta />
      </main>
      <MarketingFooter />
    </>
  )
}
