/**
 * Fixes expression syntax in all AI Agent nodes of the Unified Codiva Workflow
 */
const fs = require('fs');
const http = require('http');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

const wf = JSON.parse(fs.readFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', 'utf8'));

wf.nodes.forEach(node => {
  // 1. Content Strategist AI
  if (node.id === 'u-node-strategist') {
    node.parameters = {
      promptType: "define",
      text: `=Evaluate today's social media content decision for Codiva (Web Development Agency).

BRAND PROFILE:
- Agency: {{ $json.brand_profile.name }} ({{ $json.brand_profile.industry }})
- Positioning: {{ $json.brand_profile.positioning }}
- Brand Tone: {{ $json.brand_profile.tone }}
- Target Audience: {{ $json.brand_profile.target_audience }}

SCOUTED TOPIC CANDIDATE:
- Topic: {{ $json.trend_scout.selected_candidate.topic }}
- Pillar: {{ $json.trend_scout.selected_candidate.pillar }}
- Trend Angle: {{ $json.trend_scout.selected_candidate.angle }}

CONTENT PILLARS:
1. Web Development Education
2. UI/UX & Web Design
3. Technology & AI Trends
4. Business & Website Advice
5. Codiva Promotion
6. Memes

INSTRUCTIONS:
Output STRICT JSON ONLY with NO MARKDOWN OR BACKTICKS:
{
  "decision": "CREATE_POST",
  "content_pillar": "{{ $json.trend_scout.selected_candidate.pillar }}",
  "format": "single-image post",
  "topic": "{{ $json.trend_scout.selected_candidate.topic }}",
  "hook": "Catchy scroll-stopping first line",
  "audience": "{{ $json.brand_profile.target_audience }}",
  "content_angle": "{{ $json.trend_scout.selected_candidate.angle }}",
  "why_this_topic": "Strategic reason why this builds trust and saves for Codiva",
  "visual_concept": "Detailed description of the visual artwork",
  "cta": "Clear call to action",
  "priority": 9
}`,
      options: {
        systemMessage: "You are the Chief Social Media Strategist for Codiva, a premium web development agency. Output strict, valid JSON only without markdown formatting or commentary."
      }
    };
  }

  // 2. Creative Director AI
  if (node.id === 'u-node-creative-director') {
    node.parameters = {
      promptType: "define",
      text: `=Create a comprehensive Image Generation Brief for the following post:

TOPIC: {{ $json.strategy.topic }}
PILLAR: {{ $json.strategy.content_pillar }}
FORMAT: {{ $json.strategy.format }}
VISUAL CONCEPT: {{ $json.strategy.visual_concept }}
BRAND IDENTITY: Codiva (Web development agency), modern dark interfaces, deep navy (#0F172A), electric cyan (#38BDF8), indigo (#6366F1), ultra-sharp master quality.

INSTRUCTIONS:
Output STRICT JSON ONLY with NO MARKDOWN OR BACKTICKS:
{
  "visual_type": "premium editorial graphic",
  "prompt": "masterpiece, 8k resolution, modern dark mode web development dashboard, glowing neon cyan and indigo accents, glassmorphic UI cards, sleek typography, clean minimal aesthetic, cinematic studio lighting",
  "negative_prompt": "blurry, low quality, distorted text, ugly artifacts, watermark, oversaturated, amateur",
  "aspect_ratio": "1:1",
  "composition": "centered, clean hierarchy, professional aesthetic",
  "color_direction": "deep navy, electric cyan accents, subtle indigo gradients"
}`,
      options: {
        systemMessage: "You are the Creative Director for Codiva. Generate high-impact visual briefs for AI image generation. Return strict JSON only without markdown backticks."
      }
    };
  }

  // 3. Caption Crafter AI
  if (node.id === 'u-node-caption-crafter') {
    node.parameters = {
      promptType: "define",
      text: `=Generate an engaging, high-converting Instagram caption for Codiva (Web Development Agency).

TOPIC: {{ $json.strategy.topic }}
PILLAR: {{ $json.strategy.content_pillar }}
HOOK: {{ $json.strategy.hook }}
CTA: {{ $json.strategy.cta }}
TARGET AUDIENCE: {{ $json.strategy.audience }}

GUIDELINES:
1. Hook on line 1 that stops the scroll immediately.
2. Value-packed body with clear spacing.
3. Natural storytelling, professional yet approachable tone.
4. Clear call-to-action (CTA).
5. 6 to 8 highly targeted hashtags.

INSTRUCTIONS:
Output STRICT JSON ONLY with NO MARKDOWN OR BACKTICKS:
{
  "first_line_hook": "First line before more",
  "caption_body": "Full caption text with proper line breaks",
  "cta": "Call to action line",
  "hashtags": ["#webdevelopment", "#webdesign", "#codiva", "#nextjs", "#uiux"],
  "formatted_caption": "Ready-to-post full Instagram caption string combining hook, body, cta, and hashtags"
}`,
      options: {
        systemMessage: "You are the Head Copywriter for Codiva. Write captions that drive saves, shares, and high-value client inquiries. Always return strict JSON only without markdown backticks."
      }
    };
  }
});

// Save updated local JSON
fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(wf, null, 2), 'utf8');

// Deploy update via n8n PUT API
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
            console.log(`[FIXED & UPDATED] "${result.name}" syntax error fixed successfully!`);
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
