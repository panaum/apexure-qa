import { Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { type Severity, type PropertyType, allSeverities, allPropertyTypes } from "@/data/mockData";

interface FilterSidebarProps {
  selectedSeverities: Severity[];
  selectedProperties: PropertyType[];
  onSeverityChange: (s: Severity[]) => void;
  onPropertyChange: (p: PropertyType[]) => void;
}

const propLabels: Record<PropertyType, string> = {
  color: "Color",
  fontSize: "Font Size",
  fontWeight: "Font Weight",
  fontFamily: "Font Family",
  lineHeight: "Line Height",
};

export const FilterSidebar = ({
  selectedSeverities,
  selectedProperties,
  onSeverityChange,
  onPropertyChange,
}: FilterSidebarProps) => {
  const toggleSeverity = (s: Severity) => {
    onSeverityChange(
      selectedSeverities.includes(s)
        ? selectedSeverities.filter((x) => x !== s)
        : [...selectedSeverities, s]
    );
  };

  const toggleProperty = (p: PropertyType) => {
    onPropertyChange(
      selectedProperties.includes(p)
        ? selectedProperties.filter((x) => x !== p)
        : [...selectedProperties, p]
    );
  };

  return (
    <div className="glass-card-static p-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-base">Filters</h3>
        </div>

        <div className="h-8 w-px bg-border/50 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Severity</p>
          {allSeverities.map((s) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-lg hover:bg-accent/50 transition-colors">
              <Checkbox
                checked={selectedSeverities.includes(s)}
                onCheckedChange={() => toggleSeverity(s)}
                className="rounded border-muted-foreground/40"
              />
              <span className={`severity-badge severity-${s.toLowerCase()} text-xs`}>{s}</span>
            </label>
          ))}
        </div>

        <div className="h-8 w-px bg-border/50 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Property</p>
          {allPropertyTypes.map((p) => (
            <label key={p} className="flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-lg hover:bg-accent/50 transition-colors">
              <Checkbox
                checked={selectedProperties.includes(p)}
                onCheckedChange={() => toggleProperty(p)}
                className="rounded border-muted-foreground/40"
              />
              <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">{propLabels[p]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
