import { chromium } from 'playwright';

// This script expects a JSON array of mappings via stdin or arg
export async function scrapeStyles(url: string, mappings: { selector: string, figmaId: string }[]) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const results = await page.evaluate((targets) => {
        return targets.map(t => {
            const el = document.querySelector(t.selector);
            if (!el) return { ...t, error: 'Not found on page' };

            const s = getComputedStyle(el);
            return {
                ...t,
                styles: {
                    'font-family': s.fontFamily,
                    'font-size': s.fontSize,
                    'font-weight': s.fontWeight,
                    'line-height': s.lineHeight,
                    'color': s.color
                }
            };
        });
    }, mappings);

    await browser.close();
    return results;
}