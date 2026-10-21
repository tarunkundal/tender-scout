import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "What is TenderScout?",
    a: "TenderScout helps small and medium businesses find government tenders they can win. It matches tenders to your profile, checks eligibility conditions, and builds a bid checklist, with a source page for every fact.",
  },
  {
    q: "Which portals do you cover?",
    a: "GeM, CPPP and major state e-procurement portals. More portals are coming.",
  },
  {
    q: "Is my company data safe?",
    a: "We're building TenderScout with privacy in mind. Your documents are used only to check your eligibility for tenders, and we will never sell your data. Full details will be in our privacy policy before launch.",
  },
  {
    q: "Is this legal advice?",
    a: "No. TenderScout is decision support. Always verify with the official tender document before you bid.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      tabIndex={-1}
      className="scroll-mt-20 border-t focus:outline-none"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <h2
          id="faq-title"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Frequently asked questions
        </h2>
        {/* Radix renders each trigger inside an <h3>. */}
        <Accordion type="single" collapsible className="mt-10 max-w-3xl">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
