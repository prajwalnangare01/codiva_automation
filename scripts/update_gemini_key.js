/**
 * Updates the Google Gemini credential in n8n and tests the Gemini API key
 */
const fs = require('fs');
const http = require('http');
const https = require('https');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const geminiKey = process.env.GEMINI_API_KEY || "";

// 1. Test the Gemini API Key directly
async function testGeminiDirect() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: "Hello! Confirm you are working as Codiva AI Strategist." }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log("[GEMINI DIRECT TEST SUCCESS]:", parsed.candidates[0].content.parts[0].text);
            resolve(true);
          } else {
            console.log("[GEMINI TEST FAILED]: Status " + res.statusCode, data);
            resolve(false);
          }
        } catch (e) {
          console.error("Parse error:", e);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error("Request error:", e);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// 2. Update n8n Credential
async function updateN8nCredential() {
  return new Promise((resolve, reject) => {
    const credData = JSON.stringify({
      name: "Google Gemini(PaLM) Api account",
      type: "googlePalmApi",
      data: {
        apiKey: geminiKey
      }
    });

    // Try PATCH /api/v1/credentials/bkKuJdCogQz1kFvS
    const req = http.request(new URL(`${host}/api/v1/credentials/bkKuJdCogQz1kFvS`), {
      method: 'PATCH',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(credData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[N8N CREDENTIAL UPDATE] Status ${res.statusCode}:`, data);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
    });

    req.on('error', reject);
    req.write(credData);
    req.end();
  });
}

(async () => {
  console.log("Testing Google Gemini API Key directly...");
  await testGeminiDirect();
  console.log("\nUpdating n8n credential 'Google Gemini(PaLM) Api account'...");
  await updateN8nCredential();
})();
