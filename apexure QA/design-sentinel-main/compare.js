const { chromium } = require('playwright');

/**
 * Convert Figma fill color {r, g, b} (already 0-255 ints from plugin) to hex string.
 */
function rgbToHex(r, g, b) {
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parse a CSS color string (rgb, rgba, or hex) to {r, g, b}.
 */
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

/**
 * Parse a CSS font-weight string to a numeric/string value for comparison.
 */
function normalizeFontWeight(weight) {
  const map = {
    normal: '400',
    bold: '700',
    lighter: '300',
    bolder: '700',
  };
  const w = String(weight).toLowerCase().trim();
  return map[w] || w;
}

/**
 * Normalize Figma fontWeight (style string like "Bold", "Regular", etc.) to numeric.
 */
function normalizeFigmaFontWeight(style) {
  if (!style) return '400';
  const map = {
    thin: '100',
    extralight: '200',
    'extra light': '200',
    ultralight: '200',
    light: '300',
    regular: '400',
    normal: '400',
    medium: '500',
    semibold: '600',
    'semi bold': '600',
    demibold: '600',
    bold: '700',
    extrabold: '800',
    'extra bold': '800',
    ultrabold: '800',
    black: '900',
    heavy: '900',
  };
  const s = String(style).toLowerCase().trim();
  return map[s] || '400';
}

/**
 * Parse a CSS pixel value to a number.
 */
function parsePx(value) {
  if (typeof value === 'number') return value;
  if (!value) return null;
  const match = String(value).match(/([\d.]+)\s*px/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Compare Figma data against a live URL.
 * @param {object} figmaPayload - FigmaPayload with nodes array
 * @param {string} liveUrl - The live URL to scrape
 * @returns {object} CompareResult
 */
async function compare(figmaPayload, liveUrl) {
  const textNodes = figmaPayload.nodes.filter((n) => n.type === 'TEXT' && n.content);
  const mismatches = [];

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(liveUrl, { waitUntil: 'networkidle', timeout: 30000 });

    for (const node of textNodes) {
      const content = node.content.trim();
      if (!content) continue;

      // Find best matching DOM element by text content
      const elementData = await page.evaluate((searchText) => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );

        let bestElement = null;
        let bestScore = 0;

        while (walker.nextNode()) {
          const textNode = walker.currentNode;
          const parent = textNode.parentElement;
          if (!parent) continue;

          const text = textNode.textContent.trim();
          if (!text) continue;

          // Exact match gets highest score
          if (text === searchText) {
            bestElement = parent;
            bestScore = 100;
            break;
          }

          // Contains match
          if (text.includes(searchText) || searchText.includes(text)) {
            const score = Math.min(text.length, searchText.length) / Math.max(text.length, searchText.length) * 80;
            if (score > bestScore) {
              bestScore = score;
              bestElement = parent;
            }
          }
        }

        if (!bestElement || bestScore < 30) return null;

        const style = window.getComputedStyle(bestElement);
        return {
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          color: style.color,
          lineHeight: style.lineHeight,
          textContent: bestElement.textContent.trim(),
        };
      }, content);

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
        if (liveFontSize !== null && liveFontSize !== figmaFontSize) {
          mismatches.push({
            nodeId: node.id,
            nodeName: node.name,
            property: 'fontSize',
            figmaValue: `${figmaFontSize}px`,
            liveValue: `${liveFontSize}px`,
            status: 'fail',
          });
        } else if (liveFontSize !== null) {
          mismatches.push({
            nodeId: node.id,
            nodeName: node.name,
            property: 'fontSize',
            figmaValue: `${figmaFontSize}px`,
            liveValue: `${liveFontSize}px`,
            status: 'pass',
          });
        }
      }

      // Compare fontFamily
      if (node.fontFamily) {
        const liveFontFamily = elementData.fontFamily
          .split(',')[0]
          .trim()
          .replace(/['"]/g, '');
        const figmaFamily = node.fontFamily.trim();
        const match = liveFontFamily.toLowerCase() === figmaFamily.toLowerCase();
        mismatches.push({
          nodeId: node.id,
          nodeName: node.name,
          property: 'fontFamily',
          figmaValue: figmaFamily,
          liveValue: liveFontFamily,
          status: match ? 'pass' : 'fail',
        });
      }

      // Compare fontWeight
      if (node.fontWeight) {
        const liveWeight = normalizeFontWeight(elementData.fontWeight);
        const figmaWeight = normalizeFigmaFontWeight(node.fontWeight);
        mismatches.push({
          nodeId: node.id,
          nodeName: node.name,
          property: 'fontWeight',
          figmaValue: figmaWeight,
          liveValue: liveWeight,
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
          if (dr > 2 || dg > 2 || db > 2) {
            status = 'fail';
          } else if (dr > 0 || dg > 0 || db > 0) {
            status = 'warn';
          }

          mismatches.push({
            nodeId: node.id,
            nodeName: node.name,
            property: 'color',
            figmaValue: figmaHex,
            liveValue: liveHex,
            status,
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
          if (diff > 1) {
            status = 'fail';
          } else if (diff > 0) {
            status = 'warn';
          }
          mismatches.push({
            nodeId: node.id,
            nodeName: node.name,
            property: 'lineHeight',
            figmaValue: `${figmaLineHeight}px`,
            liveValue: `${liveLineHeight}px`,
            status,
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
