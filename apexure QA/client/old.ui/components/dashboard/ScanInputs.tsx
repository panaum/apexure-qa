import { Link2, Key, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ScanInputsProps {
  figmaUrl: string;
  figmaToken: string;
  webUrl: string;
  onFigmaUrlChange: (v: string) => void;
  onFigmaTokenChange: (v: string) => void;
  onWebUrlChange: (v: string) => void;
}

export const ScanInputs = ({
  figmaUrl,
  figmaToken,
  webUrl,
  onFigmaUrlChange,
  onFigmaTokenChange,
  onWebUrlChange,
}: ScanInputsProps) => {
  return (
    <div className="glass-card-static p-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Figma side */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-widest text-muted-foreground">Figma Source</h3>
          <div className="space-y-2">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://www.figma.com/design/..."
                value={figmaUrl}
                onChange={(e) => onFigmaUrlChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Figma Personal Access Token"
                value={figmaToken}
                onChange={(e) => onFigmaTokenChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Web side */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-widest text-muted-foreground">Web Page</h3>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="https://www.example.com/page"
              value={webUrl}
              onChange={(e) => onWebUrlChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
