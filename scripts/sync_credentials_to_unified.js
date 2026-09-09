/**
 * Updates the existing Unified Codiva Workflow in n8n with exact Instagram & Gemini credentials
 */
const fs = require('fs');
const http = require('http');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

// Load unified workflow
const wf = JSON.parse(fs.readFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', 'utf8'));

// Ensure exact credentials matching CodivaAutomation
const FB_CREDENTIAL = {
  facebookGraphApi: {
    id: "1KpPi6PzgdqymOwm",
    name: "Facebook Graph account"
  }
};

const GEMINI_CREDENTIAL = {
  googlePalmApi: {
    id: "bkKuJdCogQz1kFvS",
    name: "Google Gemini(PaLM) Api account"
  }
};

// Update nodes in workflow
wf.nodes.forEach(node => {
  if (node.id === 'u-node-ig-container') {
    node.parameters = {
      httpRequestMethod: "POST",
      graphApiVersion: "v23.0",
      node: "17841475951559107",
      edge: "media",
      options: {
        queryParameters: {
          parameter: [
            { name: "image_url", value: "={{ $json.image_url }}" },
            { name: "caption", value: "={{ $json.caption }}" }
          ]
        }
      }
    };
    node.credentials = FB_CREDENTIAL;
  }
  if (node.id === 'u-node-ig-publish') {
    node.parameters = {
      httpRequestMethod: "POST",
      graphApiVersion: "v23.0",
      node: "17841475951559107",
      edge: "media_publish",
      options: {
        queryParameters: {
          parameter: [
            { name: "creation_id", value: "={{ $json.id }}" }
          ]
        }
      }
    };
    node.credentials = FB_CREDENTIAL;
    node.retryOnFail = true;
    node.waitBetweenTries = 5000;
  }
  if (node.name && node.name.includes("Google Gemini")) {
    node.credentials = GEMINI_CREDENTIAL;
  }
});

// Write updated file
fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(wf, null, 2), 'utf8');

// Update workflow via n8n PUT API
async function updateWorkflow() {
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
            console.log(`[UPDATED] Successfully updated "${result.name}" (ID: ${result.id}) with verified credentials!`);
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

updateWorkflow();
