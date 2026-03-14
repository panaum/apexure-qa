// Apexure QA Header
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

interface DashboardHeaderProps {
  issueCount: number;
  onRunScan: () => void;
}

export const DashboardHeader = ({ issueCount, onRunScan }: DashboardHeaderProps) => {
  const synced = issueCount === 0;

  return (
    <header className="sticky top-0 z-50 glass-card-static rounded-none border-x-0 border-t-0">
      <div className="container mx-auto flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <img src={logo} alt="Apexure QA Logo" className="h-10 w-10 object-contain" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {["Dashboard", "Settings", "Help"].map((link) => (
            <a
              key={link}
              href="#"
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl transition-all"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm glass-card-static px-3.5 py-2 rounded-full">
            <span className={`h-2.5 w-2.5 rounded-full ${synced ? "bg-severity-match" : "bg-severity-critical animate-pulse"}`} />
            <span className="text-muted-foreground text-sm font-semibold hidden sm:inline">
              {synced ? "Synced" : `${issueCount} Issues`}
            </span>
          </div>
          <Button size="sm" onClick={onRunScan} className="gap-2 rounded-xl shadow-md font-bold text-sm">
            <Play className="h-4 w-4" />
            Run Scan
          </Button>
        </div>
      </div>
    </header>
  );
};
