---
name: figma-live-qa
description: Compares live webpage styling against Figma design specs. Use for typography/color QA and generating styling diff reports.
---

# Figma vs Live URL QA Comparison

This skill performs a precision QA check between a live URL and a Figma design. It maps CSS selectors to Figma Node IDs to ensure the agent doesn't blow its context window by scraping the entire DOM.

## 🛠️ Inputs Required

1. **Live URL** — e.g., `https://example.com`
2. **Figma File ID** — From the URL: `figma.com/file/<FILE_ID>/...`
3. **Selector Mapping** — A JSON array mapping selectors to nodes:
   `[{ "selector": "h1", "figmaId": "10:24" }, { "selector": ".btn-primary", "figmaId": "10:55" }]`
4. **Figma Token** — Must be in `FIGMA_ACCESS_TOKEN`.

## 🚀 Execution Flow

### Step 1: Targeted Scraping
Run the helper script at `./scripts/scrape.ts` using Playwright. Do NOT scrape the whole page; only extract styles for the selectors provided in the mapping.

### Step 2: Figma API Fetch
Fetch nodes from `https://api.figma.com/v1/files/${FILE_ID}/nodes?ids=${NODE_IDS}`.
**Key Properties to Extract:**
- **Typography:** `style.fontFamily`, `style.fontSize`, `style.fontWeight`, `style.lineHeightPx`.
- **Color:** `fills[0].color` (if `type === 'SOLID'`).

### Step 3: Normalization & Comparison
Normalize all values to these standards before flagging:

| Property | Standard | Tolerance |
| :--- | :--- | :--- |
| **Color** | Hex (`#ffffff`) | ±2 per RGB channel |
| **Font Size** | Pixels (`16px`) | Exact Match |
| **Line Height** | Pixels (`24px`) | ±1px |
| **Font Family** | String | Figma name must exist within CSS string |

### Step 4: Output Format
Generate a summary line: `✅ X Passed | ❌ Y Failed | ⚠️ Z Warnings`.
Follow with a table:

| Element | Property | Figma | Live | Status |
| :--- | :--- | :--- | :--- | :--- |
| `h1` | font-size | 32px | 31px | ❌ FAIL (-1px) |

## 📂 Reference Resources
- **API Spec:** See `./resources/figma-api-spec.json` for node types.
- **Mapping Example:** See `./examples/mapping-template.json`.