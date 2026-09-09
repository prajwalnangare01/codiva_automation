/**
 * CODIVA Autonomous Instagram Publisher
 * Runs 24/7 in GitHub Actions (or locally) with zero human intervention.
 * 
 * Schedule:
 * - 7:00 PM IST (13:30 UTC): Slot 1 (LEARN - Comparison Card)
 * - 10:00 PM IST (16:30 UTC): Slot 2 (APPLY - Interactive Challenge Card)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Resvg } = require('@resvg/resvg-js');

// 1. LOAD ENVIRONMENT VARIABLES
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || '';
const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID || '17841475951559107';
const FREEIMAGEHOST_KEY = process.env.FREEIMAGEHOST_KEY || '6d207e02198a847aa98d0a2a901485a5';
const DRY_RUN = process.env.DRY_RUN === 'true';

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const CURRICULUM_FILE = path.join(DATA_DIR, 'curriculum.json');

// 2. HELPER UTILITIES
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

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 3. STATE & CURRICULUM ENGINE
function getState() {
  if (!fs.existsSync(STATE_FILE)) {
    const initial = { currentIndex: 0, totalPosted: 0, history: [] };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return { currentIndex: 0, totalPosted: 0, history: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getCurriculum() {
  if (!fs.existsSync(CURRICULUM_FILE)) {
    throw new Error('Curriculum file not found: ' + CURRICULUM_FILE);
  }
  return JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf8'));
}

// 4. GEMINI AI CONTENT GENERATOR
async function generateCreativeWithGemini(concept, isChallenge) {
  if (!GEMINI_API_KEY) {
    console.log('⚠️ GEMINI_API_KEY not found. Using curriculum pre-computed dataset.');
    return null;
  }

  const promptText = `
You are the Content Strategist AI for CODIVA (@codiva_labs), teaching full-stack MERN Web Development.
Today's Target Topic:
- Day: ${concept.day_number || 1}
- Slot: ${isChallenge ? 'Slot 2 (APPLY / Challenge at 10:00 PM IST)' : 'Slot 1 (LEARN / Concept Breakdown at 7:00 PM IST)'}
- Module: ${concept.module || 'Web Development'}
- Topic: ${concept.headline}
- Description: ${concept.subheadline}

${isChallenge ? `
Generate an INTERACTIVE CODE CHALLENGE card (Predict output / spot the bug) in strict JSON:
{
  "day_tag": "DAY ${(concept.day_number || 1).toString().padStart(2, '0')} OF 90",
  "badge": "${concept.module || 'MERN'} • DAILY CHALLENGE",
  "headline": "${concept.headline.toUpperCase()}",
  "subheadline": "Test your knowledge: What is the output or behavior?",
  "challenge": {
    "filename": "challenge.js",
    "code_lines": ["// Short 2-3 line code snippet"],
    "question": "What will be printed or what happens?",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "answer": "A",
    "explanation": "Clear 1-sentence explanation of the exact mechanic."
  },
  "golden_rule": "Key engineering takeaway in 1 sentence.",
  "golden_subrule": "💬 Drop your answer (A, B, C, or D) below! Save for your roadmap.",
  "caption": "High-converting Instagram caption with hook, explanation, CTA, and 10 relevant hashtags."
}
` : `
Generate a BAD WAY vs PRO WAY comparison card in strict JSON:
{
  "day_tag": "DAY ${(concept.day_number || 1).toString().padStart(2, '0')} OF 90",
  "badge": "${concept.module || 'MERN'} • LEARN",
  "headline": "${concept.headline}",
  "subheadline": "${concept.subheadline}",
  "rookie_way": {
    "label": "❌ THE COMMON MISTAKE",
    "subtitle": "Beginner Anti-Pattern",
    "filename": "rookie.js",
    "code_lines": ["// Bad approach (max 3 lines)"],
    "explanation": "Why this causes bugs, memory leaks, or poor performance."
  },
  "senior_way": {
    "label": "✅ THE PRO WAY",
    "subtitle": "Production Standard",
    "filename": "pro.js",
    "code_lines": ["// Clean production approach (max 3 lines)"],
    "explanation": "Why this is clean, fast, and adheres to modern best practices."
  },
  "golden_rule": "The one golden rule developers should memorize (max 18 words).",
  "golden_subrule": "Actionable takeaway for daily coding.",
  "caption": "High-converting Instagram caption with hook, breakdown, CTA, and 10 relevant hashtags."
}
`}

Return ONLY valid raw JSON with no wrapping markdown if possible.
`;

  try {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });

    const res = await httpsRequest({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (res.statusCode === 200) {
      const parsedResp = JSON.parse(res.body);
      const text = parsedResp.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = text.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/im, '').trim();
      return JSON.parse(cleanJson);
    } else {
      console.warn(`Gemini API returned status ${res.statusCode}: ${res.body.slice(0, 150)}`);
      return null;
    }
  } catch (err) {
    console.warn('Gemini generation error, falling back to curriculum data:', err.message);
    return null;
  }
}

// 5. SVG CARD RENDERERS (Tested Zero-Overlap Dynamic Engine)
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

    <!-- Code Terminal Box -->
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

// 6. CDN UPLOAD (FreeImageHost)
async function uploadToFreeImageHost(pngBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n${FREEIMAGEHOST_KEY}\r\n--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\nupload\r\n--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njson\r\n--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="codiva_concept.png"\r\nContent-Type: image/png\r\n\r\n`;
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

// 7. INSTAGRAM GRAPH API PUBLISHER
async function publishToInstagram(imageUrl, caption) {
  if (DRY_RUN) {
    console.log('🧪 [DRY RUN ACTIVE] Skipping live Instagram API publishing.');
    return {
      success: true,
      media_id: 'DRY_RUN_' + Date.now(),
      permalink: 'https://instagram.com/codiva_labs (Simulation)',
      status: 'simulated'
    };
  }

  if (!IG_ACCESS_TOKEN) {
    throw new Error('IG_ACCESS_TOKEN is missing! Cannot publish live.');
  }

  console.log(`📤 Step 1/3: Creating Instagram media container for account ${IG_ACCOUNT_ID}...`);
  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption: caption,
    access_token: IG_ACCESS_TOKEN
  }).toString();

  const containerRes = await httpsRequest({
    hostname: 'graph.facebook.com',
    path: `/v23.0/${IG_ACCOUNT_ID}/media`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, createParams);

  const containerData = JSON.parse(containerRes.body || '{}');
  if (containerRes.statusCode !== 200 || !containerData.id) {
    throw new Error('Failed to create media container: ' + containerRes.body);
  }

  const creationId = containerData.id;
  console.log(`✅ Media container created: ${creationId}`);

  console.log('⏳ Step 2/3: Waiting 10 seconds for Instagram media processing...');
  await sleep(10000);

  console.log(`🚀 Step 3/3: Publishing container ${creationId} live...`);
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: IG_ACCESS_TOKEN
  }).toString();

  const publishRes = await httpsRequest({
    hostname: 'graph.facebook.com',
    path: `/v23.0/${IG_ACCOUNT_ID}/media_publish`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, publishParams);

  const publishData = JSON.parse(publishRes.body || '{}');
  if (publishRes.statusCode !== 200 || !publishData.id) {
    throw new Error('Failed to publish live media: ' + publishRes.body);
  }

  const mediaId = publishData.id;
  let permalink = `https://instagram.com/p/${mediaId}`;

  // Attempt to fetch exact permalink
  try {
    const permalinkRes = await httpsRequest({
      hostname: 'graph.facebook.com',
      path: `/v23.0/${mediaId}?fields=permalink&access_token=${IG_ACCESS_TOKEN}`,
      method: 'GET'
    });
    const permalinkData = JSON.parse(permalinkRes.body || '{}');
    if (permalinkData.permalink) permalink = permalinkData.permalink;
  } catch (e) {
    // Non-critical
  }

  return {
    success: true,
    media_id: mediaId,
    permalink: permalink,
    status: 'published'
  };
}

// 8. DEFAULT CAPTION GENERATOR
function buildFallbackCaption(brief, concept, isChallenge) {
  const day = (concept.day_number || 1).toString().padStart(2, '0');
  const headline = brief.headline || concept.headline;
  const subheadline = brief.subheadline || concept.subheadline;
  const rule = brief.golden_rule || concept.golden_rule;

  if (isChallenge) {
    const options = brief.challenge?.options || ['A', 'B', 'C', 'D'];
    const optsFormatted = options.map(o => `🔹 ${o}`).join('\n');
    return `⚡ [DAY ${day}/90] ${headline.toUpperCase()}\n\n${subheadline}\n\n${optsFormatted}\n\n💡 Drop your answer (A, B, C, or D) in the comments! Solution & explanation will be pinned.\n\n📌 Save this post for your MERN roadmap!\n\n#codiva #mern #javascript #webdev #reactjs #nodejs #programming #frontend #codechallenge #codinglife #fullstack`;
  }

  return `🔥 [DAY ${day}/90] ${headline}\n\n${subheadline}\n\n❌ Stop using anti-patterns that cause unexpected bugs and performance bottlenecks in production.\n\n✅ The Senior Pro standard keeps your code clean, declarative, and maintainable.\n\n💡 GOLDEN RULE: ${rule}\n\n💬 Did you know this? Let us know your thoughts below!\n📌 Save this post for later reference.\n\n#codiva #mern #fullstack #javascript #webdevelopment #reactjs #nodejs #html5 #css3 #cleancode #learntocode`;
}

// 9. MAIN AUTONOMOUS WORKFLOW
async function main() {
  console.log('====================================================');
  console.log('🚀 CODIVA AUTONOMOUS INSTAGRAM ENGINE');
  console.log(`⏰ Executed at: ${new Date().toISOString()}`);
  console.log(`🧪 Mode: ${DRY_RUN ? 'DRY RUN (No live publishing)' : 'LIVE PRODUCTION'}`);
  console.log('====================================================');

  // Load state and curriculum
  const state = getState();
  const curriculum = getCurriculum();

  if (curriculum.length === 0) {
    throw new Error('Curriculum is empty!');
  }

  const currentIdx = state.currentIndex % curriculum.length;
  const concept = curriculum[currentIdx];
  const isChallenge = (concept.slot === 2) || (concept.challenge != null);

  console.log(`📚 Current Curriculum Index: ${currentIdx} (Post #${state.totalPosted + 1})`);
  console.log(`🎯 Day ${concept.day_number || 1} | Slot ${concept.slot || (isChallenge ? 2 : 1)}: ${concept.headline}`);
  console.log(`🏷️ Type: ${isChallenge ? 'APPLY (Challenge Card)' : 'LEARN (Comparison Card)'}`);

  // Generate Creative Brief (AI or fallback)
  console.log('🤖 Generating creative content with AI...');
  let brief = await generateCreativeWithGemini(concept, isChallenge);

  if (!brief) {
    console.log('ℹ️ Using pre-computed curriculum data for layout.');
    brief = {
      day_tag: concept.day_tag || `DAY ${(concept.day_number || 1).toString().padStart(2, '0')} OF 90`,
      badge: concept.badge || (isChallenge ? 'HTML • APPLY' : 'HTML • LEARN'),
      headline: concept.headline,
      subheadline: concept.subheadline,
      rookie_way: concept.rookie_way,
      senior_way: concept.senior_way,
      challenge: concept.challenge,
      golden_rule: concept.golden_rule,
      golden_subrule: concept.golden_subrule,
      caption: null
    };
  }

  const finalCaption = brief.caption || buildFallbackCaption(brief, concept, isChallenge);

  // Render SVG to 1080x1350 PNG
  console.log('🎨 Rendering high-resolution 1080x1350 card via native @resvg/resvg-js...');
  const svg = isChallenge ? renderChallengeCard(brief) : renderComparisonCard(brief);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } });
  const pngBuffer = resvg.render().asPng();
  console.log(`✅ PNG Rendered successfully! Buffer size: ${(pngBuffer.length / 1024).toFixed(1)} KB`);

  // Upload to FreeImageHost CDN
  console.log('☁️ Uploading rendered card to FreeImageHost CDN...');
  const imageUrl = await uploadToFreeImageHost(pngBuffer);
  console.log(`✅ CDN Image URL: ${imageUrl}`);

  // Publish to Instagram
  console.log('📱 Publishing to Instagram @codiva_labs...');
  const publishResult = await publishToInstagram(imageUrl, finalCaption);

  console.log('----------------------------------------------------');
  console.log('🎉 POSTING COMPLETED SUCCESSFULLY!');
  console.log(`📸 Image: ${imageUrl}`);
  console.log(`🔗 Instagram Permalink: ${publishResult.permalink}`);
  console.log(`🆔 Media ID: ${publishResult.media_id}`);
  console.log('----------------------------------------------------');

  // Advance state for the next run
  state.currentIndex = (currentIdx + 1) % curriculum.length;
  state.totalPosted = (state.totalPosted || 0) + 1;
  state.lastPostedTopic = brief.headline || concept.headline;
  state.lastPostedAt = new Date().toISOString();
  state.lastPermalink = publishResult.permalink;
  state.lastImageUrl = imageUrl;
  state.history = state.history || [];
  state.history.push({
    index: currentIdx,
    day: concept.day_number,
    slot: concept.slot,
    headline: state.lastPostedTopic,
    permalink: publishResult.permalink,
    imageUrl: imageUrl,
    postedAt: state.lastPostedAt
  });
  if (state.history.length > 100) state.history.shift();

  saveState(state);
  console.log(`💾 State updated: Next Index = ${state.currentIndex}, Total Posted = ${state.totalPosted}`);
}

main().catch(err => {
  console.error('❌ FATAL PUBLISHING ERROR:', err);
  process.exit(1);
});
