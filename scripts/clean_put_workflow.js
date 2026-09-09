/**
 * Clean PUT to n8n API with only allowed properties
 */
const fs = require('fs');
const http = require('http');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

function getWorkflow() {
  return new Promise((resolve, reject) => {
    http.get(new URL(`${host}/api/v1/workflows/${workflowId}`), {
      headers: { 'X-N8N-API-KEY': apiKey }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function putCleanWorkflow(cleanPayload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(cleanPayload);
    const req = http.request(new URL(`${host}/api/v1/workflows/${workflowId}`), {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log(`[STATUS ${res.statusCode}] Server update response:`, body);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log("Fetching live workflow from n8n...");
  const rawWf = await getWorkflow();
  
  // Update modelName on all Gemini nodes
  rawWf.nodes.forEach(n => {
    if (n.name && n.name.includes("Google Gemini")) {
      console.log(`Setting ${n.name} modelName to 'models/gemini-3.1-flash-lite'...`);
      n.parameters = {
        options: {},
        modelName: "models/gemini-3.1-flash-lite"
      };
    }
  });

  // Keep ONLY allowed properties for PUT
  const cleanPayload = {
    name: rawWf.name,
    nodes: rawWf.nodes,
    connections: rawWf.connections,
    settings: rawWf.settings || {},
    staticData: rawWf.staticData || null,
    pinData: rawWf.pinData || {}
  };

  fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(cleanPayload, null, 2), 'utf8');

  console.log("Saving clean payload to n8n server...");
  await putCleanWorkflow(cleanPayload);
})();
