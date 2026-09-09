const https = require('https');
const http = require('http');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const geminiKey = process.env.GEMINI_API_KEY || "";

// 1. List available models for this key
function listModels() {
  https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const json = JSON.parse(d);
        console.log('Available models for key:');
        if (json.models) {
          json.models.forEach(m => console.log('  -', m.name, '| methods:', m.supportedGenerationMethods));
        } else {
          console.log('Response:', d);
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
}

// 2. Update n8n credential with host and apiKey
function updateCred() {
  const credData = JSON.stringify({
    name: "Google Gemini(PaLM) Api account",
    type: "googlePalmApi",
    data: {
      apiKey: geminiKey,
      host: "generativelanguage.googleapis.com"
    }
  });

  const req = http.request(new URL(`${host}/api/v1/credentials/bkKuJdCogQz1kFvS`), {
    method: 'PATCH',
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(credData)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`[N8N CREDENTIAL UPDATE] Status ${res.statusCode}:`, body);
    });
  });
  req.write(credData);
  req.end();
}

listModels();
updateCred();
