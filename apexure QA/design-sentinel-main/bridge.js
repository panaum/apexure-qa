const http = require('http');

let latestFigmaData = null;
let waitResolvers = [];

// ── New: frame data for Screenshot Diff ─────────────────────────────────────
let latestFrameData = null;
let frameWaitResolvers = [];

function waitForFigmaData() {
  if (latestFigmaData) {
    return Promise.resolve(latestFigmaData);
  }
  return new Promise((resolve) => {
    waitResolvers.push(resolve);
  });
}

function getLatestFigmaData() {
  return latestFigmaData;
}

// ── New: wait for a frame export from Screenshot Diff command ─────────────────
function waitForFigmaFrame() {
  if (latestFrameData) {
    const data = latestFrameData;
    latestFrameData = null;
    return Promise.resolve(data);
  }
  return new Promise((resolve) => {
    frameWaitResolvers.push(resolve);
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const bridgeServer = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/figma-data') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        latestFigmaData = payload;
        const nodeCount = payload.nodes ? payload.nodes.length : 0;
        console.log(`[Bridge] Received ${nodeCount} nodes from Figma (page: ${payload.pageName || 'unknown'})`);

        // Resolve any pending waitForFigmaData promises
        for (const resolve of waitResolvers) {
          resolve(latestFigmaData);
        }
        waitResolvers = [];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, nodesReceived: nodeCount }));
      } catch (err) {
        console.error('[Bridge] Error parsing payload:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/figma-data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestFigmaData));
    return;
  }

  // ── New: POST /figma-frame — receives base64 PNG from plugin ───────────────
  if (req.method === 'POST' && req.url === '/figma-frame') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        latestFrameData = payload;
        console.log(`[Bridge] Received frame export: ${payload.frameName || 'unnamed'} (${payload.width}x${payload.height})`);

        // Resolve any pending waitForFigmaFrame promises
        for (const resolve of frameWaitResolvers) {
          resolve(latestFrameData);
        }
        frameWaitResolvers = [];
        latestFrameData = null; // clear after resolving waiters

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error('[Bridge] Error parsing frame payload:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // ── New: GET /figma-frame — returns and clears latest frame data ───────────
  if (req.method === 'GET' && req.url === '/figma-frame') {
    const data = latestFrameData;
    latestFrameData = null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

function startBridge(port = 3333) {
  return new Promise((resolve, reject) => {
    bridgeServer.listen(port, () => {
      console.log(`[Bridge] Figma bridge server running on http://localhost:${port}`);
      resolve(bridgeServer);
    });
    bridgeServer.on('error', reject);
  });
}

module.exports = { startBridge, waitForFigmaData, getLatestFigmaData, waitForFigmaFrame };
