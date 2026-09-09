-- =========================================================
-- Codiva AI Social Media Manager — PostgreSQL / Supabase Schema
-- =========================================================

-- 1. Brand Profile Table
CREATE TABLE IF NOT EXISTS brand_profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Codiva',
    description TEXT NOT NULL,
    industry VARCHAR(100) NOT NULL DEFAULT 'Web Development Agency',
    target_audience TEXT NOT NULL,
    tone VARCHAR(255) NOT NULL,
    visual_style TEXT NOT NULL,
    brand_colors JSONB NOT NULL DEFAULT '{"primary": "#0F172A", "accent": "#38BDF8", "secondary": "#6366F1", "background": "#0B0F19", "text": "#F8FAFC"}',
    content_pillars JSONB NOT NULL,
    content_mix JSONB NOT NULL,
    portfolio_projects JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Codiva Brand Profile
INSERT INTO brand_profile (
    name,
    description,
    industry,
    target_audience,
    tone,
    visual_style,
    brand_colors,
    content_pillars,
    content_mix,
    portfolio_projects
) VALUES (
    'Codiva',
    'Codiva is a premier web development agency creating modern, high-performance websites and bespoke digital experiences for businesses.',
    'Web Development Agency',
    'Business owners, tech startups, product managers, designers, and developers looking for high-quality web solutions.',
    'Modern, professional, creative, technically capable, trustworthy, premium, approachable, slightly witty when appropriate.',
    'Clean typography, dark modern interfaces, sleek gradients, minimal UI mockups, high contrast, vibrant accents, realistic developer/agency humor.',
    '{"primary": "#0F172A", "accent": "#38BDF8", "secondary": "#6366F1", "surface": "#1E293B", "text": "#F8FAFC"}',
    '["Web Development Education", "UI/UX & Web Design", "Technology & AI Trends", "Business & Website Advice", "Codiva Promotion", "Memes"]',
    '{"web_dev_education": 25, "ui_ux_design": 20, "tech_ai_trends": 15, "business_advice": 15, "codiva_promotion": 10, "memes": 15}',
    '[
        {"name": "Apex Real Estate Platform", "industry": "Real Estate", "tech": "Next.js, Tailwind, Supabase", "highlight": "High-converting modern property search portal with interactive maps"},
        {"name": "Lumina SaaS Dashboard", "industry": "B2B Software", "tech": "React, TypeScript, Node.js", "highlight": "Ultra-sleek dark mode analytics interface for enterprise SaaS"},
        {"name": "Nova Commerce", "industry": "E-Commerce", "tech": "Shopify Headless, Next.js", "highlight": "Sub-second load times and 40% increase in checkout conversions"}
    ]'
) ON CONFLICT DO NOTHING;

-- 2. Posts Table (Memory & Content Tracking)
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    topic VARCHAR(255) NOT NULL,
    content_pillar VARCHAR(100) NOT NULL,
    format VARCHAR(100) NOT NULL,
    hook TEXT,
    visual_concept TEXT,
    caption TEXT,
    hashtags TEXT[],
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending_approval, approved, rejected, publishing, published, failed
    instagram_media_id VARCHAR(100),
    quality_score NUMERIC(5,2),
    similarity_score NUMERIC(5,2),
    trend_score NUMERIC(5,2),
    creative_brief JSONB,
    qc_details JSONB,
    metadata JSONB DEFAULT '{}'
);

-- 3. Content Ideas Table
CREATE TABLE IF NOT EXISTS content_ideas (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    content_pillar VARCHAR(100),
    source VARCHAR(255),
    trend_score NUMERIC(5,2) DEFAULT 0,
    relevance_score NUMERIC(5,2) DEFAULT 0,
    instagram_score NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new', -- new, selected, discarded, used
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Visual History Table (For Visual Diversity Enforcement)
CREATE TABLE IF NOT EXISTS visual_history (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    visual_style VARCHAR(100),
    composition VARCHAR(100),
    color_direction VARCHAR(100),
    subject VARCHAR(100),
    format VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Analytics Table (Performance Metrics)
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    shares INT DEFAULT 0,
    saves INT DEFAULT 0,
    reach INT DEFAULT 0,
    impressions INT DEFAULT 0,
    profile_visits INT DEFAULT 0,
    engagement_rate NUMERIC(5,2) DEFAULT 0,
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Strategy Insights Table (Closed-Loop Learning)
CREATE TABLE IF NOT EXISTS strategy_insights (
    id SERIAL PRIMARY KEY,
    period VARCHAR(50),
    best_pillars JSONB DEFAULT '[]',
    best_formats JSONB DEFAULT '[]',
    best_topics JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Execution Logs Table
CREATE TABLE IF NOT EXISTS execution_logs (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(100),
    stage VARCHAR(100),
    status VARCHAR(50),
    input JSONB,
    output JSONB,
    error TEXT,
    duration_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & quick similarity lookup
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_pillar ON posts(content_pillar);
