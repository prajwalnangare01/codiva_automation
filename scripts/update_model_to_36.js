/**
 * Updates model name to models/gemini-3.6-flash in all Gemini nodes
 */
const fs = require('fs');
const http = require('http');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

const wf = JSON.parse(fs.readFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', 'utf8'));

wf.nodes.forEach(node => {
  if (node.type === '@n8n/n8n-nodes-langchain.lmChatGoogleGemini') {
    node.parameters = {
      modelName: "models/gemini-3.6-flash",
      options: {}
    };
  }
});

fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(wf, null, 2), 'utf8');

async function updateModel() {
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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[UPDATED TO GEMINI 3.6 FLASH] "${result.name}" updated successfully!`);
            resolve(result);
          } else {
            console.error(`[UPDATE ERROR]`, result);
            reject(result);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

updateModel();
