const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Resvg } = require('c:\\build automation\\node_modules\\@resvg\\resvg-js');

const PORT = 3210;
const CURRICULUM_FILE = path.join('c:\\build automation\\data', 'curriculum.json');
const STATE_FILE = path.join('c:\\build automation\\data', 'state.json');

function getCurriculumState() {
  if (!fs.existsSync(STATE_FILE)) {
    const initialState = { currentIndex: 0, totalPosted: 0, history: [] };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2), 'utf8');
    return initialState;
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return { currentIndex: 0, totalPosted: 0, history: [] };
  }
}

function saveCurriculumState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getNextCurriculumConcept() {
  let curriculum = [];
  if (fs.existsSync(CURRICULUM_FILE)) {
    try {
      curriculum = JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf8'));
    } catch (e) {
      console.error('Failed to read curriculum.json:', e.message);
    }
  }

  if (curriculum.length === 0) {
    throw new Error('Curriculum list is empty in ' + CURRICULUM_FILE);
  }

  const state = getCurriculumState();
  const currentIdx = state.currentIndex % curriculum.length;
  const concept = curriculum[currentIdx];

  // Advance state for the NEXT run
  state.currentIndex = currentIdx + 1;
  state.totalPosted = (state.totalPosted || 0) + 1;
  state.lastPostedTopic = concept.headline;
  state.lastPostedAt = new Date().toISOString();
  state.history = state.history || [];
  state.history.push({
    index: currentIdx,
    badge: concept.badge,
    headline: concept.headline,
    postedAt: state.lastPostedAt
  });
  if (state.history.length > 50) state.history.shift();

  saveCurriculumState(state);

  return {
    concept: concept,
    meta: {
      current_step: currentIdx + 1,
      next_step: state.currentIndex + 1,
      total_in_series: curriculum.length,
      total_executions: state.totalPosted
    }
  };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text, maxChars = 46) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!w) continue;
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function uploadToFreeImageHost(pngBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n6d207e02198a847aa98d0a2a901485a5\r\n--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\nupload\r\n--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njson\r\n--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="codiva_concept.png"\r\nContent-Type: image/png\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;
    const payload = Buffer.concat([Buffer.from(head), pngBuffer, Buffer.from(tail)]);

    const req = https.request({
      hostname: 'freeimage.host',
      path: '/api/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': payload.length
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const resp = JSON.parse(body);
          if (resp.status_code === 200 && resp.image?.url) {
            resolve(resp.image.url);
          } else {
            reject(new Error('FreeImageHost upload error: ' + body));
          }
        } catch (e) {
          reject(new Error('Failed to parse FreeImageHost response: ' + body));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function renderCodeCard(box, isBad, yPos) {
  const bgGrad = isBad ? 'badBg' : 'goodBg';
  const strokeColor = isBad ? '#EF4444' : '#10B981';
  const tagBg = isBad ? '#EF4444' : '#10B981';
  const tagText = isBad ? '#FCA5A5' : '#6EE7B7';
  const label = escapeXml(box?.label || (isBad ? '❌ THE BAD WAY' : '✅ THE PRO WAY'));
  const subtitle = escapeXml(box?.subtitle || (isBad ? 'Anti-Pattern' : 'Best Practice'));
  const filename = escapeXml(box?.filename || (isBad ? 'broken.js' : 'clean.js'));
  const explanationTitle = isBad ? '⚠️ WHY IT FAILS:' : '🚀 WHY IT WORKS:';
  const explanationColor = isBad ? '#F87171' : '#34D399';
  const reasonText = escapeXml(box?.explanation || (isBad ? 'Triggers layout bugs and breaks accessibility.' : 'Fast, accessible, and follows production standards.'));

  const codeColor = isBad ? '#F87171' : '#34D399';
  const rawLines = box?.code_lines || (typeof box?.code === 'string' ? box.code.split('\n') : (isBad ? ['// Anti-pattern code'] : ['// Pro code']));
  const lines = Array.isArray(rawLines) ? rawLines : [String(rawLines)];

  const renderedCode = lines.slice(0, 3).map((l, i) => {
    const yOff = 68 + (i * 36);
    return `<text x="28" y="${yOff}" fill="${codeColor}" font-family="'Consolas', 'Courier New', monospace" font-size="25" font-weight="600">${escapeXml(l)}</text>`;
  }).join('\n');

  return `
  <g transform="translate(60, ${yPos})">
    <rect width="960" height="355" rx="20" fill="url(#${bgGrad})" stroke="${strokeColor}" stroke-width="2" stroke-opacity="0.65" />
    <rect x="0" y="0" width="10" height="355" rx="5" fill="${strokeColor}" />

    <!-- Header Pill -->
    <rect x="35" y="24" width="220" height="38" rx="8" fill="${tagBg}" fill-opacity="0.2" />
    <text x="145" y="49" text-anchor="middle" fill="${tagText}" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="800">${label}</text>
    <text x="275" y="50" fill="#94A3B8" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="600">${subtitle}</text>

    <!-- Code Terminal Box (Height 170 for >=30px bottom breathing room) -->
    <g transform="translate(35, 78)">
      <rect width="890" height="170" rx="14" fill="#030712" stroke="#374151" stroke-width="1.5" />
      <circle cx="28" cy="22" r="6" fill="#EF4444" />
      <circle cx="48" cy="22" r="6" fill="#F59E0B" />
      <circle cx="68" cy="22" r="6" fill="#10B981" />
      <text x="100" y="27" fill="#6B7280" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="600">${filename}</text>
      ${renderedCode}
    </g>

    <!-- Explanation Box -->
    <g transform="translate(35, 260)">
      <rect width="890" height="74" rx="10" fill="${isBad ? '#26151B' : '#0D281E'}" stroke="${isBad ? '#7F1D1D' : '#065F46'}" stroke-width="1.2" />
      <text x="25" y="32" fill="${explanationColor}" font-family="'Segoe UI', Arial, sans-serif" font-size="19" font-weight="800">${explanationTitle}</text>
      <text x="25" y="57" fill="#F3F4F6" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="500">${reasonText}</text>
    </g>
  </g>`;
}

function renderBottomCard(title, rule, subrule, yPos = 1105) {
  const lines = wrapText(rule, 46);
  const startY = 82;
  const lineHeight = 32;
  
  const ruleSvg = lines.map((l, i) => {
    const yOff = startY + (i * lineHeight);
    return `<text x="35" y="${yOff}" fill="#FFFFFF" font-family="'Segoe UI', Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(l)}</text>`;
  }).join('\n');

  // Dynamically place subrule: ALWAYS 40px below the last rule line (NO OVERLAP)
  const subruleY = startY + ((lines.length - 1) * lineHeight) + 40;
  const boxHeight = Math.max(175, subruleY + 36);

  return `
  <g transform="translate(60, ${yPos})">
    <rect width="960" height="${boxHeight}" rx="18" fill="#111827" stroke="#38BDF8" stroke-width="2" />
    <rect x="35" y="22" width="180" height="34" rx="8" fill="#38BDF8" fill-opacity="0.15" />
    <text x="125" y="45" text-anchor="middle" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="800">${escapeXml(title)}</text>
    ${ruleSvg}
    <text x="35" y="${subruleY}" fill="#94A3B8" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="500">${escapeXml(subrule)}</text>
  </g>`;
}

function renderComparisonCard(brief) {
  const brandSeries = escapeXml(brief.day_tag || 'MERN STACK • ROADMAP');
  const badge = escapeXml(brief.badge || 'HTML5 CONCEPT');
  const headline = brief.headline || 'Stop Using <div> For Everything';
  const subheadline = escapeXml(brief.subheadline || 'Semantic HTML vs The Div Soup Mistake');

  const rookie = brief.rookie_way || (brief.sections && brief.sections[0]) || {
    label: '❌ THE BAD WAY',
    subtitle: 'Quirks Mode Trap',
    filename: 'index.html',
    code_lines: ['<html>', '  <head><title>App</title></head>', '</html>'],
    explanation: 'Missing DOCTYPE triggers Quirks Mode, breaking modern CSS layouts.'
  };

  const senior = brief.senior_way || (brief.sections && brief.sections[1]) || {
    label: '✅ THE PRO WAY',
    subtitle: 'HTML5 Standards Mode',
    filename: 'index.html',
    code_lines: ['<!DOCTYPE html>', '<html lang="en">', '  <head><meta charset="UTF-8"></head>'],
    explanation: 'Enforces standard HTML5 rendering and proper character encoding.'
  };

  const rule = brief.golden_rule || 'Always begin your HTML with <!DOCTYPE html> to ensure standards mode.';
  const subrule = brief.golden_subrule || 'It takes 1 line and prevents 90s browser compatibility bugs.';

  const headlineLines = wrapText(headline, 32);
  const headlineSvg = headlineLines.map((line, idx) => {
    const yOff = 236 + (idx * 48);
    return `<text x="60" y="${yOff}" fill="#FFFFFF" font-family="'Segoe UI', Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="-0.5">${escapeXml(line)}</text>`;
  }).join('\n');
  const subY = 236 + (headlineLines.length * 48) + 12;

  return `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="badBg" x1="0" y1="0" x2="0" y2="355" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1F151B" />
      <stop offset="100%" stop-color="#151A28" />
    </linearGradient>
    <linearGradient id="goodBg" x1="0" y1="0" x2="0" y2="355" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0F2420" />
      <stop offset="100%" stop-color="#151A28" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1350" fill="url(#bg)" />
  <circle cx="540" cy="200" r="400" fill="#38BDF8" fill-opacity="0.05" />

  <!-- Top Header -->
  <text x="60" y="90" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="3">CODIVA</text>
  <text x="1020" y="90" text-anchor="end" fill="#94A3B8" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="600">${brandSeries}</text>
  <line x1="60" y1="120" x2="1020" y2="120" stroke="#1F2937" stroke-width="2" />

  <!-- Badge -->
  <rect x="60" y="145" width="280" height="40" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5" />
  <text x="200" y="171" text-anchor="middle" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="1">${badge}</text>

  <!-- Title & Subtitle -->
  ${headlineSvg}
  <text x="60" y="${subY}" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="600">${subheadline}</text>

  <!-- Section 1: Bad Way -->
  ${renderCodeCard(rookie, true, 345)}

  <!-- Section 2: Good Way -->
  ${renderCodeCard(senior, false, 725)}

  <!-- Section 3: Bottom Golden Rule (Dynamic Zero-Overlap) -->
  ${renderBottomCard('💡 GOLDEN RULE', rule, subrule, 1105)}
</svg>`;
}

function renderChallengeCard(brief) {
  const brandSeries = escapeXml(brief.day_tag || 'MERN STACK • ROADMAP');
  const badge = escapeXml(brief.badge || 'HTML • DAILY CHALLENGE');
  const headline = brief.headline || 'WHAT WILL THIS CODE DO?';
  const subheadline = escapeXml(brief.subheadline || 'Test your knowledge before reading the answer.');

  const ch = brief.challenge || {};
  const filename = escapeXml(ch.filename || 'quiz_code.js');
  const rawLines = ch.code_lines || (typeof ch.code === 'string' ? ch.code.split('\n') : ['// Test your knowledge']);
  const lines = Array.isArray(rawLines) ? rawLines : [String(rawLines)];

  const renderedCode = lines.slice(0, 4).map((l, i) => {
    const yOff = 72 + (i * 36);
    return `<text x="28" y="${yOff}" fill="#38BDF8" font-family="'Consolas', 'Courier New', monospace" font-size="25" font-weight="600">${escapeXml(l)}</text>`;
  }).join('\n');

  const question = ch.question || 'What is the expected output of this snippet?';
  const qLines = wrapText(`❓ ${question}`, 48);
  const questionSvg = qLines.map((l, i) => {
    const yOff = 44 + (i * 30);
    return `<text x="35" y="${yOff}" fill="#FBBF24" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="800">${escapeXml(l)}</text>`;
  }).join('\n');

  const rawOptions = ch.options || ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'];
  const options = Array.isArray(rawOptions) ? rawOptions : Object.values(rawOptions);

  const optionsStartY = 44 + ((qLines.length - 1) * 30) + 36;
  const renderedOptions = options.slice(0, 4).map((opt, i) => {
    const yOff = optionsStartY + (i * 62);
    const letter = ['A', 'B', 'C', 'D'][i] || '•';
    const text = String(opt).replace(/^[A-D]\.?\s*/i, '');
    return `
    <g transform="translate(35, ${yOff})">
      <rect width="890" height="52" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5" />
      <rect x="12" y="10" width="34" height="32" rx="6" fill="#38BDF8" fill-opacity="0.2" />
      <text x="29" y="32" text-anchor="middle" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="800">${letter}</text>
      <text x="62" y="33" fill="#F3F4F6" font-family="'Segoe UI', Arial, sans-serif" font-size="21" font-weight="600">${escapeXml(text)}</text>
    </g>`;
  }).join('\n');

  const rule = brief.golden_rule || (ch.explanation || 'Always check spec standards before assuming browser behavior.');
  const subrule = brief.golden_subrule || '💬 Drop your answer in comments! Save this post for your daily MERN roadmap.';

  const headlineLines = wrapText(headline, 32);
  const headlineSvg = headlineLines.map((line, idx) => {
    const yOff = 236 + (idx * 48);
    return `<text x="60" y="${yOff}" fill="#FFFFFF" font-family="'Segoe UI', Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="-0.5">${escapeXml(line)}</text>`;
  }).join('\n');
  const subY = 236 + (headlineLines.length * 48) + 12;

  const section2Height = optionsStartY + (options.length * 62) + 20;

  return `
<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#131C2E" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1350" fill="url(#bg)" />
  <circle cx="540" cy="200" r="420" fill="#38BDF8" fill-opacity="0.05" />

  <!-- Top Header -->
  <text x="60" y="90" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="3">CODIVA</text>
  <text x="1020" y="90" text-anchor="end" fill="#94A3B8" font-family="'Segoe UI', Arial, sans-serif" font-size="22" font-weight="600">${brandSeries}</text>
  <line x1="60" y1="120" x2="1020" y2="120" stroke="#1F2937" stroke-width="2" />

  <!-- Badge -->
  <rect x="60" y="145" width="310" height="40" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
  <text x="215" y="171" text-anchor="middle" fill="#FBBF24" font-family="'Segoe UI', Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="1">⚡ ${badge}</text>

  <!-- Title & Subtitle -->
  ${headlineSvg}
  <text x="60" y="${subY}" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="600">${subheadline}</text>

  <!-- Section 1: Code Box -->
  <g transform="translate(60, 345)">
    <rect width="960" height="295" rx="20" fill="url(#cardBg)" stroke="#38BDF8" stroke-width="2" stroke-opacity="0.5" />
    <rect x="0" y="0" width="10" height="295" rx="5" fill="#38BDF8" />

    <rect x="35" y="22" width="220" height="36" rx="8" fill="#38BDF8" fill-opacity="0.15" />
    <text x="145" y="46" text-anchor="middle" fill="#38BDF8" font-family="'Segoe UI', Arial, sans-serif" font-size="17" font-weight="800">🔍 CODE CHALLENGE</text>

    <!-- Code Terminal Inside -->
    <g transform="translate(35, 72)">
      <rect width="890" height="195" rx="14" fill="#030712" stroke="#374151" stroke-width="1.5" />
      <circle cx="28" cy="24" r="6" fill="#EF4444" />
      <circle cx="48" cy="24" r="6" fill="#F59E0B" />
      <circle cx="68" cy="24" r="6" fill="#10B981" />
      <text x="100" y="29" fill="#6B7280" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="600">${filename}</text>
      ${renderedCode}
    </g>
  </g>

  <!-- Section 2: Interactive Options Grid -->
  <g transform="translate(60, 660)">
    <rect width="960" height="${section2Height}" rx="20" fill="url(#cardBg)" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.5" />
    <rect x="0" y="0" width="10" height="${section2Height}" rx="5" fill="#F59E0B" />

    ${questionSvg}
    ${renderedOptions}
  </g>

  <!-- Section 3: Takeaway & Solution Hook (Dynamic Zero-Overlap) -->
  ${renderBottomCard('💡 KEY TAKEAWAY', rule, subrule, 1105)}
</svg>`;
}

async function renderCard(brief) {
  const isChallenge = brief.challenge && (brief.challenge.question || brief.challenge.options);
  const svg = isChallenge ? renderChallengeCard(brief) : renderComparisonCard(brief);

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } });
  const pngBuffer = resvg.render().asPng();
  const publicUrl = await uploadToFreeImageHost(pngBuffer);

  return {
    image_url: publicUrl,
    width: 1080,
    height: 1350,
    aspect_ratio: "4:5",
    format: isChallenge ? "INTERACTIVE_CHALLENGE_CARD" : "CLEAN_MOBILE_CODE_COMPARISON",
    status: "rendered_and_hosted",
    rendered_at: new Date().toISOString()
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'Codiva MERN Curriculum Engine' }));
    return;
  }

  // Next concept endpoint: automatically retrieves & increments on disk
  if (req.url === '/curriculum/next' && req.method === 'GET') {
    try {
      const data = getNextCurriculumConcept();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.url === '/render' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const brief = JSON.parse(body || '{}');
        const result = await renderCard(brief);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found. Use GET /curriculum/next or POST /render.' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Codiva MERN Engine listening on http://127.0.0.1:${PORT}`);
});
