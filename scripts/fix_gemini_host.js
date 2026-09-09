const http = require('http');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const geminiKey = process.env.GEMINI_API_KEY || "";

async function fixHost() {
  const credData = JSON.stringify({
    name: "Google Gemini(PaLM) Api account",
    type: "googlePalmApi",
    data: {
      apiKey: geminiKey,
      host: "https://generativelanguage.googleapis.com"
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
      console.log(`[CREDENTIAL HOST FIXED] Status ${res.statusCode}:`, body);
    });
  });
  req.write(credData);
  req.end();
}

fixHost();
