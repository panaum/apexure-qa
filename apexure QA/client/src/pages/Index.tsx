import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { ScanInputs } from "@/components/dashboard/ScanInputs";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { toast } from "sonner";

type ActiveTab = "compare" | "spellcheck";

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("compare");

  // --- Compare state ---
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaToken, setFigmaToken] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [sections, setSections] = useState<any[]>([]);

  // --- Spell check state ---
  const [spellUrl, setSpellUrl] = useState("");
  const [isSpellChecking, setIsSpellChecking] = useState(false);
  const [spellResults, setSpellResults] = useState<any>(null);

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
    const loadingToast = toast.loading("Checking spelling and grammar...");
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

  const totalDiffs = sections.reduce(
    (acc, s) => acc + s.items.filter((i: any) => i.contentStatus === "diff").length,
    0
  );

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-950 text-white font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-[120px] top-[-100px] left-[-100px]" />
      </div>

      <DashboardHeader
        issueCount={hasScanned ? totalDiffs : 0}
        onRunScan={handleRunScan}
      />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 space-y-8 relative z-10">
        <HeroSection onRunScan={handleRunScan} />

        {/* --- Tabs --- */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "compare"
                ? "bg-primary text-white shadow"
                : "text-muted-foreground hover:text-white"
              }`}
          >
            Figma vs Web
          </button>
          <button
            onClick={() => setActiveTab("spellcheck")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "spellcheck"
                ? "bg-primary text-white shadow"
                : "text-muted-foreground hover:text-white"
              }`}
          >
            Spell Check
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
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                      {totalDiffs} content differences
                    </span>
                    <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 uppercase tracking-tighter">
                      Live from Figma & Web
                    </span>
                  </div>
                </div>

                {sections.map((section) => (
                  <div key={section.sectionIndex} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="px-5 py-3 bg-white/10 flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Section {section.sectionIndex}
                      </span>
                      <span className="text-sm font-semibold text-white">{section.sectionName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {section.items.filter((i: any) => i.contentStatus === "diff").length} diff
                        {" · "}
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

        {/* ===== SPELL CHECK TAB ===== */}
        {activeTab === "spellcheck" && (
          <>
            {/* Input */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Website URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="https://yoursite.com"
                    value={spellUrl}
                    onChange={(e) => setSpellUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunSpellCheck()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleRunSpellCheck}
                    disabled={isSpellChecking}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all"
                  >
                    {isSpellChecking ? "Checking..." : "Check"}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {isSpellChecking && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 animate-pulse">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold">Checking spelling and grammar...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment for longer pages</p>
              </div>
            )}

            {/* Results */}
            {!isSpellChecking && spellResults && (
              <div className="space-y-6">

                {/* Summary bar */}
                <div className="flex flex-wrap gap-3 items-center">
                  <h2 className="font-display text-2xl font-bold text-blue-400">Spell Check Results</h2>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded border ${spellResults.totalIssues === 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {spellResults.totalIssues} total issues
                    </span>
                    {spellResults.spelling > 0 && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">
                        {spellResults.spelling} spelling
                      </span>
                    )}
                    {spellResults.grammar > 0 && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                        {spellResults.grammar} grammar
                      </span>
                    )}
                    {spellResults.style > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                        {spellResults.style} style
                      </span>
                    )}
                  </div>
                </div>

                {spellResults.totalIssues === 0 ? (
                  <div className="w-full p-12 flex flex-col items-center justify-center bg-green-950/20 rounded-xl border border-green-500/20 text-center">
                    <p className="text-2xl mb-2">✓</p>
                    <p className="text-lg font-semibold text-green-400">No issues found</p>
                    <p className="text-sm text-muted-foreground mt-1">The page passed spelling and grammar checks</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-32">Type</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Word / Issue</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Message</th>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-48">Suggestions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spellResults.issues.map((issue: any, idx: number) => {
                          const isSpelling = issue.category === "Possible Typo" || issue.type === "misspelling";
                          const isGrammar = issue.type === "grammar";
                          const badgeColor = isSpelling
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : isGrammar
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30";
                          const rowBg = isSpelling
                            ? "bg-orange-950/10 hover:bg-orange-950/20"
                            : isGrammar
                              ? "bg-yellow-950/10 hover:bg-yellow-950/20"
                              : "bg-blue-950/10 hover:bg-blue-950/20";

                          return (
                            <tr key={idx} className={`border-t border-white/5 ${rowBg}`}>
                              <td className="px-4 py-3 align-top">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
                                  {issue.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="text-sm font-mono text-white">{issue.word}</p>
                                {issue.context && (
                                  <p className="text-[10px] text-muted-foreground mt-1 max-w-xs truncate">
                                    {issue.context}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <p className="text-sm text-muted-foreground">{issue.shortMessage || issue.message}</p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                {issue.replacements.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {issue.replacements.map((r: string, i: number) => (
                                      <span key={i} className="text-xs bg-white/10 text-green-300 px-2 py-0.5 rounded font-mono">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No suggestions</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {!isSpellChecking && !spellResults && (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-lg font-semibold text-muted-foreground">Enter a URL to check spelling and grammar</p>
                <p className="text-sm text-muted-foreground mt-1">Powered by LanguageTool — checks spelling, grammar, and style</p>
              </div>
            )}
          </>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};

export default Index;