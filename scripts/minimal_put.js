const http = require('http');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

http.get(new URL(`${host}/api/v1/workflows/${workflowId}`), {
  headers: { 'X-N8N-API-KEY': apiKey }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const raw = JSON.parse(body);
    raw.nodes.forEach(n => {
      if (n.name && n.name.includes("Google Gemini")) {
        n.parameters = {
          modelName: "models/gemini-3.1-flash-lite",
          options: {}
        };
      }
    });

    const payload = JSON.stringify({
      name: raw.name,
      nodes: raw.nodes,
      connections: raw.connections,
      settings: raw.settings || {}
    });

    const req = http.request(new URL(`${host}/api/v1/workflows/${workflowId}`), {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res2) => {
      let b2 = '';
      res2.on('data', c => b2 += c);
      res2.on('end', () => {
        console.log(`[STATUS ${res2.statusCode}] Update response:`, b2);
      });
    });
    req.write(payload);
    req.end();
  });
});
