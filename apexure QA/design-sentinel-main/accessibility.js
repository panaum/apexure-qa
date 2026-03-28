const { chromium } = require('playwright');

/**
 * Runs a WCAG 2.1 AA accessibility check on the given URL.
 * Uses axe-core for color-contrast and image-alt checks,
 * plus a custom font-size readability check.
 *
 * @param {string} url - The URL to audit
 * @returns {Promise<Object>} AccessibilityResult
 */
async function runAccessibilityCheck(url) {
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Inject axe-core
    await page.addScriptTag({ path: require.resolve('axe-core') });

    // Run axe with only the two rules we care about
    const axeResults = await page.evaluate(() =>
      axe.run({
        runOnly: {
          type: 'rule',
          values: ['color-contrast', 'image-alt'],
        },
      })
    );

    // Custom font-size readability check
    const fontSizeResults = await page.evaluate(() => {
      const issues = [];
      const allElements = document.querySelectorAll('*');

      for (const el of allElements) {
        // Skip elements that are not visible
        const style = window.getComputedStyle(el);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          el.offsetWidth === 0 ||
          el.offsetHeight === 0
        ) {
          continue;
        }

        // Get direct text content (not from children)
        let hasDirectText = false;
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            hasDirectText = true;
            break;
          }
        }

        if (!hasDirectText) continue;

        const fontSize = parseFloat(style.fontSize);
        let status;
        let impact;

        if (fontSize < 12) {
          status = 'fail';
          impact = 'serious';
        } else if (fontSize >= 12 && fontSize < 16) {
          status = 'warn';
          impact = 'moderate';
        } else {
          status = 'pass';
          impact = 'minor';
        }

        // Build a selector-like identifier for the element
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        const identifier = `<${tag}${id}${classes}>`;

        // Get a snippet of the text
        let textSnippet = '';
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            textSnippet = node.textContent.trim().substring(0, 60);
            break;
          }
        }

        issues.push({
          fontSize,
          status,
          impact,
          element: identifier,
          textSnippet,
        });
      }

      return issues;
    });

    // Build the unified issues array
    const issues = [];
    let idCounter = 1;

    // Process axe violations (status = 'fail')
    for (const violation of axeResults.violations) {
      for (const node of violation.nodes) {
        const ruleId = violation.id;
        let type, wcagCriteria;

        if (ruleId === 'color-contrast') {
          type = 'color-contrast';
          wcagCriteria = 'WCAG 2.1 AA 1.4.3 Contrast (Minimum)';
        } else if (ruleId === 'image-alt') {
          type = 'image-alt';
          wcagCriteria = 'WCAG 2.1 AA 1.1.1 Non-text Content';
        } else {
          type = ruleId;
          wcagCriteria = 'WCAG 2.1 AA';
        }

        issues.push({
          id: `a11y-${idCounter++}`,
          type,
          impact: node.impact || violation.impact || 'moderate',
          description: node.failureSummary || violation.description,
          element: node.html ? node.html.substring(0, 120) : (node.target ? node.target.join(', ') : 'Unknown'),
          wcagCriteria,
          status: 'fail',
        });
      }
    }

    // Process axe incomplete (status = 'warn')
    for (const incomplete of axeResults.incomplete) {
      for (const node of incomplete.nodes) {
        const ruleId = incomplete.id;
        let type, wcagCriteria;

        if (ruleId === 'color-contrast') {
          type = 'color-contrast';
          wcagCriteria = 'WCAG 2.1 AA 1.4.3 Contrast (Minimum)';
        } else if (ruleId === 'image-alt') {
          type = 'image-alt';
          wcagCriteria = 'WCAG 2.1 AA 1.1.1 Non-text Content';
        } else {
          type = ruleId;
          wcagCriteria = 'WCAG 2.1 AA';
        }

        issues.push({
          id: `a11y-${idCounter++}`,
          type,
          impact: node.impact || incomplete.impact || 'moderate',
          description: node.failureSummary || incomplete.description,
          element: node.html ? node.html.substring(0, 120) : (node.target ? node.target.join(', ') : 'Unknown'),
          wcagCriteria,
          status: 'warn',
        });
      }
    }

    // Process custom font-size results
    for (const fontResult of fontSizeResults) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'font-size',
        impact: fontResult.impact,
        description: `Font size is ${fontResult.fontSize}px${fontResult.textSnippet ? ` — "${fontResult.textSnippet}"` : ''}`,
        element: fontResult.element,
        wcagCriteria: 'WCAG 2.1 AA 1.4.4 Resize Text',
        status: fontResult.status,
      });
    }

    // Build summary
    const failed = issues.filter((i) => i.status === 'fail').length;
    const warned = issues.filter((i) => i.status === 'warn').length;
    const passed = issues.filter((i) => i.status === 'pass').length;

    return {
      url,
      checkedAt: new Date().toISOString(),
      summary: {
        total: issues.length,
        passed,
        failed,
        warned,
      },
      issues,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { runAccessibilityCheck };
