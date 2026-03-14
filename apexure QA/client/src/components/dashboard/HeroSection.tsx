import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onRunScan: () => void;
}

export const HeroSection = ({ onRunScan }: HeroSectionProps) => {
  return (
    <section className="glass-card p-10 md:p-14 lg:p-16 overflow-hidden relative">
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-start gap-7 relative z-10">
        <div className="space-y-7">
          <h1 className="font-display text-5xl md:text-6xl lg:text-[4rem] font-bold text-foreground leading-[1.08] tracking-tight">
            Apexure <span className="text-primary">QA</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed font-medium">
            Track typography, color, spacing, and layout differences between Figma and your website. Catch drift before your users do.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onRunScan} className="gap-2 rounded-xl shadow-lg font-bold text-base px-8">
              Run Scan
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 rounded-xl bg-card/50 backdrop-blur-sm border-border/60 font-bold text-base px-8">
              View Docs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
