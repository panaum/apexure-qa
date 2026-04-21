import { useState } from "react";
import { toast } from "sonner";

// --- Helpers ---
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-green-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-white/10";
  if (score >= 90) return "bg-green-500/10 border-green-500/30";
  if (score >= 50) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function scoreRingColor(score: number | null): string {
  if (score === null) return "#64748b";
  if (score >= 90) return "#4ade80";
  if (score >= 50) return "#fb923c";
  return "#f87171";
}

function fieldCategoryBadge(category: string | undefined) {
  if (!category) return null;
  const map: Record<string, { label: string; cls: string }> = {
    FAST: { label: "Good", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    AVERAGE: { label: "Needs Improvement", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    SLOW: { label: "Poor", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const d = map[category] ?? { label: category, cls: "bg-white/10 text-muted-foreground border-white/10" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${d.cls}`}>
      {d.label}
    </span>
  );
}

// --- Score Gauge SVG ---
function ScoreGauge({ score, label }: { score: number | null; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? score / 100 : 0;
  const strokeDash = circumference * pct;
  const color = scoreRingColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-black ${scoreColor(score)}`}>
            {score ?? "—"}
          </span>
        </div>
      </div>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// --- Expandable Audit Row ---
function AuditRow({ audit }: { audit: any }) {
  const [open, setOpen] = useState(false);
  const items = audit.details?.items ?? [];
  const hasItems = items.length > 0;

  return (
    <div className="border-t border-white/5">
      <button
        onClick={() => hasItems && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/5 transition-all ${hasItems ? "cursor-pointer" : "cursor-default"}`}
      >
        {hasItems && (
          <span className={`text-xs text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{audit.title}</p>
          {audit.displayValue && (
            <p className="text-xs text-muted-foreground mt-0.5">{audit.displayValue}</p>
          )}
        </div>
        {audit.score !== null && (
          <div className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreBg(audit.score)} ${scoreColor(audit.score)}`}>
            {audit.score}
          </div>
        )}
      </button>
      {open && hasItems && (
        <div className="px-5 pb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 text-muted-foreground font-bold uppercase tracking-wider">Resource</th>
                <th className="text-right py-1.5 text-muted-foreground font-bold uppercase tracking-wider w-24">Size</th>
                <th className="text-right py-1.5 text-muted-foreground font-bold uppercase tracking-wider w-24">Savings</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((item: any, i: number) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-1.5 pr-4">
                    <p className="text-white truncate max-w-sm"
                       title={item.url ?? item.node?.snippet ?? ""}
                    >
                      {item.url ? new URL(item.url).pathname.split("/").pop() || item.url : item.node?.nodeLabel || item.label || "—"}
                    </p>
                    {item.url && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-sm mt-0.5">{item.url}</p>
                    )}
                  </td>
                  <td className="py-1.5 text-right text-muted-foreground font-mono">
                    {item.totalBytes ? formatBytes(item.totalBytes) : "—"}
                  </td>
                  <td className="py-1.5 text-right text-orange-400 font-mono font-semibold">
                    {item.wastedBytes ? formatBytes(item.wastedBytes) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length > 20 && (
            <p className="text-[10px] text-muted-foreground mt-2">+ {items.length - 20} more items</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Image Sandbox Card ---
function ImageSandboxCard({ image }: { image: any }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<{
    blob: Blob; originalSize: number; optimizedSize: number;
  } | null>(null);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const response = await fetch("/api/pagespeed/optimize-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: image.url,
          targetWidth: image.displayedWidth || undefined,
          targetHeight: image.displayedHeight || undefined,
          format: "webp",
          quality: 80,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Optimization failed");
      }
      const blob = await response.blob();
      const originalSize = parseInt(response.headers.get("X-Original-Size") || "0");
      const optimizedSize = parseInt(response.headers.get("X-Optimized-Size") || "0");
      setOptimizedResult({ blob, originalSize, optimizedSize });
      toast.success("Image optimized successfully!");
    } catch (err: any) {
      toast.error("Optimization Failed", { description: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  const handleDownload = () => {
    if (!optimizedResult) return;
    const url = URL.createObjectURL(optimizedResult.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized.webp";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filename = (() => {
    try { return new URL(image.url).pathname.split("/").pop() || "image"; } catch { return "image"; }
  })();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-white/10 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate" title={image.url}>{filename}</p>
          {image.label && <p className="text-[10px] text-muted-foreground truncate">{image.label}</p>}
        </div>
        {image.weightLifted > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-cyan-400">🚀 {image.weightLifted}%</span>
            <span className="text-[10px] text-muted-foreground">weight lifted</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Image preview + metrics */}
        <div className="flex gap-5">
          {/* Thumbnail */}
          <div className="w-32 h-20 rounded-lg border border-white/10 bg-black/30 overflow-hidden flex-shrink-0">
            <img
              src={image.url} alt={filename}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Metric grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Original Size</p>
              <p className="text-red-400 font-bold text-sm">{formatBytes(image.totalBytes)}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Potential Saving</p>
              <p className="text-green-400 font-bold text-sm">{formatBytes(image.wastedBytes)}</p>
            </div>
            {(image.displayedWidth && image.displayedHeight) && (
              <div>
                <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Displayed</p>
                <p className="text-white font-mono">{image.displayedWidth}×{image.displayedHeight}</p>
              </div>
            )}
            {(image.naturalWidth && image.naturalHeight) && (
              <div>
                <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Natural</p>
                <p className="text-white font-mono">{image.naturalWidth}×{image.naturalHeight}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gravity Reduction Bar */}
        {image.weightLifted > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gravity Reduction</span>
              <span className="text-xs font-bold text-cyan-400">{image.weightLifted}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-1000"
                style={{ width: `${Math.min(image.weightLifted, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all"
          >
            {optimizing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing...
              </span>
            ) : (
              "🚀 Simulate Anti-Gravity Optimization"
            )}
          </button>
          {optimizedResult && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold transition-all"
            >
              ⬇ Download Light Version
            </button>
          )}
        </div>

        {/* Optimization result */}
        {optimizedResult && (
          <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-bold">✓ Optimized!</span>
              <span className="text-muted-foreground">
                {formatBytes(optimizedResult.originalSize)} → {formatBytes(optimizedResult.optimizedSize)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">
                {((1 - optimizedResult.optimizedSize / optimizedResult.originalSize) * 100).toFixed(1)}% smaller
              </span>
              <span className="text-muted-foreground">• WebP @ 80% quality</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================
// Main PageSpeedTab Component
// ============================

interface PageSpeedTabProps {
  // Externally managed state from Index.tsx
  psiUrl: string;
  setPsiUrl: (v: string) => void;
  psiResults: any;
  setPsiResults: (v: any) => void;
  isPsiLoading: boolean;
  setIsPsiLoading: (v: boolean) => void;
}

export function PageSpeedTab({
  psiUrl, setPsiUrl, psiResults, setPsiResults, isPsiLoading, setIsPsiLoading,
}: PageSpeedTabProps) {
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [activeSection, setActiveSection] = useState<"overview" | "opportunities" | "images">("overview");

  const handleRun = async () => {
    if (!psiUrl) {
      toast.error("Missing URL", { description: "Please enter a URL to audit." });
      return;
    }
    setIsPsiLoading(true);
    setPsiResults(null);
    setActiveSection("overview");
    const loadingToast = toast.loading(`Running PageSpeed analysis (${strategy})...`);
    try {
      const response = await fetch("/api/pagespeed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: psiUrl, strategy }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "PageSpeed audit failed.");
      }
      const results = await response.json();
      setPsiResults(results);
      toast.dismiss(loadingToast);
      const perfScore = results.scores?.performance;
      toast.success(`Performance: ${perfScore ?? "N/A"}/100`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("PageSpeed Failed", { description: error.message });
    } finally {
      setIsPsiLoading(false);
    }
  };

  return (
    <>
      {/* Input Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Website URL</label>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold uppercase tracking-wide">
            ✦ Powered by Google PSI
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="https://yoursite.com"
            value={psiUrl}
            onChange={(e) => setPsiUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          {/* Strategy toggle */}
          <div className="flex gap-0.5 p-0.5 bg-white/5 border border-white/10 rounded-lg">
            {(["mobile", "desktop"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`px-3 py-2 rounded text-xs font-bold transition-all capitalize ${
                  strategy === s ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {s === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
              </button>
            ))}
          </div>
          <button
            onClick={handleRun}
            disabled={isPsiLoading}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all"
          >
            {isPsiLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Full PageSpeed Insights audit — performance scores, Core Web Vitals, opportunities, and image optimization sandbox.
        </p>
      </div>

      {/* Loading */}
      {isPsiLoading && (
        <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xl font-bold">Running PageSpeed Insights...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take 30–60 seconds. Google Lighthouse is auditing your page.</p>
        </div>
      )}

      {/* Results */}
      {!isPsiLoading && psiResults && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-cyan-400">PageSpeed Report</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {psiResults.finalUrl} • {psiResults.strategy} • {psiResults.fetchTime ? new Date(psiResults.fetchTime).toLocaleString() : ""}
              </p>
            </div>
          </div>

          {/* Quick Wins */}
          {psiResults.quickWins && psiResults.quickWins.length > 0 && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Quick Wins — Heaviest Assets</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {psiResults.quickWins.map((qw: any, i: number) => (
                  <div key={i} className="rounded-lg border border-orange-500/20 bg-orange-950/20 p-3">
                    <p className="text-xs font-bold text-white truncate" title={qw.url}>{
                      qw.url ? (() => { try { return new URL(qw.url).pathname.split("/").pop() || qw.url; } catch { return qw.url; } })() : qw.label || "—"
                    }</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{qw.source}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{formatBytes(qw.totalBytes)}</span>
                      <span className="text-xs font-bold text-orange-400">Save {formatBytes(qw.wastedBytes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-xl border border-white/10 bg-white/5">
            <ScoreGauge score={psiResults.scores?.performance} label="Performance" />
            <ScoreGauge score={psiResults.scores?.accessibility} label="Accessibility" />
            <ScoreGauge score={psiResults.scores?.["best-practices"]} label="Best Practices" />
            <ScoreGauge score={psiResults.scores?.seo} label="SEO" />
          </div>

          {/* Field Data */}
          {Object.keys(psiResults.fieldData ?? {}).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Field Data (CrUX)</h3>
                {psiResults.fieldOverallCategory && fieldCategoryBadge(psiResults.fieldOverallCategory)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["LCP", "INP", "CLS"] as const).map((key) => {
                  const d = psiResults.fieldData?.[key];
                  if (!d) return null;
                  const displayVal = key === "CLS"
                    ? (d.percentile / 100).toFixed(2)
                    : key === "INP"
                    ? `${d.percentile} ms`
                    : `${(d.percentile / 1000).toFixed(1)} s`;
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${scoreBg(d.category === "FAST" ? 90 : d.category === "AVERAGE" ? 60 : 20)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">{key}</span>
                        {fieldCategoryBadge(d.category)}
                      </div>
                      <p className={`text-2xl font-black ${d.category === "FAST" ? "text-green-400" : d.category === "AVERAGE" ? "text-orange-400" : "text-red-400"}`}>
                        {displayVal}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">75th percentile</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lab Metrics */}
          {Object.keys(psiResults.labMetrics ?? {}).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Lab Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(psiResults.labMetrics).map(([label, metric]: [string, any]) => (
                  <div key={label} className={`rounded-xl border p-4 text-center ${scoreBg(metric.score)}`}>
                    <p className={`text-xl font-black ${scoreColor(metric.score)}`}>
                      {metric.displayValue ?? "—"}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg w-fit text-xs">
            {([
              { key: "overview", label: `Audits (${(psiResults.opportunities?.length ?? 0) + (psiResults.diagnostics?.length ?? 0)})` },
              { key: "opportunities", label: `Opportunities (${psiResults.opportunities?.length ?? 0})` },
              { key: "images", label: `Image Sandbox (${psiResults.imageItems?.length ?? 0})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`px-3 py-1.5 rounded font-semibold transition-all ${
                  activeSection === key ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Opportunities & Diagnostics */}
          {activeSection === "overview" && (
            <div className="space-y-4">
              {psiResults.opportunities?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-5 py-3 bg-white/10">
                    <span className="text-sm font-semibold text-white">Opportunities</span>
                    <span className="ml-2 text-xs text-muted-foreground">Suggestions to make your page load faster</span>
                  </div>
                  {psiResults.opportunities.map((audit: any) => (
                    <AuditRow key={audit.id} audit={audit} />
                  ))}
                </div>
              )}
              {psiResults.diagnostics?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-5 py-3 bg-white/10">
                    <span className="text-sm font-semibold text-white">Diagnostics</span>
                    <span className="ml-2 text-xs text-muted-foreground">More information about the performance of your page</span>
                  </div>
                  {psiResults.diagnostics.map((audit: any) => (
                    <AuditRow key={audit.id} audit={audit} />
                  ))}
                </div>
              )}
              {(psiResults.opportunities?.length === 0 && psiResults.diagnostics?.length === 0) && (
                <div className="w-full p-12 flex flex-col items-center justify-center bg-green-950/20 rounded-xl border border-green-500/20 text-center">
                  <p className="text-3xl mb-3">✓</p>
                  <p className="text-lg font-semibold text-green-400">All checks passed!</p>
                  <p className="text-sm text-muted-foreground mt-1">No performance opportunities or diagnostics flagged</p>
                </div>
              )}
            </div>
          )}

          {activeSection === "opportunities" && (
            <div className="space-y-4">
              {psiResults.opportunities?.length > 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-5 py-3 bg-white/10">
                    <span className="text-sm font-semibold text-white">All Opportunities</span>
                  </div>
                  {psiResults.opportunities.map((audit: any) => (
                    <AuditRow key={audit.id} audit={audit} />
                  ))}
                </div>
              ) : (
                <div className="w-full p-12 flex flex-col items-center justify-center bg-green-950/20 rounded-xl border border-green-500/20 text-center">
                  <p className="text-3xl mb-3">✓</p>
                  <p className="text-lg font-semibold text-green-400">No opportunities found</p>
                </div>
              )}
            </div>
          )}

          {/* Image Sandbox */}
          {activeSection === "images" && (
            <div className="space-y-4">
              {psiResults.imageItems?.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Image Optimization Sandbox</h3>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                      {psiResults.imageItems.length} images flagged
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {psiResults.imageItems.map((img: any, i: number) => (
                      <ImageSandboxCard key={i} image={img} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full p-12 flex flex-col items-center justify-center bg-green-950/20 rounded-xl border border-green-500/20 text-center">
                  <p className="text-3xl mb-3">✓</p>
                  <p className="text-lg font-semibold text-green-400">No image optimization issues</p>
                  <p className="text-sm text-muted-foreground mt-1">All images are properly optimized</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isPsiLoading && !psiResults && (
        <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-lg font-semibold text-white">PageSpeed Insights & Image Sandbox</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Full Google PSI audit with Core Web Vitals, performance scores, and an image optimization sandbox to reduce page gravity.
          </p>
        </div>
      )}
    </>
  );
}
