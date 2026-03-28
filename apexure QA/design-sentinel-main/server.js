const express = require('express');
const cors = require('cors');
const { startBridge, getLatestFigmaData } = require('./bridge');
const { compare } = require('./compare');

const app = express();
const PORT = 3334;

app.use(cors({ origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

app.post('/compare', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" in request body' });
  }

  const figmaData = getLatestFigmaData();
  if (!figmaData) {
    return res.status(400).json({ error: 'No Figma data loaded. Run the Figma plugin first.' });
  }

  try {
    console.log(`[Server] Running comparison against: ${url}`);
    const result = await compare(figmaData, url);
    console.log(`[Server] Comparison complete: ${result.passed} passed, ${result.failed} failed, ${result.warned} warned`);
    res.json(result);
  } catch (err) {
    console.error('[Server] Comparison error:', err.message);
    res.status(500).json({ error: `Comparison failed: ${err.message}` });
  }
});

app.get('/status', (req, res) => {
  const figmaData = getLatestFigmaData();
  res.json({
    figmaDataLoaded: !!figmaData,
    nodeCount: figmaData ? figmaData.nodes.length : 0,
    pageName: figmaData ? figmaData.pageName : null,
  });
});

async function start() {
  try {
    await startBridge(3333);
    app.listen(PORT, () => {
      console.log(`[Server] Design Sentinel API running on http://localhost:${PORT}`);
      console.log(`[Server] Bridge is ready on http://localhost:3333`);
      console.log(`[Server] Waiting for Figma plugin data...`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
