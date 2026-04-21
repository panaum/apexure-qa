const fs = require('fs');

const figmaData = JSON.parse(fs.readFileSync('figma_properties.json', 'utf8'));
const websiteData = JSON.parse(fs.readFileSync('website_properties.json', 'utf8'));

// Helper mapping Figma font weights to CSS numbers
const fontWeightMap = {
  "Thin": 100, "ExtraLight": 200, "Light": 300,
  "Regular": 400, "Medium": 500, "SemiBold": 600,
  "Bold": 700, "ExtraBold": 800, "Black": 900
};

// Normalize Figma values
function normalizeFigma(figma) {
  const norm = {};
  norm.fontFamily = figma.fontFamily;
  norm.fontWeight = fontWeightMap[figma.fontWeight] || 400;
  norm.fontSize = parseFloat(figma.fontSize);
  
  if (figma.lineHeight.unit === "PERCENT") {
    norm.lineHeight = (figma.lineHeight.value / 100).toString();
  } else if (figma.lineHeight.unit === "PIXELS") {
    norm.lineHeight = figma.lineHeight.value + "px";
  } else {
    norm.lineHeight = "normal";
  }

  if (figma.letterSpacing.unit === "PIXELS" && figma.letterSpacing.value !== 0) {
    norm.letterSpacing = figma.letterSpacing.value + "px";
  } else {
    norm.letterSpacing = "normal";
  }

  norm.textAlign = (figma.textAlignHorizontal || "LEFT").toLowerCase();
  
  if (figma.textCase === "UPPER") norm.textTransform = "uppercase";
  else if (figma.textCase === "LOWER") norm.textTransform = "lowercase";
  else norm.textTransform = "none";
  
  norm.textDecoration = (figma.textDecoration || "NONE").toLowerCase();

  if (figma.fills && figma.fills.length > 0 && figma.fills[0].color) {
    const c = figma.fills[0].color;
    norm.color = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${figma.fills[0].opacity || 1})`;
  }

  return norm;
}

// Normalize Website values
function normalizeWebsite(css) {
  const norm = {};
  norm.fontFamily = css["font-family"] ? css["font-family"].split(',')[0].replace(/['"]/g, '').trim() : undefined;
  norm.fontWeight = parseInt(css["font-weight"]) || 400;
  norm.fontSize = parseFloat(css["font-size"]);
  norm.lineHeight = css["line-height"];
  norm.letterSpacing = css["letter-spacing"];
  norm.textAlign = css["text-align"];
  norm.textTransform = css["text-transform"];
  norm.textDecoration = css["text-decoration"];
  norm.color = css["color"]; 
  
  return norm;
}

const differences = {};

for (const key in figmaData) {
  if (!websiteData[key]) {
    differences[key] = { status: "Missing in website" };
    continue;
  }

  const fNorm = normalizeFigma(figmaData[key]);
  const wNorm = normalizeWebsite(websiteData[key]);

  const diffs = {};
  const allProps = new Set([...Object.keys(fNorm), ...Object.keys(wNorm)]);

  for (const prop of allProps) {
    let fVal = fNorm[prop];
    let wVal = wNorm[prop];

    if (typeof fVal === 'string') fVal = fVal.replace(/\s+/g, '');
    if (typeof wVal === 'string') wVal = wVal.replace(/\s+/g, '');

    if (fVal !== wVal) {
      diffs[prop] = {
        figmaValue: fNorm[prop],
        websiteValue: wNorm[prop]
      };
    }
  }

  if (Object.keys(diffs).length > 0) {
    differences[key] = Object.keys(diffs).reduce((acc, k) => {
      acc[k] = diffs[k];
      return acc;
    }, {});
  }
}

fs.writeFileSync('differences.json', JSON.stringify(differences, null, 2));
console.log("Differences file created successfully.");
