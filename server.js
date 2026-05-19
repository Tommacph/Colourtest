const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
};

// In-memory store — resets on restart, which is fine for now
const responses = [];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url    = req.url.split('?')[0];
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── POST /api/response ── save a single answer
  if (method === 'POST' && url === '/api/response') {
    try {
      const body = await readBody(req);
      responses.push({ ...body, created_at: new Date().toISOString() });
      json(res, 200, { ok: true });
    } catch(e) {
      json(res, 500, { error: e.message });
    }
    return;
  }

  // ── GET /api/results ── aggregated vote tallies per colour
  if (method === 'GET' && url === '/api/results') {
    const colourMap = {};
    for (const row of responses) {
      if (!colourMap[row.colour]) {
        colourMap[row.colour] = { name: row.colour, r: row.r, g: row.g, b: row.b, byQuestion: {} };
      }
      const bq = colourMap[row.colour].byQuestion;
      if (!bq[row.question]) bq[row.question] = {};
      bq[row.question][row.answer] = (bq[row.question][row.answer] || 0) + 1;
    }
    const colours = Object.values(colourMap).map(c => {
      const questions = Object.entries(c.byQuestion).map(([q, answers]) => {
        const winner = Object.entries(answers).sort((a, b) => b[1] - a[1])[0][0];
        return { question: q, answers, winner };
      });
      const totalVotes = questions.reduce((s, q) =>
        s + Object.values(q.answers).reduce((a, b) => a + b, 0), 0);
      return { name: c.name, r: c.r, g: c.g, b: c.b, totalVotes, questions };
    });
    json(res, 200, { colours });
    return;
  }

  // ── /Assets/ ── textures at project root
  if (url.startsWith('/Assets/')) {
    const assetPath = path.join(__dirname, url);
    if (!assetPath.startsWith(path.join(__dirname, 'Assets'))) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.readFile(assetPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(assetPath)] || 'application/octet-stream' });
      res.end(data);
    });
    return;
  }

  // ── Static files from /public ──
  const filePath = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Colour Study running at http://localhost:${PORT}`);
});
