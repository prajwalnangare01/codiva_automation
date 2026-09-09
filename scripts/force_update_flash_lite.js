/**
 * Fetches current workflow from n8n, sets modelName to models/gemini-3.1-flash-lite, and saves it
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

function putWorkflow(wf) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(wf);
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
        console.log(`[STATUS ${res.statusCode}] Update response:`, body);
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
  const wf = await getWorkflow();
  
  console.log(`Found ${wf.nodes.length} nodes. Updating Gemini modelName...`);
  wf.nodes.forEach(n => {
    if (n.name && n.name.includes("Google Gemini")) {
      console.log(`  Updating ${n.name} to "models/gemini-3.1-flash-lite"...`);
      n.parameters = {
        ...n.parameters,
        modelName: "models/gemini-3.1-flash-lite"
      };
    }
  });

  // Save to local file as backup
  fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(wf, null, 2), 'utf8');

  console.log("Pushing updated workflow back to n8n...");
  await putWorkflow(wf);
})();
