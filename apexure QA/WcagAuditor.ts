import { chromium, Browser, Page } from "playwright";
import { injectAxe, checkA11y, getViolations } from "axe-playwright";

export interface AuditResult {
  url: string;
  violations: AxeViolation[];
  passes: AxePass[];
  timestamp: string;
}

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxePass {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNode[];
}

interface AxeNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

/**
 * Runs a WCAG 2.2 AA accessibility audit on the given URL.
 *
 * @param url - The fully-qualified URL to audit (e.g. "https://example.com")
 * @returns An AuditResult containing violations and passes found by axe-core.
 */
export async function runAudit(url: string): Promise<AuditResult> {
  let browser: Browser | null = null;

  try {
    // Launch a headless Chromium browser
    browser = await chromium.launch({ headless: true });
    const page: Page = await browser.newPage();

    // Navigate to the target URL and wait until network is idle
    await page.goto(url, { waitUntil: "networkidle" });

    // Inject axe-core into the page
    await injectAxe(page);

    // Run the axe audit scoped to WCAG 2.2 AA rules
    const axeResults = await page.evaluate(async () => {
      // @ts-ignore – axe is injected at runtime
      return await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
    });

    return {
      url,
      violations: axeResults.violations as AxeViolation[],
      passes: axeResults.passes as AxePass[],
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Always close the browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}

// ── CLI entry-point ────────────────────────────────────────────────────────────
// Run directly:  npx ts-node WcagAuditor.ts https://example.com
import { fileURLToPath } from 'url';

// Check if this file is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetUrl = process.argv[2] || 'https://example.com';
  console.log(`\n🚀 Starting WCAG 2.2 AA audit on: ${targetUrl}\n`);

  runAudit(targetUrl)
    .then(results => {
      console.log('✅ Audit Complete');
      // You can add logic here to print the results nicely
    })
    .catch(err => console.error('❌ Audit Failed:', err));
}

