import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { ScanInputs } from "@/components/dashboard/ScanInputs";
import { DifferenceCard } from "@/components/dashboard/DifferenceCard";
import { TestimonialSection } from "@/components/dashboard/TestimonialSection";
import { FAQSection } from "@/components/dashboard/FAQSection";
import { FilterSidebar } from "@/components/dashboard/FilterSidebar";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import {
  type Severity,
  type PropertyType,
  allSeverities,
  allPropertyTypes,
  headerDifferences,
  heroDifferences,
  cardDifferences,
  testimonials,
  faqItems,
  footerDifferences,
  getAllDifferences,
} from "@/data/mockData";
import { toast } from "sonner";

const Index = () => {
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([...allSeverities]);
  const [selectedProperties, setSelectedProperties] = useState<PropertyType[]>([...allPropertyTypes]);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [webUrl, setWebUrl] = useState("");

  const allDiffs = useMemo(() => getAllDifferences(), []);
  const issueCount = allDiffs.filter((d) => d.severity !== "Match").length;

  const filterBySeverity = <T extends { severity: Severity }>(items: T[]) =>
    items.filter((item) => selectedSeverities.includes(item.severity));

  const filteredHeader = filterBySeverity(headerDifferences);
  const filteredHero = filterBySeverity(heroDifferences);
  const filteredCards = filterBySeverity(cardDifferences);
  const filteredFooter = filterBySeverity(footerDifferences);

  const filteredTestimonials = testimonials.filter(
    (t) =>
      selectedSeverities.includes(t.differences.quoteText.severity) ||
      selectedSeverities.includes(t.differences.nameText.severity)
  );

  const filteredFaq = faqItems.filter(
    (f) =>
      selectedSeverities.includes(f.differences.questionText.severity) ||
      selectedSeverities.includes(f.differences.answerText.severity)
  );

  const handleRunScan = () => {
    toast.success("Scan complete!", {
      description: `Found ${issueCount} style differences across all sections.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background decorative blobs with pastel colors */}
      <div className="bg-blob w-[500px] h-[500px] bg-primary/20 top-[-100px] left-[-100px]" />
      <div className="bg-blob w-[400px] h-[400px] bg-[hsl(var(--pastel-pink)/0.15)] top-[40%] right-[-80px]" />
      <div className="bg-blob w-[350px] h-[350px] bg-[hsl(var(--pastel-blue)/0.12)] bottom-[10%] left-[20%]" />

      <DashboardHeader issueCount={issueCount} onRunScan={handleRunScan} />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 space-y-8 relative z-10">
        <HeroSection onRunScan={handleRunScan} />

        <ScanInputs
          figmaUrl={figmaUrl}
          figmaToken={figmaToken}
          webUrl={webUrl}
          onFigmaUrlChange={setFigmaUrl}
          onFigmaTokenChange={setFigmaToken}
          onWebUrlChange={setWebUrl}
        />

        <FilterSidebar
          selectedSeverities={selectedSeverities}
          selectedProperties={selectedProperties}
          onSeverityChange={setSelectedSeverities}
          onPropertyChange={setSelectedProperties}
        />

        <div className="space-y-10">
          {filteredHeader.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Header Elements</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHeader.map((d, i) => (
                  <DifferenceCard key={i} data={d} propertyFilter={selectedProperties} />
                ))}
              </div>
            </section>
          )}

          {filteredHero.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Hero Section</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredHero.map((d, i) => (
                  <DifferenceCard key={i} data={d} propertyFilter={selectedProperties} />
                ))}
              </div>
            </section>
          )}

          {filteredCards.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">UI Element Differences</h2>
                <p className="text-base text-muted-foreground mt-1 font-medium">Compare Figma values with live web styles</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCards.map((d, i) => (
                  <DifferenceCard key={i} data={d} propertyFilter={selectedProperties} />
                ))}
              </div>
            </section>
          )}

          {filteredTestimonials.length > 0 && (
            <TestimonialSection testimonials={filteredTestimonials} propertyFilter={selectedProperties} />
          )}

          {filteredFaq.length > 0 && (
            <FAQSection items={filteredFaq} propertyFilter={selectedProperties} />
          )}

          {filteredFooter.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">Footer Elements</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredFooter.map((d, i) => (
                  <DifferenceCard key={i} data={d} propertyFilter={selectedProperties} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Index;
