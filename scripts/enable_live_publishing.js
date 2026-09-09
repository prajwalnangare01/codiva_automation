/**
 * Switches TEST_MODE to false for live Instagram posting
 */
const fs = require('fs');
const http = require('http');

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

    // Update Node 1: Set TEST_MODE = false
    const node1 = raw.nodes.find(n => n.id === 'u-node-config');
    if (node1) {
      node1.parameters.jsCode = node1.parameters.jsCode.replace(/TEST_MODE:\s*true/, 'TEST_MODE: false');
    }

    // Verify 11B and 13 node parameters
    const node11B = raw.nodes.find(n => n.id === 'u-node-ig-container');
    if (node11B) {
      node11B.parameters = {
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
    }

    const node13 = raw.nodes.find(n => n.id === 'u-node-ig-publish');
    if (node13) {
      node13.parameters = {
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
      node13.retryOnFail = true;
      node13.waitBetweenTries = 5000;
    }

    const payload = JSON.stringify({
      name: raw.name,
      nodes: raw.nodes,
      connections: raw.connections,
      settings: raw.settings || {}
    });

    fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(raw, null, 2), 'utf8');

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
        console.log(`[STATUS ${res2.statusCode}] Switched TEST_MODE to false for LIVE Instagram posting!`);
      });
    });
    req.write(payload);
    req.end();
  });
});
