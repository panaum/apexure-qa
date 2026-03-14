import { type ElementDifferences, type PropertyType } from "@/data/mockData";

interface DiffTableProps {
  differences: ElementDifferences["differences"];
  propertyFilter?: PropertyType[];
}

const propLabels: Record<string, string> = {
  color: "Color",
  fontSize: "Font Size",
  fontWeight: "Font Weight",
  fontFamily: "Font Family",
  lineHeight: "Line Height",
};

export const DiffTable = ({ differences, propertyFilter }: DiffTableProps) => {
  const entries = Object.entries(differences).filter(([key]) =>
    !propertyFilter?.length || propertyFilter.includes(key as PropertyType)
  );

  if (!entries.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="px-4 py-2.5 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider">Property</th>
            <th className="px-4 py-2.5 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider">Figma</th>
            <th className="px-4 py-2.5 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider">Web</th>
            <th className="px-4 py-2.5 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => {
            const match = String(val.figma) === String(val.web);
            return (
              <tr key={key} className="border-t border-border/40">
                <td className="px-4 py-2.5 font-semibold text-foreground text-sm">{propLabels[key]}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{String(val.figma)}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{String(val.web)}</td>
                <td className="px-4 py-2.5">
                  {match ? (
                    <span className="severity-badge severity-match text-xs">Match</span>
                  ) : (
                    <span className="severity-badge severity-critical text-xs">Diff</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
