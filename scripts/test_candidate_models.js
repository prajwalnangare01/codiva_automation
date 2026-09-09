const https = require('https');
const geminiKey = process.env.GEMINI_API_KEY || "";

const candidateModels = [
  "models/gemini-flash-latest",
  "models/gemini-3.7-flash",
  "models/gemini-3.5-flash",
  "models/gemini-3.1-flash-lite",
  "models/gemini-pro-latest"
];

async function testModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: "Hello! Reply with 1 word: Ready" }]
      }]
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/${model}:generateContent?key=${geminiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ [${model}] Status 200 OK! Response:`, d.slice(0, 100));
          resolve({ model, ok: true });
        } else {
          console.log(`❌ [${model}] Status ${res.statusCode}:`, d.slice(0, 120));
          resolve({ model, ok: false });
        }
      });
    });
    req.on('error', (e) => {
      console.log(`❌ [${model}] Request error:`, e.message);
      resolve({ model, ok: false });
    });
    req.write(postData);
    req.end();
  });
}

(async () => {
  console.log("Testing available Gemini models for fastest response...");
  for (const m of candidateModels) {
    await testModel(m);
  }
})();
