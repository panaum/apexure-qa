function collectNodes(node) {
  const nodes = [];

  const base = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: Math.round(node.x || 0),
    y: Math.round(node.y || 0),
    width: Math.round(node.width || 0),
    height: Math.round(node.height || 0),
  };

  if (node.type === 'TEXT') {
    base.content = node.characters || '';

    if (typeof node.fontSize === 'number') base.fontSize = node.fontSize;

    if (node.fontName && typeof node.fontName === 'object' && node.fontName.family) {
      base.fontFamily = node.fontName.family;
      base.fontWeight = node.fontName.style || 'Regular';
    }

    if (node.lineHeight && typeof node.lineHeight === 'object') {
      if (node.lineHeight.unit === 'PIXELS') {
        base.lineHeight = node.lineHeight.value;
      } else if (node.lineHeight.unit === 'PERCENT' && typeof node.fontSize === 'number') {
        base.lineHeight = Math.round((node.lineHeight.value / 100) * node.fontSize * 100) / 100;
      }
    }

    if (Array.isArray(node.fills) && node.fills.length > 0) {
      base.fills = node.fills
        .filter(f => f.visible !== false && f.type === 'SOLID' && f.color)
        .map(f => ({
          type: f.type,
          color: {
            r: Math.round(f.color.r * 255),
            g: Math.round(f.color.g * 255),
            b: Math.round(f.color.b * 255),
            a: f.opacity !== undefined ? f.opacity : 1,
          },
        }));
    }
  }

  nodes.push(base);

  if ('children' in node && node.children) {
    for (let i = 0; i < node.children.length; i++) {
      collectNodes(node.children[i]).forEach(n => nodes.push(n));
    }
  }

  return nodes;
}

// All network calls MUST go through the UI iframe — not from code.js directly
figma.showUI(__html__, { visible: false, width: 0, height: 0 });

const page = figma.currentPage;
const allNodes = collectNodes(page);
const payload = {
  fileKey: figma.fileKey || 'unknown',
  pageName: page.name,
  nodes: allNodes,
};

// Hand off to ui.html to do the fetch
figma.ui.postMessage({ type: 'send-data', payload, count: allNodes.length });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'success') {
    figma.notify('✅ Sent ' + allNodes.length + ' nodes to Design Sentinel!');
  } else {
    figma.notify('❌ Bridge not running — start node server.js first');
  }
  figma.closePlugin();
};