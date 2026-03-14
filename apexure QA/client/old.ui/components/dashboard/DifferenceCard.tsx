import { useState } from "react";
import { ChevronDown, ChevronUp, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StyleDiffBadge } from "./StyleDiffBadge";
import { DiffTable } from "./DiffTable";
import { type ElementDifferences, type PropertyType } from "@/data/mockData";

interface DifferenceCardProps {
  data: ElementDifferences;
  propertyFilter?: PropertyType[];
}

export const DifferenceCard = ({ data, propertyFilter }: DifferenceCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const diffCount = Object.entries(data.differences).filter(
    ([key, val]) =>
      (!propertyFilter?.length || propertyFilter.includes(key as PropertyType)) &&
      String(val.figma) !== String(val.web)
  ).length;

  return (
    <div className={`glass-card p-6 space-y-4 ${accepted ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-foreground text-base">{data.element}</h3>
          <p className="text-sm text-muted-foreground font-medium">{data.section} · {diffCount} diff{diffCount !== 1 ? "s" : ""}</p>
        </div>
        <StyleDiffBadge severity={data.severity} animated />
      </div>

      {expanded && (
        <div className="space-y-4 pt-1">
          <DiffTable differences={data.differences} propertyFilter={propertyFilter} />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={accepted ? "secondary" : "outline"}
              className="gap-1.5 text-sm font-bold rounded-lg"
              onClick={() => setAccepted(!accepted)}
            >
              <Check className="h-3.5 w-3.5" />
              {accepted ? "Accepted" : "Mark as accepted"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-sm font-semibold rounded-lg">
              <ExternalLink className="h-3.5 w-3.5" />
              Highlight on live page
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/70 transition-colors"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {expanded ? "Collapse" : "View Details"}
      </button>
    </div>
  );
};
