import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { ScanInputs } from "@/components/dashboard/ScanInputs";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { PageSpeedTab } from "@/components/dashboard/PageSpeedTab";
import QAPanel from "@/components/QAPanel";
import { toast } from "sonner";
type ActiveTab = "compare" | "screenshotdiff" | "spellcheck" | "seo" | "techstack" | "pagespeed" | "designsentinel";
const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("compare");

  // --- Compare state ---
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

  // --- SEO state ---
  const [seoUrl, setSeoUrl] = useState("");
  const [isSeoChecking, setIsSeoChecking] = useState(false);
  const [seoResults, setSeoResults] = useState<any>(null);
  const [seoTab, setSeoTab] = useState<"summary" | "images" | "social">("summary");

  // --- Tech Stack state ---
  const [techUrl, setTechUrl] = useState("");
  const [isTechChecking, setIsTechChecking] = useState(false);
  const [techResults, setTechResults] = useState<any>(null);

  // --- Spell check state ---
  const [spellUrl, setSpellUrl] = useState("");
  const [isSpellChecking, setIsSpellChecking] = useState(false);
  const [spellResults, setSpellResults] = useState<any>(null);
  const [spellFilter, setSpellFilter] = useState<"all" | "spelling">("all");

  // --- Screenshot diff state ---
  const [isScreenshotDiffing, setIsScreenshotDiffing] = useState(false);
  const [screenshotDiffResults, setScreenshotDiffResults] = useState<any>(null);
  const [diffViewMode, setDiffViewMode] = useState<"sidebyside" | "overlay" | "diffonly">("sidebyside");

  // --- PageSpeed state ---
  const [psiUrl, setPsiUrl] = useState("");
  const [isPsiLoading, setIsPsiLoading] = useState(false);
  const [psiResults, setPsiResults] = useState<any>(null);

  const handleRunScan = async () => {
    if (!figmaUrl || !figmaToken || !webUrl) {
      toast.error("Missing Info", { description: "Please fill in all fields first." });
      return;
    }
    setIsScanning(true);
    setHasScanned(false);
    const loadingToast = toast.loading("Analyzing content and styles...");
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl, figmaToken, liveUrl: webUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Scan failed.");
      }
      const results = await response.json();
      setSections(results.result?.sections ?? []);
      setHasScanned(true);
      toast.dismiss(loadingToast);
      toast.success("Scan complete!");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Scan Failed", { description: error.message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunSpellCheck = async () => {
    if (!spellUrl) {
      toast.error("Missing URL", { description: "Please enter a URL to spell check." });
      return;
    }
    setIsSpellChecking(true);
    setSpellResults(null);
    setSpellFilter("all");
    const loadingToast = toast.loading("Checking spelling...");
    try {
      const response = await fetch("/api/spell-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: spellUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Spell check failed.");
      }
      const results = await response.json();
      setSpellResults(results);
      toast.dismiss(loadingToast);
      toast.success(`Found ${results.totalIssues} issue${results.totalIssues !== 1 ? "s" : ""}`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Spell Check Failed", { description: error.message });
    } finally {
      setIsSpellChecking(false);
    }
  };

  const handleRunTechStack = async () => {
    if (!techUrl) {
      toast.error("Missing URL", { description: "Please enter a URL to scan." });
      return;
    }
    setIsTechChecking(true);
    setTechResults(null);
    const loadingToast = toast.loading("Detecting technologies...");
    try {
      const response = await fetch("/api/tech-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: techUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Tech stack detection failed.");
      }
      const results = await response.json();
      setTechResults(results);
      toast.dismiss(loadingToast);
      toast.success(`Detected ${results.total} technologies`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Detection Failed", { description: error.message });
    } finally {
      setIsTechChecking(false);
    }
  };

  const handleRunScreenshotDiff = async () => {
    if (!figmaUrl || !figmaToken || !webUrl) {
      toast.error("Missing Info", { description: "Please fill in Figma URL, token, and live URL first." });
      return;
    }
    setIsScreenshotDiffing(true);
    setScreenshotDiffResults(null);
    setDiffViewMode("sidebyside");
    const loadingToast = toast.loading("Capturing screenshots and diffing...");
    try {
      const response = await fetch("/api/screenshot-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ figmaUrl, figmaToken, liveUrl: webUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Screenshot diff failed.");
      }
      const results = await response.json();
      setScreenshotDiffResults(results);
      toast.dismiss(loadingToast);
      toast.success(`Diff complete — ${results.mismatchPercentage}% mismatch`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Screenshot Diff Failed", { description: error.message });
    } finally {
      setIsScreenshotDiffing(false);
    }
  };

  const handleRunSeoAudit = async () => {
    if (!seoUrl) {
      toast.error("Missing URL", { description: "Please enter a URL to audit." });
      return;
    }
    setIsSeoChecking(true);
    setSeoResults(null);
    const loadingToast = toast.loading("Auditing SEO meta tags...");
    try {
      const response = await fetch("/api/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: seoUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "SEO audit failed.");
      }
      const results = await response.json();
      setSeoResults(results);
      toast.dismiss(loadingToast);
      toast.success(`SEO Score: ${results.score}/100`);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("SEO Audit Failed", { description: error.message });
    } finally {
      setIsSeoChecking(false);
    }
  };

  const totalDiffs = sections.reduce(
    (acc, s) => acc + s.items.filter((i: any) => i.contentStatus === "diff").length,
    0
  );

  const filteredIssues = spellResults?.issues?.filter((issue: any) => {
    if (spellFilter === "all") return true;
    return issue.type === spellFilter;
  }) ?? [];

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950 text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-[120px] top-[-100px] left-[-100px]" />
      </div>

      <DashboardHeader issueCount={hasScanned ? totalDiffs : 0} onRunScan={handleRunScan} />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 space-y-8 relative z-10">
        <HeroSection onRunScan={handleRunScan} />

        {/* --- Tabs --- */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "compare" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            Figma vs Web
          </button>
          <button
            onClick={() => setActiveTab("screenshotdiff")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "screenshotdiff" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            Screenshot Diff
          </button>
          <button
            onClick={() => setActiveTab("spellcheck")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "spellcheck" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            Spell Check
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "seo" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            SEO Audit
          </button>
          <button
            onClick={() => setActiveTab("techstack")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "techstack" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            Tech Stack
          </button>
          <button
            onClick={() => setActiveTab("pagespeed")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pagespeed" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            PageSpeed
          </button>
          <button
            onClick={() => setActiveTab("designsentinel")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "designsentinel" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-white"}`}
          >
            🛡️ Design Sentinel
          </button>
        </div>

        {/* ===== COMPARE TAB ===== */}
        {activeTab === "compare" && (
          <>
            <ScanInputs
              figmaUrl={figmaUrl}
              figmaToken={figmaToken}
              webUrl={webUrl}
              onFigmaUrlChange={setFigmaUrl}
              onFigmaTokenChange={setFigmaToken}
              onWebUrlChange={setWebUrl}
            />
            {isScanning && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Sentinel is scanning content...</p>
                <p className="text-sm text-muted-foreground mt-2">Comparing Figma text vs Live website section by section</p>
              </div>
            )}
            {!isScanning && hasScanned && sections.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-blue-400">Audit Results</h2>
                  <div className="flex gap-3 items-center">
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">{totalDiffs} content differences</span>
                    <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 uppercase tracking-tighter">Live from Figma & Web</span>
                  </div>
                </div>
                {sections.map((section) => (
                  <div key={section.sectionIndex} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-5 py-3 bg-white/10 flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Section {section.sectionIndex}</span>
                      <span className="text-sm font-semibold text-white">{section.sectionName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {section.items.filter((i: any) => i.contentStatus === "diff").length} diff{" · "}
                        {section.items.filter((i: any) => i.contentStatus === "match").length} match
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/2">Figma Content</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/2">Web Content</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item: any, idx: number) => {
                            const isMatch = item.contentStatus === "match";
                            return (
                              <tr key={idx} className={`border-t border-white/5 ${isMatch ? "bg-green-950/20 hover:bg-green-950/30" : "bg-red-950/20 hover:bg-red-950/30"}`}>
                                <td className="px-4 py-3 align-top">
                                  <p className={`text-sm ${isMatch ? "text-green-300" : "text-red-300"}`}>
                                    {item.figmaText || <span className="italic text-muted-foreground">—</span>}
                                  </p>
                                  {item.figmaStyle && (
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {item.figmaStyle.fontFamily} · {item.figmaStyle.fontSize} · {item.figmaStyle.color}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {item.webText ? (
                                    <>
                                      <p className={`text-sm ${isMatch ? "text-green-300" : "text-red-300"}`}>{item.webText}</p>
                                      {item.webStyle && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                          {item.webStyle.fontFamily} · {item.webStyle.fontSize} · {item.webStyle.color}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <span className="italic text-red-400 text-sm">Not found on web</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {isMatch ? (
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">Match</span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Diff</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isScanning && !hasScanned && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-lg font-semibold text-muted-foreground">Run a scan to see section-by-section content comparison</p>
                <p className="text-sm text-muted-foreground mt-1">Figma text vs live web text, side by side</p>
              </div>
            )}
          </>
        )}

        {/* ===== SCREENSHOT DIFF TAB ===== */}
        {activeTab === "screenshotdiff" && (
          <>
            <ScanInputs
              figmaUrl={figmaUrl}
              figmaToken={figmaToken}
              webUrl={webUrl}
              onFigmaUrlChange={setFigmaUrl}
              onFigmaTokenChange={setFigmaToken}
              onWebUrlChange={setWebUrl}
            />
            <div className="flex items-center gap-3">
              <button onClick={handleRunScreenshotDiff} disabled={isScreenshotDiffing}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all">
                {isScreenshotDiffing ? "Diffing..." : "Run Screenshot Diff"}
              </button>
              <p className="text-xs text-muted-foreground">Pixel-level comparison of Figma design vs live page at 1440×900</p>
            </div>
            {isScreenshotDiffing && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Capturing & comparing screenshots...</p>
                <p className="text-sm text-muted-foreground mt-2">Exporting Figma frame, screenshotting live page, running pixel diff</p>
              </div>
            )}
            {!isScreenshotDiffing && screenshotDiffResults && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-blue-400">Screenshot Diff Results</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Pixel-level comparison at {screenshotDiffResults.viewport}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-lg font-bold px-3 py-1 rounded border ${screenshotDiffResults.mismatchPercentage < 5
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : screenshotDiffResults.mismatchPercentage <= 15
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>
                      {screenshotDiffResults.mismatchPercentage}% mismatch
                    </span>
                  </div>
                </div>

                {/* View mode toggle */}
                <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg w-fit text-xs">
                  {(["sidebyside", "overlay", "diffonly"] as const).map(mode => (
                    <button key={mode} onClick={() => setDiffViewMode(mode)}
                      className={`px-3 py-1.5 rounded font-semibold transition-all ${diffViewMode === mode ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}>
                      {mode === "sidebyside" ? "Side by Side" : mode === "overlay" ? "Overlay" : "Diff Only"}
                    </button>
                  ))}
                </div>

                {/* Image panels */}
                {diffViewMode === "sidebyside" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {(["figmaImage", "liveImage", "diffImage"] as const).map((key) => (
                      <div key={key} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-4 py-2.5 bg-white/10">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {key === "figmaImage" ? "Figma Design" : key === "liveImage" ? "Live Page" : "Diff"}
                          </span>
                        </div>
                        <div className="p-3">
                          <img src={screenshotDiffResults[key]} alt={key}
                            className="w-full rounded border border-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {diffViewMode === "overlay" && (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-4 py-2.5 bg-white/10">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Overlay (Figma + Live)</span>
                    </div>
                    <div className="p-3 relative">
                      <img src={screenshotDiffResults.figmaImage} alt="Figma" className="w-full rounded border border-white/10" />
                      <img src={screenshotDiffResults.liveImage} alt="Live"
                        className="w-full rounded border border-white/10 absolute inset-3" style={{ opacity: 0.5, mixBlendMode: 'difference' }} />
                    </div>
                  </div>
                )}

                {diffViewMode === "diffonly" && (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-4 py-2.5 bg-white/10">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Diff Only — mismatches highlighted in red</span>
                    </div>
                    <div className="p-3">
                      <img src={screenshotDiffResults.diffImage} alt="Diff" className="w-full rounded border border-white/10" />
                    </div>
                  </div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className={`text-3xl font-bold ${screenshotDiffResults.mismatchPercentage < 5 ? "text-green-400"
                        : screenshotDiffResults.mismatchPercentage <= 15 ? "text-yellow-400"
                          : "text-red-400"
                      }`}>{screenshotDiffResults.mismatchPercentage}%</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Mismatch</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className="text-3xl font-bold text-white">{screenshotDiffResults.mismatchPixels.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Mismatched Pixels</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className="text-3xl font-bold text-white">{screenshotDiffResults.viewport}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Viewport Size</div>
                  </div>
                </div>
              </div>
            )}
            {!isScreenshotDiffing && !screenshotDiffResults && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-4xl mb-4">📸</div>
                <p className="text-lg font-semibold text-white">Visual Screenshot Diff</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Exports your Figma frame as an image, screenshots the live page, and highlights every pixel difference in red.</p>
              </div>
            )}
          </>
        )}

        {/* ===== SPELL CHECK TAB ===== */}
        {activeTab === "spellcheck" && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Website URL</label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold uppercase tracking-wide">✦ Powered by TextGears</span>
              </div>
              <div className="flex gap-3">
                <input type="text" placeholder="https://yoursite.com" value={spellUrl}
                  onChange={(e) => setSpellUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunSpellCheck()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button onClick={handleRunSpellCheck} disabled={isSpellChecking}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all">
                  {isSpellChecking ? "Analyzing..." : "Check"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Spelling check that understands marketing terms, brand names, and industry jargon — no false positives.</p>
            </div>
            {isSpellChecking && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Checking your page for spelling errors...</p>
                <p className="text-sm text-muted-foreground mt-2">TextGears is scanning for genuine misspellings only</p>
              </div>
            )}
            {!isSpellChecking && spellResults && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-purple-400">Spell Check Results</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Analyzed by TextGears — accurate spelling detection, no false positives</p>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded border ${spellResults.totalIssues === 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {spellResults.totalIssues} total issues
                    </span>
                    {spellResults.spelling > 0 && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">{spellResults.spelling} spelling errors</span>
                    )}
                  </div>
                </div>
                {spellResults.totalIssues === 0 ? (
                  <div className="w-full p-12 flex flex-col items-center justify-center bg-green-950/20 rounded-xl border border-green-500/20 text-center">
                    <p className="text-3xl mb-3">✓</p>
                    <p className="text-lg font-semibold text-green-400">No issues found</p>
                    <p className="text-sm text-muted-foreground mt-1">No spelling errors found on this page</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg w-fit text-xs">
                      {(["all", "spelling"] as const).map(f => (
                        <button key={f} onClick={() => setSpellFilter(f)}
                          className={`px-3 py-1.5 rounded font-semibold capitalize transition-all ${spellFilter === f ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}>
                          {f === "all" ? `All (${spellResults.totalIssues})` : `Spelling (${spellResults.spelling})`}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-28">Type</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Word / Issue</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Explanation</th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-44">Suggestions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIssues.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm italic">No {spellFilter} issues found</td></tr>
                          ) : (
                            filteredIssues.map((issue: any, idx: number) => {
                              const isSpelling = issue.type === "spelling";
                              const badgeColor = isSpelling ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30";
                              const rowBg = isSpelling ? "bg-orange-950/10 hover:bg-orange-950/20" : "bg-blue-950/10 hover:bg-blue-950/20";
                              return (
                                <tr key={idx} className={`border-t border-white/5 ${rowBg}`}>
                                  <td className="px-4 py-3 align-top">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>{issue.type}</span>
                                  </td>
                                  <td className="px-4 py-3 align-top">
                                    <p className="text-sm font-mono text-white font-semibold">{issue.word}</p>
                                    {issue.context && <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">"{issue.context}"</p>}
                                  </td>
                                  <td className="px-4 py-3 align-top"><p className="text-sm text-muted-foreground">{issue.message}</p></td>
                                  <td className="px-4 py-3 align-top">
                                    {issue.replacements && issue.replacements.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {issue.replacements.map((r: string, i: number) => (
                                          <span key={i} className="text-xs bg-white/10 text-green-300 px-2 py-0.5 rounded font-mono">{r}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">No suggestions</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
            {!isSpellChecking && !spellResults && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-4xl mb-4">✦</div>
                <p className="text-lg font-semibold text-white">Spell Check</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">TextGears accurately detects genuine spelling mistakes without flagging brand names, marketing terms, or industry jargon.</p>
              </div>
            )}
          </>
        )}

        {/* ===== SEO AUDIT TAB ===== */}
        {activeTab === "seo" && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Website URL</label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold uppercase tracking-wide">✦ No API Key Required</span>
              </div>
              <div className="flex gap-3">
                <input type="text" placeholder="https://yoursite.com" value={seoUrl}
                  onChange={(e) => setSeoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunSeoAudit()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button onClick={handleRunSeoAudit} disabled={isSeoChecking}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all">
                  {isSeoChecking ? "Auditing..." : "Audit"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Checks meta tags, headings, images, Open Graph, Twitter cards and more.</p>
            </div>
            {isSeoChecking && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Auditing SEO meta tags...</p>
                <p className="text-sm text-muted-foreground mt-2">Scanning title, description, headings, images and social tags</p>
              </div>
            )}
            {!isSeoChecking && seoResults && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-green-400">SEO Audit Results</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{seoResults.url}</p>
                  </div>
                  <div className="ml-auto flex gap-3 items-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${seoResults.score >= 80 ? "text-green-400" : seoResults.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>{seoResults.score}</div>
                      <div className="text-xs text-muted-foreground">SEO Score</div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">{seoResults.errors} errors</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">{seoResults.warnings} warnings</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">{seoResults.passes} passed</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg w-fit text-xs">
                  {(["summary", "images", "social"] as const).map(t => (
                    <button key={t} onClick={() => setSeoTab(t)}
                      className={`px-3 py-1.5 rounded font-semibold capitalize transition-all ${seoTab === t ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}>
                      {t === "summary" ? "Summary" : t === "images" ? `Images (${seoResults.images.total})` : "Social"}
                    </button>
                  ))}
                </div>
                {seoTab === "summary" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="px-5 py-3 bg-white/10"><span className="text-sm font-semibold text-white">Meta Information</span></div>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            { label: "Title", value: seoResults.title, extra: seoResults.title ? `${seoResults.title.length} characters` : null },
                            { label: "Description", value: seoResults.description, extra: seoResults.description ? `${seoResults.description.length} characters` : null },
                            { label: "Keywords", value: seoResults.keywords || "Keywords are missing!" },
                            { label: "URL", value: seoResults.url },
                            { label: "Canonical", value: seoResults.canonical || "Canonical URL is not defined." },
                            { label: "Robots Tag", value: seoResults.robots || "Robots meta tag is not defined." },
                            { label: "Author", value: seoResults.author || "Author is missing." },
                            { label: "Publisher", value: seoResults.publisher || "Publisher is missing." },
                            { label: "Lang", value: seoResults.lang || "Not defined." },
                            { label: "Viewport", value: seoResults.viewport || "Missing!" },
                            { label: "Charset", value: seoResults.charset || "Not defined." },
                          ].map((row, i) => (
                            <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                              <td className="px-4 py-3 w-32">
                                <span className="text-xs font-bold text-white">{row.label}</span>
                                {row.extra && <p className={`text-[10px] mt-0.5 ${parseInt(row.extra) < 30 || parseInt(row.extra) > 160 ? 'text-yellow-400' : 'text-green-400'}`}>{row.extra}</p>}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white mb-3">Heading Structure</p>
                      <div className="flex gap-6">
                        {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map(h => (
                          <div key={h} className="text-center">
                            <div className={`text-xl font-bold ${h === 'h1' && seoResults.headings[h] !== 1 ? 'text-red-400' : seoResults.headings[h] > 0 ? 'text-white' : 'text-muted-foreground'}`}>{seoResults.headings[h]}</div>
                            <div className="text-xs text-muted-foreground uppercase">{h}</div>
                          </div>
                        ))}
                        <div className="text-center ml-8">
                          <div className="text-xl font-bold text-white">{seoResults.images.total}</div>
                          <div className="text-xs text-muted-foreground uppercase">Images</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{seoResults.links.total}</div>
                          <div className="text-xs text-muted-foreground uppercase">Links</div>
                        </div>
                      </div>
                      {seoResults.headings.h1Text && <p className="text-xs text-muted-foreground mt-3">H1: "{seoResults.headings.h1Text}"</p>}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="px-5 py-3 bg-white/10"><span className="text-sm font-semibold text-white">All Checks</span></div>
                      <table className="w-full text-sm">
                        <tbody>
                          {seoResults.issues.map((issue: any, i: number) => (
                            <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                              <td className="px-4 py-2.5 w-24">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${issue.type === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : issue.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                  {issue.type === 'pass' ? '✓ pass' : issue.type}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 w-28 text-xs font-bold text-white">{issue.field}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {seoTab === "images" && (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-5 py-3 bg-white/10 flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">Images</span>
                      {seoResults.images.withoutAlt > 0 && <span className="ml-auto text-xs text-yellow-400">{seoResults.images.withoutAlt} missing alt text</span>}
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Alt Text</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">Size</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seoResults.images.items.map((img: any, i: number) => (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                            <td className="px-4 py-2.5">
                              <p className="text-xs text-white truncate max-w-md">{img.alt || <span className="italic text-red-400">No alt text</span>}</p>
                              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{img.src}</p>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{img.width && img.height ? `${img.width}×${img.height}` : 'Unknown'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${img.hasAlt ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {img.hasAlt ? '✓ alt' : '✗ no alt'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {seoTab === "social" && (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-5 py-3 bg-white/10"><span className="text-sm font-semibold text-white">Social Share Image</span></div>
                    <div className="p-6">
                      {(seoResults.og.image || seoResults.twitter.image) ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">✓ Present</span>
                            <span className="text-xs text-muted-foreground">Social share image found</span>
                          </div>
                          <img src={seoResults.og.image || seoResults.twitter.image} alt="Social share preview"
                            className="rounded-lg border border-white/10 max-w-lg w-full object-cover" style={{ maxHeight: '300px' }} />
                          <p className="text-xs text-muted-foreground break-all">{seoResults.og.image || seoResults.twitter.image}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="text-3xl mb-3">🖼️</div>
                          <p className="text-sm font-semibold text-red-400">No social share image found</p>
                          <p className="text-xs text-muted-foreground mt-1">Add an og:image or twitter:image meta tag so your page looks great when shared on social media</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!isSeoChecking && !seoResults && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-semibold text-white">SEO Meta Audit</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Checks title, description, canonical, robots, headings, images and social tags — no API key needed.</p>
              </div>
            )}
          </>
        )}

        {/* ===== TECH STACK TAB ===== */}
        {activeTab === "techstack" && (
          <>
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">Website URL</label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold uppercase tracking-wide">✦ Wappalyzer-style Detection</span>
              </div>
              <div className="flex gap-3">
                <input type="text" placeholder="https://yoursite.com" value={techUrl}
                  onChange={(e) => setTechUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunTechStack()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button onClick={handleRunTechStack} disabled={isTechChecking}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all">
                  {isTechChecking ? "Detecting..." : "Detect"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Detects CMS, frameworks, analytics, advertising pixels, chat tools, fonts, hosting and more.</p>
            </div>
            {isTechChecking && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Scanning tech stack...</p>
                <p className="text-sm text-muted-foreground mt-2">Detecting frameworks, analytics, pixels and more</p>
              </div>
            )}
            {!isTechChecking && techResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-blue-400">Tech Stack</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{techResults.url}</p>
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">{techResults.total} technologies detected</span>
                </div>
                {techResults.total === 0 ? (
                  <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                    <p className="text-lg font-semibold text-muted-foreground">No technologies detected</p>
                    <p className="text-sm text-muted-foreground mt-1">The page may be using custom or obfuscated code</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(techResults.grouped).map(([category, techs]: [string, any]) => (
                      <div key={category} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-5 py-3 bg-white/10">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{category}</span>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                          {techs.map((tech: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                              <span style={{ fontSize: '16px' }}>{tech.icon}</span>
                              <span className="text-sm font-semibold text-white">{tech.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!isTechChecking && !techResults && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-4xl mb-4">🔬</div>
                <p className="text-lg font-semibold text-white">Tech Stack Detector</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">Detect CMS, JS frameworks, analytics tools, advertising pixels, live chat, fonts, hosting and more — just like Wappalyzer, no API key needed.</p>
              </div>
            )}
          </>
        )}

        {/* ===== PAGESPEED TAB ===== */}
        {activeTab === "pagespeed" && (
          <PageSpeedTab
            psiUrl={psiUrl}
            setPsiUrl={setPsiUrl}
            psiResults={psiResults}
            setPsiResults={setPsiResults}
            isPsiLoading={isPsiLoading}
            setIsPsiLoading={setIsPsiLoading}
          />
        )}

        {/* ===== DESIGN SENTINEL TAB ===== */}
        {activeTab === "designsentinel" && (
          <QAPanel />
        )}

      </main>

      <DashboardFooter />
    </div>
  );
};

export default Index;