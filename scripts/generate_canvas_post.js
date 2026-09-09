const { Resvg } = require('c:\\build automation\\node_modules\\@resvg/resvg-js');
const https = require('https');
const fs = require('fs');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatHeadlineSvg(headline) {
  const words = String(headline || '').trim().split(/\s+/);
  if (words.length <= 4) {
    return `
    <text x="70" y="340" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="52" font-weight="900" letter-spacing="-1.5">${escapeXml(headline)}</text>
    <text x="70" y="405" fill="url(#cyanGrad)" font-family="-apple-system, system-ui, sans-serif" font-size="30" font-weight="700">Expert Blueprint For High-Converting Websites</text>`;
  }

  // Split into 2 balanced lines
  const mid = Math.ceil(words.length / 2);
  const line1 = escapeXml(words.slice(0, mid).join(' '));
  const line2 = escapeXml(words.slice(mid).join(' '));

  return `
  <text x="70" y="340" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="50" font-weight="900" letter-spacing="-1.5">${line1}</text>
  <text x="70" y="405" fill="url(#cyanGrad)" font-family="-apple-system, system-ui, sans-serif" font-size="50" font-weight="900" letter-spacing="-1.5">${line2}</text>`;
}

async function uploadToFreeImageHost(pngBuffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n6d207e02198a847aa98d0a2a901485a5\r\n--${boundary}\r\nContent-Disposition: form-data; name="action"\r\n\r\nupload\r\n--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\njson\r\n--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="codiva_card.png"\r\nContent-Type: image/png\r\n\r\n`;
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

async function uploadImage(pngBuffer) {
  try {
    return await uploadToFreeImageHost(pngBuffer);
  } catch (err) {
    try {
      return await uploadToUguu(pngBuffer);
    } catch (err2) {
      return await uploadToCatbox(pngBuffer);
    }
  }
}

async function generateCanvas(brief) {
  const headline = escapeXml(brief.headline || '5 REASONS YOUR WEBSITE FEELS SLOW');
  const badge = escapeXml(brief.badge || brief.pillar || 'PERFORMANCE AUDIT');
  const items = brief.supporting_points || [];

  const cardsSvg = items.slice(0, 5).map((item, idx) => {
    const yOffset = 500 + (idx * 145);
    const num = String(idx + 1).padStart(2, '0');
    
    let title = typeof item === 'string' ? item : (item.title || '');
    let desc = typeof item === 'string' ? '' : (item.desc || '');
    if (!desc && title.includes(' — ')) {
      const parts = title.split(' — ');
      title = parts[0];
      desc = parts.slice(1).join(' — ');
    } else if (!desc && title.includes(': ')) {
      const parts = title.split(': ');
      title = parts[0];
      desc = parts.slice(1).join(': ');
    }

    title = escapeXml(title.replace(/^\d+[\.\s]+/, ''));
    desc = escapeXml(desc);

    return `
    <g transform="translate(70, ${yOffset})">
      <rect width="940" height="125" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="1" />
      <rect x="0" y="0" width="6" height="125" rx="3" fill="#38BDF8" />
      <text x="36" y="74" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="30" font-weight="900">${num}</text>
      <text x="105" y="52" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="800">${title}</text>
      <text x="105" y="88" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="500">${desc || 'Essential engineering factor affecting site speed and conversion rates.'}</text>
    </g>`;
  }).join('\n');

  const svg = `
  <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1080" y2="1350" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#090D16" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>
      <linearGradient id="cyanGrad" x1="0" y1="0" x2="1080" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#38BDF8" />
        <stop offset="100%" stop-color="#818CF8" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="940" y2="125" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1E293B" stop-opacity="0.80" />
        <stop offset="100%" stop-color="#0F172A" stop-opacity="0.95" />
      </linearGradient>
    </defs>

    <rect width="1080" height="1350" fill="url(#bgGrad)" />
    <circle cx="980" cy="160" r="320" fill="#38BDF8" fill-opacity="0.08" />
    <circle cx="120" cy="1180" r="260" fill="#6366F1" fill-opacity="0.06" />

    <line x1="70" y1="180" x2="1010" y2="180" stroke="#38BDF8" stroke-opacity="0.15" stroke-width="1" />
    <line x1="70" y1="1235" x2="1010" y2="1235" stroke="#38BDF8" stroke-opacity="0.15" stroke-width="1" />

    <text x="70" y="125" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="900" letter-spacing="4">CODIVA</text>
    <text x="1010" y="125" text-anchor="end" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="600" letter-spacing="2">WEB ENGINEERING &amp; UI/UX</text>

    <!-- Badge -->
    <rect x="70" y="225" width="290" height="42" rx="21" fill="#38BDF8" fill-opacity="0.12" stroke="#38BDF8" stroke-width="1.5" />
    <text x="215" y="252" text-anchor="middle" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" letter-spacing="1.5">${badge}</text>

    <!-- Main Headline with smart wrap -->
    ${formatHeadlineSvg(headline)}

    <!-- Cards -->
    ${cardsSvg}

    <!-- Footer -->
    <text x="70" y="1285" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="700">Save this checklist for your next sprint 🚀</text>
    <text x="1010" y="1285" text-anchor="end" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="700">@codiva.agency</text>
  </svg>`;

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } });
  const pngBuffer = resvg.render().asPng();

  const publicUrl = await uploadImage(pngBuffer);
  return {
    image_url: publicUrl,
    width: 1080,
    height: 1350,
    aspect_ratio: '4:5',
    format: 'PORTRAIT_4_5',
    status: 'rendered_and_hosted',
    rendered_at: new Date().toISOString()
  };
}

async function main() {
  let inputData = null;

  if (process.argv[2]) {
    try {
      if (process.argv[2].trim().startsWith('{')) {
        inputData = JSON.parse(process.argv[2]);
      } else if (fs.existsSync(process.argv[2])) {
        inputData = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
      }
    } catch(e) {}
  }

  if (!inputData) {
    inputData = {
      headline: '5 REASONS YOUR WEBSITE FEELS SLOW',
      badge: 'PERFORMANCE AUDIT',
      supporting_points: [
        'Unoptimized Hero Images — Uncompressed 4MB assets slowing down Largest Contentful Paint.',
        'Render-Blocking Scripts — Third-party tracking scripts halting primary DOM paints.',
        'Missing Edge Caching — Single origin server roundtrips across continents without CDN hit.',
        'Layout Shifts (CLS) — Unreserved image aspect ratios causing jumpy mobile browsing.',
        'Unused CSS & Heavy Frameworks — Shipping hundreds of kilobytes of unpurged classes.'
      ]
    };
  }

  const result = await generateCanvas(inputData);
  console.log(JSON.stringify(result));
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
