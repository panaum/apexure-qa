import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StyleDiffBadge } from "./StyleDiffBadge";
import { DiffTable } from "./DiffTable";
import { type FAQItem, type PropertyType } from "@/data/mockData";

interface FAQSectionProps {
  items: FAQItem[];
  propertyFilter?: PropertyType[];
}

export const FAQSection = ({ items, propertyFilter }: FAQSectionProps) => {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">FAQ</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Style differences in FAQ elements</p>
      </div>
      <div className="glass-card-static p-2">
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/40 last:border-0">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-display font-bold text-foreground text-base">{item.question}</span>
                  <StyleDiffBadge severity={item.differences.questionText.severity} />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 space-y-4">
                <p className="text-base text-muted-foreground leading-relaxed font-medium">{item.answer}</p>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question Text Styles</p>
                  <DiffTable differences={item.differences.questionText.differences} propertyFilter={propertyFilter} />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Answer Text Styles</p>
                  <DiffTable differences={item.differences.answerText.differences} propertyFilter={propertyFilter} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
