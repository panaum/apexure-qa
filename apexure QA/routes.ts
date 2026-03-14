import type { Express } from "express";
import { storage } from "./storage";
import { chromium } from "playwright";

// --- HELPERS ---
function normalizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
  try { new URL(normalized); return normalized; } catch { return null; }
}

function parseFigmaUrl(url: string) {
  try {
    const urlObj = new URL(url.trim());
    const fileKey = urlObj.pathname.split('/')[2];
    const nodeId = urlObj.searchParams.get('node-id');
    if (!nodeId) return null;
    const nodeIdColon = nodeId.replace('-', ':');
    return { fileKey, nodeId: nodeIdColon, nodeIdRaw: nodeId };
  } catch { return null; }
}

function rgbToHex(rgbString: string): string {
  const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  const rgbaMatch = rgbString.match(/rgba\((\d+),\s*(\d+),\s*[\d.]+\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  if (rgbString.startsWith('#')) return rgbString.toUpperCase();
  return rgbString;
}

function normalizeLineHeight(lineHeight: string, fontSize: string): string {
  const lhNum = parseFloat(lineHeight);
  const fsNum = parseFloat(fontSize);
  if (!isNaN(lhNum) && !isNaN(fsNum) && !lineHeight.includes('px')) {
    return `${Math.round(lhNum * fsNum)}px`;
  }
  if (lineHeight === 'normal' || lineHeight === 'Normal') return 'Normal';
  return lineHeight.includes('px') ? `${Math.round(parseFloat(lineHeight))}px` : lineHeight;
}

// --- FIGMA: extract all text nodes with section info ---
function extractTextNodesFromFigma(node: any, sectionName: string = 'Section 1', depth: number = 0): any[] {
  const results: any[] = [];
  const currentSection = (depth <= 2 && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT' || node.type === 'INSTANCE'))
    ? node.name : sectionName;

  if (node.type === 'TEXT') {
    const style = node.style ?? {};
    const fills = node.fills ?? [];
    const fill = fills[0];
    const color = fill?.color
      ? `#${Math.round(fill.color.r * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.g * 255).toString(16).padStart(2, '0')}${Math.round(fill.color.b * 255).toString(16).padStart(2, '0')}`
      : "#000000";
    results.push({
      section: sectionName,
      text: node.characters ?? '',
      fontFamily: style.fontFamily ?? 'Unknown',
      fontSize: style.fontSize ? `${style.fontSize}px` : 'Unknown',
      lineHeight: style.lineHeightPx ? `${Math.round(style.lineHeightPx)}px` : 'Normal',
      color: color.toUpperCase()
    });
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(...extractTextNodesFromFigma(child, currentSection, depth + 1));
    }
  }
  return results;
}

// --- FIGMA: extract all image nodes with layer name + dimensions ---
function extractImageNodesFromFigma(node: any, sectionName: string = 'Section 1', depth: number = 0): any[] {
  const results: any[] = [];
  const currentSection = (depth <= 2 && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT' || node.type === 'INSTANCE'))
    ? node.name : sectionName;

  const hasImageFill = node.fills?.some((f: any) => f.type === 'IMAGE');
  if (hasImageFill) {
    const box = node.absoluteBoundingBox;
    results.push({
      section: sectionName,
      layerName: (node.name ?? 'Unnamed').trim(),
      width: box ? Math.round(box.width) : null,
      height: box ? Math.round(box.height) : null,
    });
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      results.push(...extractImageNodesFromFigma(child, currentSection, depth + 1));
    }
  }
  return results;
}

// --- FIGMA FETCH ---
async function fetchFigmaData(fileKey: string, nodeId: string, nodeIdRaw: string, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`, {
      headers: { 'X-Figma-Token': token },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.status === 403 || data.err) throw new Error(`Figma API error: ${data.err || 'Unauthorized'}`);
    const nodeData = data.nodes[nodeId] || data.nodes[nodeIdRaw];
    if (!nodeData) throw new Error(`Node not found in Figma response.`);
    const rootNode = nodeData.document;
    return {
      textNodes: extractTextNodesFromFigma(rootNode, rootNode.name || 'Section 1', 0),
      imageNodes: extractImageNodesFromFigma(rootNode, rootNode.name || 'Section 1', 0),
    };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') throw new Error('Figma API request timed out');
    throw error;
  }
}

// --- WEB FETCH: text ---
async function fetchWebData(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);

    // --- ACCORDION FIX: open all accordion panels before scraping ---
    // Clicks every trigger that controls a collapsed panel, waits briefly for animations
    await page.evaluate(() => {
      const triggers = Array.from(document.querySelectorAll<HTMLElement>(
        // Common accordion trigger patterns across libraries
        '[data-accordion-target], [data-bs-toggle="collapse"], ' +
        '[aria-expanded="false"], ' +
        '.accordion-button.collapsed, ' +
        '.accordion-header button, ' +
        '[class*="accordion"] button, ' +
        '[class*="accordion"] [role="button"], ' +
        'details:not([open]) > summary'
      ));
      triggers.forEach(el => {
        try { el.click(); } catch { }
      });
    });

    // Wait briefly for CSS expand animations to finish
    await page.waitForTimeout(600);

    const sections = await page.evaluate(() => {
      const results: any[] = [];
      const sectionSelectors = ['section', 'main > div', 'article', '[id*="section"]', '[class*="section"]', '[id*="hero"]', '[id*="about"]', '[id*="feature"]', '[id*="contact"]'];
      let containers: Element[] = [];
      for (const sel of sectionSelectors) {
        const found = Array.from(document.querySelectorAll(sel));
        if (found.length > 0) { containers = found; break; }
      }
      if (containers.length === 0) containers = Array.from(document.body.children);

      containers.forEach((container, index) => {
        const sectionName = container.getAttribute('id') || container.getAttribute('aria-label') || (container as HTMLElement).dataset.section || `Section ${index + 1}`;
        const textEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a, button, label');
        textEls.forEach((el) => {
          if (el.querySelector('p, h1, h2, h3, h4, h5, h6, li, div')) return;

          // Use textContent for hidden elements (innerText returns '' when display:none)
          const computedStyle = window.getComputedStyle(el);
          const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0';

          // For visible elements use innerText (respects CSS), for hidden use textContent
          const rawText = isHidden
            ? el.textContent?.replace(/\s+/g, ' ').trim()
            : (el as HTMLElement).innerText?.replace(/\s+/g, ' ').trim();

          if (!rawText || rawText.length < 2) return;

          // For hidden elements we still want style info — walk up to find a visible ancestor's styles
          // but use the element's own computed style for font info
          results.push({
            section: sectionName,
            text: rawText,
            fontFamily: computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
            fontSize: computedStyle.fontSize,
            lineHeight: computedStyle.lineHeight,
            color: computedStyle.color,
            // Flag accordion content so we know it was hidden
            fromAccordion: isHidden,
          });
        });
      });
      return results;
    });

    return sections.map((item: any) => ({
      ...item,
      color: rgbToHex(item.color),
      lineHeight: normalizeLineHeight(item.lineHeight, item.fontSize)
    }));
  } finally {
    await browser.close();
  }
}

// --- WEB FETCH: images ---
async function fetchWebImages(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(
      () => Array.from(document.images).every(img => img.complete),
      { timeout: 5000 }
    ).catch(() => { });

    const images = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('img, [role="img"], svg, canvas, picture, figure, [style*="background-image"], [class*="image"], [class*="img"], [class*="photo"], [class*="banner"], [class*="avatar"], [class*="logo"], [class*="icon"]'));
      const seen = new Set<string>();
      const results: any[] = [];
      allEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const alt = el.getAttribute('alt') || el.getAttribute('aria-label') || el.getAttribute('title') || (el as HTMLElement).dataset.alt || '';
        const key = el.getAttribute('src') || `${Math.round(rect.width)}x${Math.round(rect.height)}@${Math.round(rect.top)}`;
        if (seen.has(key)) return;
        seen.add(key);
        results.push({ alt: alt.trim(), src: el.getAttribute('src') || null, width: Math.round(rect.width), height: Math.round(rect.height) });
      });
      return results;
    });
    return images;
  } finally {
    await browser.close();
  }
}

// --- COMPARE IMAGES ---
function compareImages(figmaImages: any[], webImages: any[]) {
  const TOLERANCE = 15;
  const dimensionMatch = (fi: any, wi: any) =>
    fi.width && wi.width && Math.abs(fi.width - wi.width) <= TOLERANCE && Math.abs(fi.height - wi.height) <= TOLERANCE;
  const nameMatch = (fi: any, wi: any) => {
    if (!wi.alt || wi.alt.length === 0) return false;
    const a = fi.layerName.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
    const b = wi.alt.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
    return a === b || a.includes(b) || b.includes(a);
  };

  const figmaResults = figmaImages.map(fi => {
    const match = webImages.find(wi => nameMatch(fi, wi) || dimensionMatch(fi, wi));
    return {
      source: 'figma', section: fi.section, layerName: fi.layerName,
      figmaSize: fi.width && fi.height ? `${fi.width}x${fi.height}` : 'Unknown',
      webAlt: match?.alt ?? null, webSize: match ? `${match.width}x${match.height}` : null,
      status: match ? 'present' : 'missing_on_web',
      matchedBy: match ? (nameMatch(fi, match) && dimensionMatch(fi, match) ? 'name+size' : nameMatch(fi, match) ? 'name' : 'size') : null,
    };
  });

  const matchedKeys = new Set(figmaResults.filter(r => r.status === 'present').map(r => r.webSize + '|' + (r.webAlt ?? '')));
  const extraWebImages = webImages
    .filter(wi => {
      const key = `${wi.width}x${wi.height}|${wi.alt ?? ''}`;
      return !matchedKeys.has(key) && wi.width >= 20 && wi.height >= 20;
    })
    .map(wi => ({
      source: 'web', section: null, layerName: null, figmaSize: null,
      webAlt: wi.alt || null, webSize: `${wi.width}x${wi.height}`,
      status: 'missing_on_figma', matchedBy: null,
    }));

  return [...figmaResults, ...extraWebImages];
}

// --- COMPARE TEXT ---
function compareTextNodes(figmaNodes: any[], webNodes: any[]) {
  const sectionMap: Record<string, any[]> = {};
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const wordSimilarity = (a: string, b: string): number => {
    const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'of', 'is', 'it', 'as']);
    const words = (s: string) => norm(s).split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w));
    const wa = new Set(words(a)); const wb = words(b);
    if (wa.size === 0 || wb.length === 0) return 0;
    return wb.filter(w => wa.has(w)).length / Math.max(wa.size, wb.length);
  };
  const lengthRatio = (a: string, b: string) => Math.min(a.length, b.length) / Math.max(a.length, b.length);
  const findMatch = (figmaText: string, nodes: any[]) => {
    const fn = norm(figmaText);
    const exact = nodes.find(wn => norm(wn.text) === fn);
    if (exact) return exact;
    const fuzzy = nodes.find(wn => {
      const wn_norm = norm(wn.text);
      return lengthRatio(fn, wn_norm) >= 0.5 && wordSimilarity(fn, wn_norm) >= 0.7;
    });
    return fuzzy;
  };

  for (const fn of figmaNodes) {
    if (!sectionMap[fn.section]) sectionMap[fn.section] = [];
    const webMatch = findMatch(fn.text, webNodes);
    const contentMatch = webMatch !== undefined;
    const styleMatch = webMatch ? fn.fontFamily === webMatch.fontFamily && fn.fontSize === webMatch.fontSize && fn.color === webMatch.color : false;
    sectionMap[fn.section].push({
      section: fn.section, figmaText: fn.text, webText: webMatch?.text ?? null,
      contentStatus: contentMatch ? 'match' : 'diff',
      styleStatus: styleMatch ? 'match' : 'diff',
      figmaStyle: { fontFamily: fn.fontFamily, fontSize: fn.fontSize, lineHeight: fn.lineHeight, color: fn.color },
      webStyle: webMatch ? { fontFamily: webMatch.fontFamily, fontSize: webMatch.fontSize, lineHeight: webMatch.lineHeight, color: webMatch.color } : null
    });
  }
  return Object.entries(sectionMap).map(([sectionName, items], index) => ({ sectionIndex: index + 1, sectionName, items }));
}

// --- BROKEN LINK CHECKER ---
async function extractLinks(url: string): Promise<any[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    return await page.evaluate((baseUrl) => {
      const links: any[] = [];
      const seen = new Set<string>();

      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href') ?? '';
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        let resolved = href;
        try { resolved = new URL(href, baseUrl).href; } catch { }
        if (seen.has(resolved)) return;
        seen.add(resolved);
        links.push({
          url: resolved,
          text: (el as HTMLElement).innerText?.trim().slice(0, 80) || null,
          type: href.startsWith('mailto:') ? 'mailto' : href.startsWith('tel:') ? 'tel' : resolved.startsWith(baseUrl) ? 'internal' : 'external',
        });
      });

      document.querySelectorAll('img[src]').forEach(el => {
        const src = el.getAttribute('src') ?? '';
        if (!src || src.startsWith('data:')) return;
        let resolved = src;
        try { resolved = new URL(src, baseUrl).href; } catch { }
        if (seen.has(resolved)) return;
        seen.add(resolved);
        links.push({ url: resolved, text: el.getAttribute('alt') || null, type: 'image' });
      });

      return links;
    }, url);
  } finally {
    await browser.close();
  }
}

async function checkLink(link: any): Promise<any> {
  if (link.type === 'mailto' || link.type === 'tel') {
    return { ...link, status: 'valid', statusCode: null };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(link.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (res.status === 405) {
      const res2 = await fetch(link.url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' },
        redirect: 'follow',
      });
      return { ...link, statusCode: res2.status, status: res2.ok ? 'valid' : 'broken' };
    }
    return { ...link, statusCode: res.status, status: res.ok ? 'valid' : 'broken' };
  } catch (err: any) {
    return { ...link, statusCode: null, status: 'error', error: err.name === 'AbortError' ? 'timeout' : err.message };
  }
}

// --- SPELL CHECK via LanguageTool ---
async function checkSpelling(text: string, language: string = 'en-US'): Promise<any[]> {
  const res = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ text, language, enabledOnly: 'false' }),
  });
  if (!res.ok) throw new Error(`LanguageTool API error: ${res.status}`);
  const data = await res.json();
  return data.matches.map((m: any) => ({
    message: m.message,
    shortMessage: m.shortMessage || null,
    offset: m.offset,
    length: m.length,
    word: text.slice(m.offset, m.offset + m.length),
    type: m.rule?.issueType ?? 'unknown',
    category: m.rule?.category?.name ?? 'Unknown',
    replacements: m.replacements?.slice(0, 3).map((r: any) => r.value) ?? [],
    context: m.context?.text ?? null,
  }));
}

async function fetchPageText(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    return await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  } finally {
    await browser.close();
  }
}

export async function registerRoutes(app: Express): Promise<void> {

  app.post("/api/compare", async (req, res) => {
    try {
      const { figmaUrl, figmaToken, liveUrl } = req.body;
      if (!figmaUrl || !figmaToken || !liveUrl) return res.status(400).json({ message: "figmaUrl, figmaToken, and liveUrl are all required." });
      if (typeof figmaToken !== 'string' || figmaToken.trim().length === 0) return res.status(400).json({ message: "Invalid Figma token." });

      const figmaParsed = parseFigmaUrl(figmaUrl);
      const webUrl = normalizeUrl(liveUrl);
      if (!figmaParsed) throw new Error("Invalid Figma URL. Make sure it includes a node-id parameter.");
      if (!webUrl) throw new Error("Invalid live URL.");

      const [figmaData, webNodes, webImages] = await Promise.all([
        fetchFigmaData(figmaParsed.fileKey, figmaParsed.nodeId, figmaParsed.nodeIdRaw, figmaToken),
        fetchWebData(webUrl),
        fetchWebImages(webUrl),
      ]);

      const { textNodes: figmaNodes, imageNodes: figmaImages } = figmaData;
      if (!figmaNodes || figmaNodes.length === 0) throw new Error("No text nodes found in the selected Figma frame.");
      if (!webNodes || webNodes.length === 0) throw new Error("Could not extract text from the live URL.");

      const sections = compareTextNodes(figmaNodes, webNodes);
      const images = compareImages(figmaImages, webImages);
      const imagesSummary = {
        total: images.length,
        present: images.filter(i => i.status === 'present').length,
        missingOnWeb: images.filter(i => i.status === 'missing_on_web').length,
        missingOnFigma: images.filter(i => i.status === 'missing_on_figma').length,
        items: images,
      };

      const comparison = await storage.createComparison({ figmaUrl, liveUrl: webUrl, result: { sections, images: imagesSummary } });
      res.json(comparison);
    } catch (error: any) {
      console.error('Comparison error:', error);
      res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
    }
  });

  app.post("/api/check-links", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "url is required." });
      const normalized = normalizeUrl(url);
      if (!normalized) return res.status(400).json({ message: "Invalid URL." });

      const links = await extractLinks(normalized);
      const BATCH_SIZE = 10;
      const results: any[] = [];
      for (let i = 0; i < links.length; i += BATCH_SIZE) {
        const batch = links.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(checkLink));
        results.push(...batchResults);
      }

      res.json({
        total: results.length,
        valid: results.filter(r => r.status === 'valid').length,
        broken: results.filter(r => r.status === 'broken').length,
        errors: results.filter(r => r.status === 'error').length,
        byType: {
          internal: results.filter(r => r.type === 'internal').length,
          external: results.filter(r => r.type === 'external').length,
          image: results.filter(r => r.type === 'image').length,
          mailto: results.filter(r => r.type === 'mailto').length,
          tel: results.filter(r => r.type === 'tel').length,
        },
        links: results,
      });
    } catch (error: any) {
      console.error('Link check error:', error);
      res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
    }
  });

  app.post("/api/spell-check", async (req, res) => {
    try {
      const { url, language = 'en-US' } = req.body;
      if (!url) return res.status(400).json({ message: "url is required." });
      const normalized = normalizeUrl(url);
      if (!normalized) return res.status(400).json({ message: "Invalid URL." });

      const pageText = await fetchPageText(normalized);
      const CHUNK_SIZE = 20000;
      const chunks: string[] = [];
      for (let i = 0; i < pageText.length; i += CHUNK_SIZE) {
        chunks.push(pageText.slice(i, i + CHUNK_SIZE));
      }

      const allIssues: any[] = [];
      let offset = 0;
      for (const chunk of chunks) {
        const issues = await checkSpelling(chunk, language);
        allIssues.push(...issues.map(i => ({ ...i, offset: i.offset + offset })));
        offset += chunk.length;
      }

      const byCategory: Record<string, number> = {};
      allIssues.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + 1; });

      res.json({
        url: normalized,
        language,
        totalIssues: allIssues.length,
        spelling: allIssues.filter(i => i.category === 'Possible Typo' || i.type === 'misspelling').length,
        grammar: allIssues.filter(i => i.type === 'grammar').length,
        style: allIssues.filter(i => i.type === 'style').length,
        byCategory,
        issues: allIssues,
      });
    } catch (error: any) {
      console.error('Spell check error:', error);
      res.status(500).json({ message: error.message || 'An unexpected error occurred.' });
    }
  });
}