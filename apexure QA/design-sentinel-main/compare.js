const { chromium } = require('playwright');

function rgbToHex(r, g, b) {
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseCssColor(colorStr) {
  if (!colorStr) return null;
  const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) };
  }
  const hexMatch = colorStr.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }
  return null;
}

function normalizeFontWeight(weight) {
  const map = { normal: '400', bold: '700', lighter: '300', bolder: '700' };
  const w = String(weight).toLowerCase().trim();
  return map[w] || w;
}

function normalizeFigmaFontWeight(style) {
  if (!style) return '400';
  const map = {
    thin: '100', extralight: '200', 'extra light': '200', ultralight: '200',
    light: '300', regular: '400', normal: '400', medium: '500',
    semibold: '600', 'semi bold': '600', demibold: '600', bold: '700',
    extrabold: '800', 'extra bold': '800', ultrabold: '800', black: '900', heavy: '900',
  };
  const s = String(style).toLowerCase().trim();
  return map[s] || '400';
}

function parsePx(value) {
  if (typeof value === 'number') return value;
  if (!value) return null;
  const match = String(value).match(/([\d.]+)\s*px/);
  return match ? parseFloat(match[1]) : null;
}

function normalizeForMatching(str) {
  return str
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function compare(figmaPayload, liveUrl) {
  const textNodes = figmaPayload.nodes.filter((n) => n.type === 'TEXT' && n.content);
  const mismatches = [];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();

    await page.goto(liveUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });

    await page.waitForTimeout(2000);

    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images
          .filter((img) => !img.complete)
          .map((img) => new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          }))
      );
    });

    // ── PARALLELISED COMPARISON ─────────────────────────────────
    const evaluationResults = await Promise.all(
      textNodes.map(async (node) => {
        const rawContent = node.content.trim();
        const content = normalizeForMatching(rawContent);
        if (!content || content.length < 2) return { node, elementData: null, skipped: true };

        const elementData = await page.evaluate((searchText) => {

          const semanticTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL'];

          function findDeepestTextElement(el, targetText) {
            if (semanticTags.includes(el.tagName)) return el;
            for (const tag of semanticTags) {
              const children = el.querySelectorAll(tag.toLowerCase());
              for (const child of children) {
                if ((child.textContent || '').trim().includes(targetText.slice(0, 30))) {
                  return child;
                }
              }
            }
            return el;
          }

          function resolveFontSize(el) {
            const size = window.getComputedStyle(el).fontSize;
            if (size.endsWith('px')) return size;
            const tmp = document.createElement('div');
            tmp.style.cssText = `font-size:${size};position:absolute;visibility:hidden`;
            document.body.appendChild(tmp);
            const resolved = window.getComputedStyle(tmp).fontSize;
            document.body.removeChild(tmp);
            return resolved;
          }

          const allElements = document.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, span, div, li, a, button, label, td, th'
          );

          let bestElement = null;
          let bestScore = 0;

          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.opacity === '0'
            ) continue;

            if (el.children.length > 8) continue;

            const rawText = (el.textContent || '')
              .replace(/\n/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (!rawText || rawText.length < 2) continue;

            let score = 0;

            if (rawText === searchText) {
              score = 100;
            } else if (searchText.length > 60 && rawText.includes(searchText.slice(0, 80))) {
              score = 85;
            } else if (rawText.includes(searchText)) {
              score = 70;
            } else if (searchText.includes(rawText) && rawText.length > 3) {
              score = (rawText.length / searchText.length) * 60;
            }

            if (score > bestScore) {
              bestScore = score;
              bestElement = el;
            }

            if (score === 100) break;
          }

          if (!bestElement || bestScore < 25) return null;

          const actualElement = findDeepestTextElement(bestElement, searchText);
          const elStyle = window.getComputedStyle(actualElement);
          const resolvedFontSize = resolveFontSize(actualElement);

          return {
            fontSize: resolvedFontSize,
            fontFamily: elStyle.fontFamily,
            fontWeight: elStyle.fontWeight,
            color: elStyle.color,
            lineHeight: elStyle.lineHeight,
            textContent: actualElement.textContent.trim(),
            matchScore: bestScore,
          };
        }, content);

        return { node, content, elementData };
      })
    );

    // ── PROCESS RESULTS ─────────────────────────────────────────
    for (const { node, content, elementData, skipped } of evaluationResults) {
      if (skipped) continue;

      if (!elementData) {
        mismatches.push({
          nodeId: node.id,
          nodeName: node.name,
          property: 'element',
          figmaValue: content,
          liveValue: 'NOT FOUND',
          status: 'fail',
        });
        continue;
      }

      // Compare fontSize
      if (node.fontSize !== undefined) {
        const liveFontSize = parsePx(elementData.fontSize);
        const figmaFontSize = node.fontSize;
        if (liveFontSize !== null) {
          mismatches.push({
            nodeId: node.id, nodeName: node.name, property: 'fontSize',
            figmaValue: `${figmaFontSize}px`, liveValue: `${liveFontSize}px`,
            status: liveFontSize !== figmaFontSize ? 'fail' : 'pass',
          });
        }
      }

      // Compare fontFamily
      if (node.fontFamily) {
        const liveFontFamily = elementData.fontFamily
          .split(',')[0].trim().replace(/['"]/g, '');
        const figmaFamily = node.fontFamily.trim();
        mismatches.push({
          nodeId: node.id, nodeName: node.name, property: 'fontFamily',
          figmaValue: figmaFamily, liveValue: liveFontFamily,
          status: liveFontFamily.toLowerCase() === figmaFamily.toLowerCase() ? 'pass' : 'fail',
        });
      }

      // Compare fontWeight
      if (node.fontWeight) {
        const liveWeight = normalizeFontWeight(elementData.fontWeight);
        const figmaWeight = normalizeFigmaFontWeight(node.fontWeight);
        mismatches.push({
          nodeId: node.id, nodeName: node.name, property: 'fontWeight',
          figmaValue: figmaWeight, liveValue: liveWeight,
          status: liveWeight === figmaWeight ? 'pass' : 'fail',
        });
      }

      // Compare color
      if (node.fills && node.fills.length > 0 && node.fills[0].color) {
        const figmaColor = node.fills[0].color;
        const figmaHex = rgbToHex(figmaColor.r, figmaColor.g, figmaColor.b);
        const liveColor = parseCssColor(elementData.color);
        if (liveColor) {
          const liveHex = rgbToHex(liveColor.r, liveColor.g, liveColor.b);
          const dr = Math.abs(figmaColor.r - liveColor.r);
          const dg = Math.abs(figmaColor.g - liveColor.g);
          const db = Math.abs(figmaColor.b - liveColor.b);
          let status = 'pass';
          if (dr > 2 || dg > 2 || db > 2) status = 'fail';
          else if (dr > 0 || dg > 0 || db > 0) status = 'warn';
          mismatches.push({
            nodeId: node.id, nodeName: node.name, property: 'color',
            figmaValue: figmaHex, liveValue: liveHex, status,
          });
        }
      }

      // Compare lineHeight
      if (node.lineHeight !== undefined && node.lineHeight !== null) {
        const liveLineHeight = parsePx(elementData.lineHeight);
        const figmaLineHeight = node.lineHeight;
        if (liveLineHeight !== null) {
          const diff = Math.abs(liveLineHeight - figmaLineHeight);
          let status = 'pass';
          if (diff > 1) status = 'fail';
          else if (diff > 0) status = 'warn';
          mismatches.push({
            nodeId: node.id, nodeName: node.name, property: 'lineHeight',
            figmaValue: `${figmaLineHeight}px`, liveValue: `${liveLineHeight}px`, status,
          });
        }
      }
    }

  } finally {
    if (browser) await browser.close();
  }

  const passed = mismatches.filter((m) => m.status === 'pass').length;
  const failed = mismatches.filter((m) => m.status === 'fail').length;
  const warned = mismatches.filter((m) => m.status === 'warn').length;

  return {
    pageName: figmaPayload.pageName || 'Unknown',
    url: liveUrl,
    checkedAt: new Date().toISOString(),
    total: mismatches.length,
    passed,
    failed,
    warned,
    mismatches,
  };
}

module.exports = { compare };