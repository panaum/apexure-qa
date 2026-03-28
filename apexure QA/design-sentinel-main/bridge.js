const http = require('http');

let latestFigmaData = null;
let waitResolvers = [];

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

module.exports = { startBridge, waitForFigmaData, getLatestFigmaData };
