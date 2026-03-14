---
name: figma-live-qa
description: Compares live webpage styling against Figma design specs for QA validation. Use when you need to check if a live URL matches its Figma design, detect styling mismatches in font size, font weight, line height, or color, or generate a side-by-side QA report between a deployed page and a Figma file.
---

# Figma vs Live URL QA Comparison Skill

This skill runs a visual and typographic QA check between a live webpage (scraped via Playwright) and a Figma design file (fetched via the Figma REST API). It outputs a side-by-side comparison table flagging mismatches with both Pass/Fail indicators and exact value diffs.

## When to use this skill

- Use when asked to "QA" or "check" a live URL against a Figma design
- Use when someone says styles don't match between design and implementation
- Use when generating a styling diff report for a component, page, or feature
- Use when comparing font size, font weight, line height, or color between Figma and a live site

## Inputs required

Before running, confirm the following are available:

1. **Live URL** — the deployed page to scrape (e.g. `https://example.com/page`)
2. **Figma file ID** — from the Figma file URL: `figma.com/file/<FILE_ID>/...`
3. **Figma node IDs** — the specific frame/component nodes to compare (optional but recommended for precision)
4. **Figma access token** — stored in environment as `FIGMA_ACCESS_TOKEN`

## How it works

### Step 1 — Scrape the live URL with Playwright

Use Playwright to load the live URL and extract computed styles for all relevant elements:

```ts
// Properties to extract per element
const properties = [
  'font-size',
  'font-weight',
  'line-height',
  'color'
];

// Use getComputedStyle on targeted elements
const styles = await page.evaluate((props) => {
  return Array.from(document.querySelectorAll('*')).map(el => ({
    selector: el.tagName + (el.className ? '.' + el.className : ''),
    styles: Object.fromEntries(
      props.map(p => [p, getComputedStyle(el).getPropertyValue(p)])
    )
  }));
}, properties);
```

### Step 2 — Fetch Figma data via REST API

Call the Figma REST API to get node styling:

```ts
const res = await fetch(
  `https://api.figma.com/v1/files/${FILE_ID}/nodes?ids=${NODE_IDS}`,
  { headers: { 'X-Figma-Token': process.env.FIGMA_ACCESS_TOKEN } }
);
const data = await res.json();
```

Extract from each node:
- `style.fontSize` → font size
- `style.fontWeight` → font weight
- `style.lineHeightPx` or `style.lineHeightPercent` → line height
- `fills[0].color` → color (convert RGBA 0–1 floats to CSS rgb/hex)

### Step 3 — Normalize values for comparison

Before comparing, normalize units so they are consistent:

| Property    | Live (Playwright)        | Figma                     | Normalize to     |
|-------------|--------------------------|---------------------------|------------------|
| font-size   | `"16px"`                 | `16` (number)             | `px` number      |
| font-weight | `"400"`                  | `400` (number)            | number           |
| line-height | `"24px"` or `"normal"`   | `lineHeightPx: 24`        | `px` number      |
| color       | `"rgb(255, 0, 0)"`       | `{r:1, g:0, b:0, a:1}`   | hex `#rrggbb`    |

### Step 4 — Compare and flag mismatches

For each property, produce:
- **Pass/Fail** — does the value match within an acceptable tolerance?
- **Exact diff** — show both values side by side when they differ

Tolerance recommendations:
- Font size: exact match (0px tolerance)
- Font weight: exact match
- Line height: ±1px tolerance (browser rendering rounding)
- Color: ±2 per channel (hex rounding)

### Step 5 — Output a side-by-side comparison table

Render results in a table format:

| Element / Node | Property    | Figma Value | Live Value | Status |
|----------------|-------------|-------------|------------|--------|
| Heading/H1     | font-size   | 32px        | 30px       | ❌ FAIL (-2px) |
| Heading/H1     | font-weight | 700         | 700        | ✅ PASS |
| Body/p         | line-height | 24px        | 24px       | ✅ PASS |
| Body/p         | color       | #333333     | #323232    | ⚠️ WARN (close) |

Use these status indicators:
- ✅ **PASS** — values match within tolerance
- ❌ **FAIL** — values differ beyond tolerance (show exact diff)
- ⚠️ **WARN** — values are close but not exact (within 5% of tolerance)

## Decision tree

```
Is a Figma file ID provided?
├── No  → Ask the user for the Figma file URL or node ID before proceeding
└── Yes → Is a live URL provided?
          ├── No  → Ask for the live URL
          └── Yes → Run Playwright scrape + Figma API fetch in parallel
                    → Normalize → Compare → Output table
```

## Output format

Always produce:
1. A **summary line**: `X properties checked — Y passed, Z failed`
2. The **full comparison table** grouped by element
3. A **list of failures only** at the bottom for quick scanning

## Notes and conventions

- Always run Playwright in headless mode
- If Figma node IDs are not provided, compare at the page/frame level and note that results may be approximate
- Color comparison should convert Figma's 0–1 float RGBA to hex before diffing
- Line height in Figma may be `AUTO` — treat this as `normal` and mark as WARN if live value is also `normal`
- The skill lives best as a **workspace skill** (`.agents/skills/figma-live-qa/`) since it depends on project-specific Figma file IDs and tokens
