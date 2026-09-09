const https = require('https');
const geminiKey = process.env.GEMINI_API_KEY || "";

function testFlashLite() {
  const postData = JSON.stringify({
    contents: [{
      parts: [{ text: "Respond in JSON: {\"status\": \"ready\"}" }]
    }]
  });

  const req = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log(`Status ${res.statusCode}:`, d);
    });
  });
  req.write(postData);
  req.end();
}

testFlashLite();
