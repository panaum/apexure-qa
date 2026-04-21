import { type Severity } from "@/data/mockData";

interface StyleDiffBadgeProps {
  severity: Severity;
  animated?: boolean;
}

export const StyleDiffBadge = ({ severity, animated = false }: StyleDiffBadgeProps) => {
  const cls = `severity-badge severity-${severity.toLowerCase()}`;
  return (
    <span className={cls}>
      {animated && severity !== "Match" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot inline-block" />
      )}
      {severity}
    </span>
  );
};
