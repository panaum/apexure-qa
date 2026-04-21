import { Quote } from "lucide-react";
import { StyleDiffBadge } from "./StyleDiffBadge";
import { DiffTable } from "./DiffTable";
import { type Testimonial, type PropertyType } from "@/data/mockData";
import { useState } from "react";

interface TestimonialSectionProps {
  testimonials: Testimonial[];
  propertyFilter?: PropertyType[];
}

export const TestimonialSection = ({ testimonials, propertyFilter }: TestimonialSectionProps) => {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Testimonials</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">Style differences in testimonial elements</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <TestimonialCard key={i} testimonial={t} propertyFilter={propertyFilter} />
        ))}
      </div>
    </section>
  );
};

const TestimonialCard = ({ testimonial, propertyFilter }: { testimonial: Testimonial; propertyFilter?: PropertyType[] }) => {
  const [showDiffs, setShowDiffs] = useState(false);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
        <Quote className="h-4 w-4 text-primary" />
      </div>
      <p className="text-base text-foreground/80 leading-relaxed italic">"{testimonial.quote}"</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-foreground">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
        </div>
        <StyleDiffBadge severity={testimonial.differences.quoteText.severity} />
      </div>

      <button
        onClick={() => setShowDiffs(!showDiffs)}
        className="text-sm font-bold text-primary hover:text-primary/70 transition-colors"
      >
        {showDiffs ? "Hide" : "Show"} style differences
      </button>

      {showDiffs && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quote Text</p>
          <DiffTable differences={testimonial.differences.quoteText.differences} propertyFilter={propertyFilter} />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name/Role Text</p>
          <DiffTable differences={testimonial.differences.nameText.differences} propertyFilter={propertyFilter} />
        </div>
      )}
    </div>
  );
};
