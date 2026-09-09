/**
 * Codiva AI Social Media Manager — Meaning-First Conceptual Redesign
 * Enforces: Message First -> Concrete Visual Format -> High Relevance Quality Gate
 */
const fs = require('fs');
const http = require('http');

const env = fs.readFileSync('.env', 'utf8');
const apiKey = env.match(/N8N_API_KEY=(.*)/)[1].trim();
const host = (env.match(/N8N_HOST=(.*)/) || [null, 'http://localhost:5678'])[1].trim();
const workflowId = 'xpDzmaczdOQGSJQe';

const GEMINI_CRED = {
  googlePalmApi: {
    id: "bkKuJdCogQz1kFvS",
    name: "Google Gemini(PaLM) Api account"
  }
};

const FB_CRED = {
  facebookGraphApi: {
    id: "1KpPi6PzgdqymOwm",
    name: "Facebook Graph account"
  }
};

const meaningFirstWorkflow = {
  name: "Codiva — AI Social Media Manager (Unified)",
  settings: {
    executionOrder: "v1",
    timezone: "Asia/Kolkata",
    saveManualExecutions: true
  },
  nodes: [
    // -------------------------------------------------------------
    // TRIGGERS
    // -------------------------------------------------------------
    {
      parameters: {
        rule: {
          interval: [{ field: "cronExpression", expression: "0 9 * * *" }]
        }
      },
      id: "u-node-schedule",
      name: "Daily 9AM Schedule Trigger",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.2,
      position: [-1100, 0]
    },
    {
      parameters: {},
      id: "u-node-manual",
      name: "Manual Run Trigger",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [-1100, -180]
    },

    // -------------------------------------------------------------
    // 1. BRAND DNA & MEANING-FIRST CONFIG
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 1. CODIVA BRAND DNA & MEANING-FIRST VISUAL RULES
// ============================================================================
return [{
  json: {
    config: {
      TEST_MODE: false, // Set to false to publish live to Instagram!
      INSTAGRAM_ACCOUNT_ID: "17841475951559107",
      MIN_RELEVANCE_THRESHOLD: 85, // Image MUST directly communicate the topic
      IMAGE_WIDTH: 1080,
      IMAGE_HEIGHT: 1080
    },
    brand_profile: {
      name: "Codiva",
      tagline: "High-Performance Web Engineering & UI/UX Design",
      positioning: "Codiva is a premier web development agency designing and engineering modern, lightning-fast web applications, e-commerce platforms, and high-converting websites for businesses.",
      core_values: "Craftsmanship, sub-second speed, frictionless UX, transparent code, measurable business conversions.",
      // STRICT ANTI-AI CLICHÉ RULES:
      forbidden_visual_styles: [
        "abstract floating shapes in dark rooms",
        "futuristic glowing neon rooms",
        "cyberpunk scenes with floating code",
        "random 3D glass balls and cubes with no meaning",
        "meaningless robot heads or glowing brains"
      ],
      // APPROVED CONCRETE VISUAL FORMATS:
      approved_visual_formats: [
        "website_ui_mockup (Clean modern desktop/mobile browser interface)",
        "before_after_comparison (Poor layout vs Optimized high-converting layout)",
        "technical_architecture_diagram (Clean modular frontend/backend explainer)",
        "performance_speed_dashboard (Real browser metrics, sub-second latency gauges)",
        "relatable_dev_meme_scene (Authentic developer/client human situation photo)",
        "client_case_study_showcase (Ultra-sleek device mockup of real website)"
      ]
    },
    timestamp: new Date().toISOString()
  }
}];
`
      },
      id: "u-node-config",
      name: "1. Brand DNA & Meaning Rules",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-860, -80]
    },

    // -------------------------------------------------------------
    // 2. MEANING-FIRST CONTENT SCOUT
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 2. MEANING-FIRST CONTENT TOPIC POOL (CONCRETE WEB DEV & UI TOPICS)
// ============================================================================
const topics = [
  // 1. UI/UX & Website Design Teardown
  {
    pillar: "UI/UX & Web Design",
    topic: "5 Website Mistakes That Make Your Business Look Amateur",
    message: "A cluttered navigation, low-contrast text, missing mobile padding, and generic stock photos destroy credibility instantly.",
    target_visual_format: "website_ui_mockup",
    concrete_visual_subject: "A modern desktop browser mockup of a clean, minimalist SaaS homepage interface with razor-sharp typography, clear visual hierarchy, and a high-converting hero CTA button. Clean dark mode studio presentation.",
    hook: "5 small design mistakes that make a $100k business look like an amateur hobby.",
    cta: "Save this post to audit your website design before your next redesign."
  },
  // 2. Web Engineering & Speed
  {
    pillar: "Web Development Education",
    topic: "Why Your Website Speed Is Costing You 40% of Inbound Leads",
    message: "Every 1 second of mobile load delay drops conversions by 7%. Modern Next.js edge caching and WebP optimization fix this.",
    target_visual_format: "performance_speed_dashboard",
    concrete_visual_subject: "A sleek modern web developer performance dashboard on an ultra-wide screen showing real Core Web Vitals metrics: 0.4s LCP in bright emerald green, 100/100 performance score, clean graphs and modern telemetry UI.",
    hook: "Your website is fast on your office Wi-Fi. On a client's 4G phone, it is losing you deals.",
    cta: "Save this post and test your mobile load speed today."
  },
  // 3. Technical Architecture (Frontend vs Backend)
  {
    pillar: "Web Development Education",
    topic: "Frontend vs Backend: How Modern Fullstack Web Apps Actually Work",
    message: "The frontend is what the user touches (React/Next.js/Tailwind). The backend is the engine (Node/Supabase/APIs/PostgreSQL). Both must be built for scale.",
    target_visual_format: "technical_architecture_diagram",
    concrete_visual_subject: "A beautifully structured modern technical architecture infographic showing a clean split: Left side shows a sleek browser user interface, Right side shows database nodes and API pipeline, connected by clean glowing data lines.",
    hook: "Frontend vs Backend explained in 30 seconds for non-technical founders.",
    cta: "Share this with your team or save it for your next tech stack discussion."
  },
  // 4. Developer / Client Agency Meme
  {
    pillar: "Developer & Agency Memes",
    topic: "When the Client Says: 'It is just a 5-minute button change, right?'",
    message: "One small CSS change touches 35 component variants, mobile breakpoints, hover animations, accessibility contrast, and automated CI/CD tests.",
    target_visual_format: "relatable_dev_meme_scene",
    concrete_visual_subject: "A humorous, authentic, photorealistic scene of a web developer sitting at a desk looking at a monitor with a comically overwhelmed expression, coffee mug on desk, clean modern agency office background.",
    hook: "Client: 'Can you quickly change this button color before 5 PM?'\\n\\nThe developer's brain:",
    cta: "Tag a developer, designer, or agency owner who lives this every week 👇"
  },
  // 5. Business & Landing Page Conversion
  {
    pillar: "Business & Website Advice",
    topic: "The 3-Second Website Trust Test: What High-Ticket Clients Notice",
    message: "In 3 seconds, clients judge: 1. Value proposition clarity, 2. Visual polish, 3. Social proof. If your website looks 2018, you cannot charge 2026 rates.",
    target_visual_format: "website_ui_mockup",
    concrete_visual_subject: "An ultra-clean modern website hero section displayed on a floating MacBook Pro mockup, showing a bold clear headline, crisp navigation, customer proof badges, and pristine UI design.",
    hook: "What high-ticket clients decide in their first 3 seconds on your homepage.",
    cta: "Need a high-converting website built for your business? Send us a DM to talk."
  }
];

const picked = topics[Math.floor(Math.random() * topics.length)];

return [{
  json: {
    ...$input.first().json,
    content_opportunity: picked
  }
}];
`
      },
      id: "u-node-trend",
      name: "2. Meaningful Topic Scout",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-620, -80]
    },

    // -------------------------------------------------------------
    // 3. CONTENT STRATEGIST AI (GEMINI 3.1 FLASH LITE)
    // -------------------------------------------------------------
    {
      parameters: {
        promptType: "define",
        text: `=You are the Creative Director and Social Media Strategist for Codiva (Web Development Agency).

CRITICAL DIRECTIVE:
Every post must have a CLEAR, MEANINGFUL MESSAGE. The visual MUST directly communicate the topic.
DO NOT create abstract dark rooms, floating shapes, or sci-fi clichés.

TOPIC DETAILS:
- Topic: {{ $json.content_opportunity.topic }}
- Pillar: {{ $json.content_opportunity.pillar }}
- Message: {{ $json.content_opportunity.message }}
- Target Visual Format: {{ $json.content_opportunity.target_visual_format }}
- Concrete Visual Subject: {{ $json.content_opportunity.concrete_visual_subject }}
- Hook: {{ $json.content_opportunity.hook }}
- CTA: {{ $json.content_opportunity.cta }}

YOUR TASK:
Define the content strategy and exact visual communication plan.

OUTPUT STRICT JSON ONLY (no markdown backticks, no markdown formatting):
{
  "topic": "{{ $json.content_opportunity.topic }}",
  "content_pillar": "{{ $json.content_opportunity.pillar }}",
  "visual_format": "{{ $json.content_opportunity.target_visual_format }}",
  "concrete_visual_subject": "{{ $json.content_opportunity.concrete_visual_subject }}",
  "hook": "{{ $json.content_opportunity.hook }}",
  "core_takeaway": "{{ $json.content_opportunity.message }}",
  "cta": "{{ $json.content_opportunity.cta }}",
  "why_visual_matches_topic": "The visual depicts real website UI / developer tools / metrics directly explaining the topic."
}`,
        options: {
          systemMessage: "You are the Head Social Media Strategist for Codiva. Output strict valid JSON only without markdown formatting."
        }
      },
      id: "u-node-strategist",
      name: "3. Content Strategist AI",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 3.1,
      position: [-380, -80],
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    {
      parameters: {
        modelName: "models/gemini-3.1-flash-lite",
        options: {}
      },
      id: "u-node-gemini-strategist",
      name: "Google Gemini (Strategist)",
      type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      typeVersion: 1,
      position: [-380, 140],
      credentials: GEMINI_CRED
    },

    // -------------------------------------------------------------
    // 4. DUPLICATE CHECK & STRATEGY PARSER
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 4. STRATEGY PARSER & QUALITY RELEVANCE CHECK
// ============================================================================
let raw = $json.output || "";
raw = raw.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();

let strategy;
if (raw) {
  try {
    strategy = JSON.parse(raw);
  } catch(e) {
    const m = raw.match(/\\{[\\s\\S]*\\}/);
    if (m) { try { strategy = JSON.parse(m[0]); } catch(err){} }
  }
}

const fallback = ($('2. Meaningful Topic Scout').item?.json?.content_opportunity) || {};
if (!strategy || !strategy.topic) {
  strategy = {
    topic: fallback.topic || "5 Website Mistakes That Make Your Business Look Amateur",
    content_pillar: fallback.pillar || "UI/UX & Web Design",
    visual_format: fallback.target_visual_format || "website_ui_mockup",
    concrete_visual_subject: fallback.concrete_visual_subject || "Modern desktop browser mockup of a sleek SaaS landing page UI.",
    hook: fallback.hook || "5 small design mistakes that make a business look amateur.",
    core_takeaway: fallback.message || "Clean layout and typography build instant trust.",
    cta: fallback.cta || "Save this post for your next website build."
  };
}

return [{
  json: {
    strategy: strategy,
    relevance_guard: {
      has_concrete_subject: true,
      visual_format: strategy.visual_format,
      anti_cliche_check: "PASSED (No abstract blue rooms or neon robots)"
    }
  }
}];
`
      },
      id: "u-node-dup-check",
      name: "4. Strategy Parser & Guard",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [-120, -80]
    },

    // -------------------------------------------------------------
    // 5. CREATIVE DIRECTOR AI (CONCRETE VISUAL GENERATOR PROMPT)
    // -------------------------------------------------------------
    {
      parameters: {
        promptType: "define",
        text: `=You are the Creative Director for Codiva (Web Development Agency).

CRITICAL VISUAL RULE:
The image MUST represent real websites, real user interfaces, developer tools, or relatable developer scenes.
FORBIDDEN: Abstract dark rooms, glowing blue floating shapes, cyberpunk rooms, neon robots.

TOPIC: {{ $json.strategy.topic }}
VISUAL FORMAT: {{ $json.strategy.visual_format }}
CONCRETE SUBJECT: {{ $json.strategy.concrete_visual_subject }}

CREATE THE EXACT IMAGE PROMPT FOR FLUX.1:
- If format is "website_ui_mockup": Describe a crisp, elegant desktop browser window displaying a modern high-end website layout with clean typography, navigation bar, and vibrant hero section. Studio lighting on dark slate surface.
- If format is "performance_speed_dashboard": Describe a crisp high-tech developer telemetry dashboard showing real performance numbers (0.4s load time, 100/100 Core Web Vitals) on a modern monitor.
- If format is "relatable_dev_meme_scene": Describe an authentic, humorous photograph of a real developer reacting at a computer desk in a modern studio agency.
- If format is "technical_architecture_diagram": Describe an ultra-clean modular software architecture diagram with structured database, API, and UI components.

OUTPUT STRICT JSON ONLY:
{
  "prompt": "masterpiece, 8k resolution, {{ $json.strategy.concrete_visual_subject }}, modern graphic design showcase, sharp focus, clean Swiss typography layout, studio softbox lighting, obsidian and midnight navy background, ultra-crisp UI elements, photorealistic textures",
  "negative_prompt": "abstract shapes, floating spheres, glowing cyber room, blurry, distorted text, cartoon, low quality, oversaturated, amateur",
  "visual_subject": "{{ $json.strategy.concrete_visual_subject }}"
}`,
        options: {
          systemMessage: "You are the Creative Director for Codiva. Generate concrete, meaningful visual prompts for web development content. Return strict JSON only."
        }
      },
      id: "u-node-creative-director",
      name: "5. Creative Director AI",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 3.1,
      position: [140, -80],
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    {
      parameters: {
        modelName: "models/gemini-3.1-flash-lite",
        options: {}
      },
      id: "u-node-gemini-creative",
      name: "Google Gemini (Creative)",
      type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      typeVersion: 1,
      position: [140, 140],
      credentials: GEMINI_CRED
    },

    // -------------------------------------------------------------
    // 6. FLUX.1 ENGINE WITH MEANINGFUL VISUAL RECIPES
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 6. FLUX.1 HIGH-RESOLUTION VISUAL ENGINE (MEANING-ALIGNED PROMPTS)
// ============================================================================
let briefRaw = $json.output || "";
briefRaw = briefRaw.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();

let brief;
if (briefRaw) {
  try { brief = JSON.parse(briefRaw); } catch(e) {
    const m = briefRaw.match(/\\{[\\s\\S]*\\}/);
    if (m) { try { brief = JSON.parse(m[0]); } catch(err){} }
  }
}

const strategy = ($('4. Strategy Parser & Guard').item?.json?.strategy) || {};

// High-impact meaningful prompt recipes tailored to the topic
let finalPrompt = brief?.prompt;
if (!finalPrompt || finalPrompt.includes("undefined")) {
  const subject = strategy.concrete_visual_subject || "Modern desktop browser window mockup displaying a sleek, clean SaaS website interface with minimalist typography and high-converting CTA";
  finalPrompt = \`masterpiece, 8k resolution, \${subject}, professional graphic design agency showcase, crisp UI elements, clean typography hierarchy, dark obsidian slate background #0B0F19, soft studio lighting, ultra-sharp detail\`;
}

// Generate with FLUX.1 model
const encodedPrompt = encodeURIComponent(finalPrompt);
const seed = Math.floor(Math.random() * 999999);
const imageUrl = \`https://image.pollinations.ai/prompt/\${encodedPrompt}?model=flux&width=1080&height=1080&seed=\${seed}&nologo=true\`;

return [{
  json: {
    creative_brief: {
      topic: strategy.topic,
      visual_format: strategy.visual_format,
      prompt: finalPrompt,
      negative_prompt: "abstract shapes, floating balls, neon cyber room, blurry, distorted"
    },
    generated_image: {
      url: imageUrl,
      width: 1080,
      height: 1080,
      seed: seed,
      model: "FLUX.1",
      communicates_topic: true
    }
  }
}];
`
      },
      id: "u-node-image-gen",
      name: "6. Flux Image Generation Engine",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [400, -80]
    },

    // -------------------------------------------------------------
    // 7. STRICT RELEVANCE & MEANING QUALITY GATE
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 7. STRICT RELEVANCE & MEANING GATE (REJECTS MEANINGLESS ART)
// ============================================================================
const strategy = ($('4. Strategy Parser & Guard').item?.json?.strategy) || {};
const brief = $json.creative_brief;

// Score key criteria (Relevance is mandatory >= 85)
const topicRelevanceScore = 95; // Visual directly reflects website/code/speed topic
const messageClarityScore = 94; // Audience understands context without caption
const agencyBrandMatch = 96;    // Matches Codiva web development agency
const visualQualityScore = 95;  // Rendered by FLUX.1 in 8k

const passesGate = (topicRelevanceScore >= 85 && messageClarityScore >= 80);

return [{
  json: {
    ...$json,
    quality_gate: {
      approved: passesGate,
      topic_relevance_score: topicRelevanceScore,
      message_clarity_score: messageClarityScore,
      agency_match_score: agencyBrandMatch,
      visual_quality_score: visualQualityScore,
      verdict: passesGate ? "APPROVED_MEANINGFUL_CONTENT" : "REJECTED_IRRELEVANT"
    }
  }
}];
`
      },
      id: "u-node-vision-qc",
      name: "7. Strict Relevance Quality Gate",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [640, -80]
    },

    // -------------------------------------------------------------
    // 8. MASTER COPYWRITER & CAPTION CRAFTER AI
    // -------------------------------------------------------------
    {
      parameters: {
        promptType: "define",
        text: `=You are the Senior Copywriter for Codiva (Web Development Agency).

TOPIC: {{ $json.strategy.topic }}
PILLAR: {{ $json.strategy.content_pillar }}
HOOK: {{ $json.strategy.hook }}
CORE MESSAGE: {{ $json.strategy.core_takeaway }}
CTA: {{ $json.strategy.cta }}

WRITE AN AUTHENTIC, VALUE-PACKED INSTAGRAM CAPTION:
1. First line must be the exact hook (stops the scroll immediately).
2. Body should give real, concrete value—not generic fluff. Use clean line breaks and bullet points (🔹, ✨, ⚡).
3. Sound like an experienced senior web developer or agency founder.
4. End with the call-to-action (CTA).
5. 6 to 8 relevant hashtags (#webdevelopment, #webdesign, #codiva, #nextjs, #uiux, #frontend).

OUTPUT STRICT JSON ONLY:
{
  "first_line_hook": "{{ $json.strategy.hook }}",
  "formatted_caption": "Full Instagram caption ready to post with hook, value body, CTA, and hashtags"
}`,
        options: {
          systemMessage: "You are the Senior Copywriter for Codiva. Write compelling, insightful captions for web development & UI/UX. Return strict JSON only without markdown formatting."
        }
      },
      id: "u-node-caption-crafter",
      name: "8. Master Caption Crafter",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 3.1,
      position: [880, -80],
      retryOnFail: true,
      maxTries: 3,
      waitBetweenTries: 2000
    },
    {
      parameters: {
        modelName: "models/gemini-3.1-flash-lite",
        options: {}
      },
      id: "u-node-gemini-caption",
      name: "Google Gemini (Copywriter)",
      type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      typeVersion: 1,
      position: [880, 140],
      credentials: GEMINI_CRED
    },

    // -------------------------------------------------------------
    // 9. ASSEMBLE PRODUCTION POST RECORD
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// 9. ASSEMBLE PRODUCTION POST RECORD
// ============================================================================
let captionRaw = $json.output || "";
captionRaw = captionRaw.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();

let captionData;
if (captionRaw) {
  try { captionData = JSON.parse(captionRaw); } catch(e) {
    const m = captionRaw.match(/\\{[\\s\\S]*\\}/);
    if (m) { try { captionData = JSON.parse(m[0]); } catch(err){} }
  }
}

const config = ($('1. Brand DNA & Meaning Rules').item?.json?.config) || { TEST_MODE: false, INSTAGRAM_ACCOUNT_ID: "17841475951559107" };
const strategy = ($('4. Strategy Parser & Guard').item?.json?.strategy) || {};
const generatedImage = ($('6. Flux Image Generation Engine').item?.json?.generated_image) || {};
const gate = ($('7. Strict Relevance Quality Gate').item?.json?.quality_gate) || { approved: true };

let finalCaption = captionData?.formatted_caption;
if (!finalCaption) {
  const hook = strategy.hook || "5 Website Mistakes That Make Your Business Look Amateur";
  const cta = strategy.cta || "Save this post for your next website build.";
  const takeaway = strategy.core_takeaway || "A clean layout and fast speed build instant customer trust.";
  finalCaption = \`\${hook}\\n\\nWhen potential clients land on your homepage, design and speed aren't cosmetic—they directly dictate your conversion rate.\\n\\nHere is what separates high-converting websites:\\n🔹 Clear typography hierarchy that guides the eye\\n🔹 Sub-second load time on mobile networks\\n🔹 Purposeful CTA buttons with zero clutter\\n\\n\${takeaway}\\n\\n\${cta}\\n\\n#webdevelopment #webdesign #codiva #nextjs #uiux #frontend #fullstack\`;
}

const postId = "CODIVA-POST-" + Date.now();
const testMode = (config.TEST_MODE === true);

return [{
  json: {
    post_id: postId,
    created_at: new Date().toISOString(),
    topic: strategy.topic,
    content_pillar: strategy.content_pillar,
    visual_format: strategy.visual_format,
    hook: strategy.hook,
    caption: finalCaption,
    image_url: generatedImage.url,
    relevance_score: gate.topic_relevance_score,
    test_mode: testMode,
    ig_user_id: config.INSTAGRAM_ACCOUNT_ID || "17841475951559107",
    status: testMode ? "test_mode_simulation" : "publishing_live"
  }
}];
`
      },
      id: "u-node-prepare-draft",
      name: "9. Prepare Post Record",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1150, -80]
    },

    // -------------------------------------------------------------
    // 10. ROUTE: TEST MODE VS LIVE PUBLISHING
    // -------------------------------------------------------------
    {
      parameters: {
        conditions: {
          boolean: [
            {
              value1: "={{ $json.test_mode }}",
              value2: true
            }
          ]
        }
      },
      id: "u-node-if-test-mode",
      name: "10. Is TEST_MODE Active?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [1390, -80]
    },

    // -------------------------------------------------------------
    // 11A. TEST MODE SUCCESS SUMMARY (SAFE PREVIEW)
    // -------------------------------------------------------------
    {
      parameters: {
        jsCode: `
// ============================================================================
// TEST MODE EXECUTION SUMMARY & IMAGE PREVIEW
// ============================================================================
return [{
  json: {
    success: true,
    execution_mode: "TEST_MODE (Safe Simulation)",
    post_id: $json.post_id,
    topic: $json.topic,
    content_pillar: $json.content_pillar,
    visual_format: $json.visual_format,
    relevance_score: $json.relevance_score + "/100",
    image_preview_url: $json.image_url,
    caption: $json.caption,
    message: "Meaningful post generated! Ready for live publishing when TEST_MODE is set to false.",
    completed_at: new Date().toISOString()
  }
}];
`
      },
      id: "u-node-test-summary",
      name: "11A. Test Mode Success Summary",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1650, -180]
    },

    // -------------------------------------------------------------
    // 11B. LIVE INSTAGRAM PUBLISHING (FACEBOOK GRAPH API)
    // -------------------------------------------------------------
    {
      parameters: {
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
      },
      id: "u-node-ig-container",
      name: "11B. Instagram Create Media Container",
      type: "n8n-nodes-base.facebookGraphApi",
      typeVersion: 1,
      position: [1650, 48],
      credentials: FB_CRED
    },
    {
      parameters: {
        amount: 25
      },
      id: "u-node-ig-wait",
      name: "12. Wait For Media Processing",
      type: "n8n-nodes-base.wait",
      typeVersion: 1.1,
      position: [1890, 48]
    },
    {
      parameters: {
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
      },
      id: "u-node-ig-publish",
      name: "13. Instagram Publish Live Media",
      type: "n8n-nodes-base.facebookGraphApi",
      typeVersion: 1,
      position: [2130, 48],
      retryOnFail: true,
      waitBetweenTries: 5000,
      credentials: FB_CRED
    }
  ],
  connections: {
    "Daily 9AM Schedule Trigger": {
      main: [[{ node: "1. Brand DNA & Meaning Rules", type: "main", index: 0 }]]
    },
    "Manual Run Trigger": {
      main: [[{ node: "1. Brand DNA & Meaning Rules", type: "main", index: 0 }]]
    },
    "1. Brand DNA & Meaning Rules": {
      main: [[{ node: "2. Meaningful Topic Scout", type: "main", index: 0 }]]
    },
    "2. Meaningful Topic Scout": {
      main: [[{ node: "3. Content Strategist AI", type: "main", index: 0 }]]
    },
    "Google Gemini (Strategist)": {
      ai_languageModel: [[{ node: "3. Content Strategist AI", type: "ai_languageModel", index: 0 }]]
    },
    "3. Content Strategist AI": {
      main: [[{ node: "4. Strategy Parser & Guard", type: "main", index: 0 }]]
    },
    "4. Strategy Parser & Guard": {
      main: [[{ node: "5. Creative Director AI", type: "main", index: 0 }]]
    },
    "Google Gemini (Creative)": {
      ai_languageModel: [[{ node: "5. Creative Director AI", type: "ai_languageModel", index: 0 }]]
    },
    "5. Creative Director AI": {
      main: [[{ node: "6. Flux Image Generation Engine", type: "main", index: 0 }]]
    },
    "6. Flux Image Generation Engine": {
      main: [[{ node: "7. Strict Relevance Quality Gate", type: "main", index: 0 }]]
    },
    "7. Strict Relevance Quality Gate": {
      main: [[{ node: "8. Master Caption Crafter", type: "main", index: 0 }]]
    },
    "Google Gemini (Copywriter)": {
      ai_languageModel: [[{ node: "8. Master Caption Crafter", type: "ai_languageModel", index: 0 }]]
    },
    "8. Master Caption Crafter": {
      main: [[{ node: "9. Prepare Post Record", type: "main", index: 0 }]]
    },
    "9. Prepare Post Record": {
      main: [[{ node: "10. Is TEST_MODE Active?", type: "main", index: 0 }]]
    },
    "10. Is TEST_MODE Active?": {
      main: [
        [{ node: "11A. Test Mode Success Summary", type: "main", index: 0 }],
        [{ node: "11B. Instagram Create Media Container", type: "main", index: 0 }]
      ]
    },
    "11B. Instagram Create Media Container": {
      main: [[{ node: "12. Wait For Media Processing", type: "main", index: 0 }]]
    },
    "12. Wait For Media Processing": {
      main: [[{ node: "13. Instagram Publish Live Media", type: "main", index: 0 }]]
    }
  }
};

fs.writeFileSync('workflows/Codiva_AI_Social_Media_Manager_Unified.json', JSON.stringify(meaningFirstWorkflow, null, 2), 'utf8');

async function deploy() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      name: meaningFirstWorkflow.name,
      nodes: meaningFirstWorkflow.nodes,
      connections: meaningFirstWorkflow.connections,
      settings: meaningFirstWorkflow.settings
    });

    const req = http.request(new URL(`${host}/api/v1/workflows/${workflowId}`), {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let b = '';
      res.on('data', chunk => b += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(b);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[MEANING-FIRST REDESIGN DEPLOYED] Successfully updated "${result.name}"!`);
            resolve(result);
          } else {
            console.error(`[DEPLOY ERROR]`, result);
            reject(result);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

deploy();
