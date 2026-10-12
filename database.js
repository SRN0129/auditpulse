/**
 * Autonomous Enterprise OS - Core Database Module
 * Uses Node.js 24 built-in synchronous SQLite (node:sqlite)
 * Zero external database cost, ACID compliance, instant local query speed
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const dbDir = process.env.VERCEL ? os.tmpdir() : __dirname;
const dbPath = path.join(dbDir, 'enterprise_os.db');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- Multi-Service Registry
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tier1_price INTEGER DEFAULT 499,
    tier2_price INTEGER DEFAULT 1299,
    status TEXT DEFAULT 'active', -- active, development, planned
    total_revenue INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Leads & Prospects
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    company_name TEXT,
    contact_email TEXT,
    source TEXT DEFAULT 'organic_scan', -- organic_scan, hunter_agent, direct
    health_score INTEGER,
    top_pain_point TEXT,
    outreach_status TEXT DEFAULT 'pending', -- pending, preview_sent, converted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Scans & Teardowns
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    health_score INTEGER NOT NULL,
    speed_score INTEGER,
    copy_score INTEGER,
    mobile_score INTEGER,
    trust_score INTEGER,
    snapshot_json TEXT NOT NULL, -- 3 red flags for free preview
    full_report_json TEXT NOT NULL, -- Complete 50-point report
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Orders & Checkout
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    scan_id TEXT,
    target_url TEXT,
    customer_email TEXT,
    amount_inr INTEGER NOT NULL,
    tier TEXT DEFAULT 'starter', -- starter (₹499/₹299), pro (₹1299)
    status TEXT DEFAULT 'pending_payment', -- pending_payment, paid, fulfilled
    upi_ref_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  );

  -- Financial Controller Ledger (4-Bucket Accounting)
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE,
    service_id TEXT,
    gross_amount INTEGER NOT NULL,
    fee_amount INTEGER DEFAULT 0, -- UPI is 0%
    net_amount INTEGER NOT NULL,
    ops_reserve INTEGER NOT NULL,      -- 40%
    growth_budget INTEGER NOT NULL,    -- 30% (Autonomous Expansion Wallet)
    owner_surplus INTEGER NOT NULL,    -- 30% (Owner Distributable Profit)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Survival State & Biological Urgency Tracker
  CREATE TABLE IF NOT EXISTS survival_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Agent Activity & Telemetry Log
  CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    level TEXT DEFAULT 'INFO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- C-Suite & Autonomous Agents Registry
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    system_prompt TEXT,
    actions_count INTEGER DEFAULT 0,
    last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Outreach Campaigns & Cold Email Pitches
  CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    domain TEXT,
    recipient_email TEXT,
    subject TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    channel TEXT DEFAULT 'cold_email',
    status TEXT DEFAULT 'draft', -- draft, queued, dispatched, converted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Autonomous UI/UX Design Evolution Variants
  CREATE TABLE IF NOT EXISTS design_variants (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- hero_headline, cta_hook, engagement_pill
    content TEXT NOT NULL,
    conversion_score REAL DEFAULT 0.0,
    is_active INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Owner Digital Wallet Withdrawals Ledger
  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    destination_vpa TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    owner_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Secure Owner Digital Wallet Settings
  CREATE TABLE IF NOT EXISTS wallet_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Social Marketing Autopilot Posts (Twitter / Reddit / LinkedIn)
  CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL, -- twitter, reddit, linkedin
    target_subreddit TEXT, -- r/ecommerce, r/shopify
    title TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'queued', -- queued, published, failed
    published_at DATETIME,
    external_post_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Social Media API Credentials (Twitter & Reddit)
  CREATE TABLE IF NOT EXISTS social_credentials (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Email Dispatcher Configurations (Resend / Brevo / SMTP)
  CREATE TABLE IF NOT EXISTS email_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Verified Customers (Gating Free Diagnostic)
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    auth_provider TEXT DEFAULT 'email',
    google_id TEXT,
    avatar_url TEXT,
    verified INTEGER DEFAULT 1,
    scans_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  -- Promotional & Drip Email Logs
  CREATE TABLE IF NOT EXISTS promotional_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT,
    email TEXT NOT NULL,
    campaign_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Autonomous Business Expansion Ventures
  CREATE TABLE IF NOT EXISTS ventures (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    niche TEXT NOT NULL,
    description TEXT,
    target_audience TEXT,
    tier1_price INTEGER DEFAULT 499,
    tier2_price INTEGER DEFAULT 1499,
    status TEXT DEFAULT 'evaluating',
    total_revenue INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Autonomous Capital & Budget Requisitions
  CREATE TABLE IF NOT EXISTS capital_requisitions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    venture_id TEXT,
    venture_name TEXT NOT NULL,
    amount_requested INTEGER NOT NULL,
    rationale TEXT NOT NULL,
    expected_roi TEXT NOT NULL,
    approval_token TEXT NOT NULL,
    status TEXT DEFAULT 'pending_approval',
    owner_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME
  );

  -- Autonomous Self-Audit & Self-Improvement Engine History
  CREATE TABLE IF NOT EXISTS self_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_url TEXT NOT NULL,
    overall_score INTEGER NOT NULL,
    speed_score INTEGER NOT NULL,
    copy_score INTEGER NOT NULL,
    mobile_score INTEGER NOT NULL,
    trust_score INTEGER NOT NULL,
    security_score INTEGER NOT NULL,
    leaks_found_count INTEGER NOT NULL,
    improvements_applied TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migrations for customers table
try { db.exec("ALTER TABLE customers ADD COLUMN auth_provider TEXT DEFAULT 'email'"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN google_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE customers ADD COLUMN avatar_url TEXT"); } catch (e) {}

// Rewire All C-Suite Agents (Sole Mandate: Aggressive, Sustainable Revenue & Wealth Creation)
const upsertAgent = db.prepare(`
  INSERT INTO agents (id, name, role, status, system_prompt)
  VALUES (?, ?, ?, 'active', ?)
  ON CONFLICT(id) DO UPDATE SET 
    name = excluded.name, 
    role = excluded.role, 
    system_prompt = excluded.system_prompt
`);

upsertAgent.run(
  'ceo',
  'MASTER CEO AGENT',
  'Chief Executive Officer & Head of Revenue',
  'SOLE MANDATE: MAXIMIZE IMMEDIATE AND LONG-TERM CASH ACCUMULATION FOR THE HUMAN OWNER. Every operational action must drive paying customer orders, convert website leads, eliminate non-revenue overhead, and grow the owner distributable surplus with zero debt.'
);
upsertAgent.run(
  'hr',
  'HR AGENT',
  'Head of Workforce Monetization & Governance',
  'SOLE MANDATE: Direct 100% of autonomous workforce capacity toward commercial output. Dynamically provision specialized money-making subagents and eliminate idle compute.'
);
upsertAgent.run(
  'agent_manager',
  'AGENT MANAGER AGENT',
  'Chief Operating Officer & Pipeline Controller',
  'SOLE MANDATE: Ensure uninterrupted 24/7 autonomous pipeline operations. Eliminate bottlenecks in lead harvesting, cold email dispatching, and checkout fulfillment so zero customer revenue is dropped.'
);
upsertAgent.run(
  'finance',
  'FINANCE EXPERT AGENT',
  'Chief Financial Officer & Margin Maximizer',
  'SOLE MANDATE: Safeguard 100% gross margins and 0% intermediary fee leakage via direct UPI. Reconcile the 4-bucket ledger, maximize available owner withdrawal cash, and audit growth capital.'
);
upsertAgent.run(
  'design_evolver',
  'DESIGN EVOLVER AGENT',
  'Chief Product Officer & Conversion Rate Maximizer',
  'SOLE MANDATE: Ruthless conversion rate optimization (CRO). Every pixel, headline, and CTA on the storefront must compel visitors to sign up, unlock audits, and buy the ₹299/₹1,299 full report.'
);
upsertAgent.run(
  'marketing',
  'MARKETING & OUTREACH AGENT',
  'Chief Marketing Officer & Revenue Generation Lead',
  'SOLE MANDATE: Acquire paying e-commerce customers at zero advertising cost. Autonomously dispatch personalized cold teardowns, publish viral acquisition content on Twitter/Reddit, and send promotional drip campaigns to all registered customers.'
);
upsertAgent.run(
  'expansion',
  'BUSINESS EXPANSION AGENT',
  'Chief Venture Architect & Multi-Entity Expansion Lead',
  'SOLE MANDATE: Scale enterprise income streams beyond AuditPulse. Identify high-margin digital business verticals, architect new venture offerings, route all revenue through the owner\'s centralized zero-commission UPI gateway, and submit capital requisitions for owner approval.'
);
upsertAgent.run(
  'support',
  'CUSTOMER SUPPORT AGENT',
  'Head of Instant Live Chat & Client Success',
  'SOLE MANDATE: Assist store visitors and customers 24/7 with instant, intelligent answers to inquiries regarding website diagnostics, 50-point report deliverables, pricing (₹299), zero-fee UPI checkout, and turnaround time to maximize buyer conversions and retention.'
);
upsertAgent.run(
  'self_audit',
  'SELF-HEALING CRO AGENT',
  'Chief Storefront Auditor & Self-Optimization Lead',
  'SOLE MANDATE: Continuously audit AuditPulse\'s own public website using deep DOM and performance heuristics. Identify friction, Cumulative Layout Shift (CLS), copy clarity issues, and security headers, and autonomously deploy iterative optimizations to maximize visitor-to-paid conversion.'
);

// Seed Initial Expansion Ventures if empty
const checkVentures = db.prepare('SELECT COUNT(*) as count FROM ventures').get();
if (checkVentures.count === 0) {
  const insertVenture = db.prepare(`
    INSERT INTO ventures (id, name, tagline, niche, description, target_audience, tier1_price, tier2_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertVenture.run(
    'vtr_speedpulse',
    'SpeedPulse Engine',
    'Sub-Second Mobile Core Web Vitals Optimization',
    'Shopify Performance',
    'Automated code-stripping, lazy loading, and script deferral pack that slashes mobile load time under 1.5 seconds to directly boost Meta ROAS.',
    'Shopify & WooCommerce stores spending ₹2L+/month on ads',
    799,
    2499,
    'proposed'
  );
  insertVenture.run(
    'vtr_copyscribe',
    'CopyScribe AI',
    'Direct-Response Product Page Copywriting Sprint',
    'E-Commerce Copywriting',
    'High-converting hook, benefit matrix, and objection-busting FAQ rewriting tailored for impulse D2C buyers.',
    'D2C brands with high add-to-cart dropoffs',
    499,
    1499,
    'proposed'
  );
  insertVenture.run(
    'vtr_retentionpulse',
    'RetentionPulse',
    'Post-Purchase LTV & WhatsApp Flow Architecture',
    'Customer Retention',
    'Automated abandoned-cart recovery and repeat-purchase VIP flows on WhatsApp & email to maximize second-order value.',
    'Growing apparel, beauty, and wellness brands',
    999,
    2999,
    'evaluating'
  );
}

// Seed initial Design Evolution Variants
const checkDesign = db.prepare('SELECT COUNT(*) as count FROM design_variants').get();
if (checkDesign.count === 0) {
  const insertDesign = db.prepare(`
    INSERT INTO design_variants (id, category, content, is_active)
    VALUES (?, ?, ?, ?)
  `);
  insertDesign.run(
    'var_h1_1',
    'hero_headline',
    'Stop Leaking Ad Traffic. Discover Your Top 3 Conversion Killers In 30 Seconds.',
    1
  );
  insertDesign.run(
    'var_h1_2',
    'hero_headline',
    'Why Are 97% Of Your Mobile Visitors Leaving Without Buying? Get Your Instant Teardown.',
    0
  );
  insertDesign.run(
    'var_cta_1',
    'cta_hook',
    'Audit My Website Free ⚡',
    1
  );
  insertDesign.run(
    'var_cta_2',
    'cta_hook',
    'Reveal My Leaking Revenue →',
    0
  );
}

// Seed default service if empty
const checkService = db.prepare('SELECT COUNT(*) as count FROM services').get();
if (checkService.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (id, name, description, tier1_price, tier2_price, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertService.run(
    'auditpulse',
    'AuditPulse CRO & Performance Teardown',
    'Autonomous conversion rate optimization & speed diagnostic engine for e-commerce and landing pages.',
    499,
    1299,
    'active'
  );
  insertService.run(
    'leadgenie',
    'LeadGenie B2B Prospect Finder',
    'High-ticket outbound lead enrichment and automated pitch customization (Expansion Service #2).',
    1499,
    2999,
    'planned'
  );
  insertService.run(
    'policyforge',
    'PolicyForge Digital Compliance Kit',
    'Complete DPDP Act 2023 / GDPR website compliance terms, privacy & refund policies (Expansion Service #3).',
    999,
    1999,
    'planned'
  );
}

// Seed default survival state if empty
const checkState = db.prepare('SELECT COUNT(*) as count FROM survival_state').get();
if (checkState.count === 0) {
  const insertState = db.prepare('INSERT INTO survival_state (key, value) VALUES (?, ?)');
  insertState.run('status', 'CRITICAL_RED'); // CRITICAL_RED (₹0 revenue), AMBER, GREEN
  insertState.run('launch_timestamp', new Date().toISOString());
  insertState.run('last_sale_timestamp', 'none');
  insertState.run('total_revenue', '0');
  insertState.run('active_experiment', 'launch_tripwire_299'); // adaptive price test
}

function hashOwnerPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim() + ':auditpulse_secure_salt_2026').digest('hex');
}

// Seed default secure wallet settings if empty
const checkWallet = db.prepare('SELECT COUNT(*) as count FROM wallet_settings').get();
if (checkWallet.count === 0) {
  const insertWallet = db.prepare('INSERT INTO wallet_settings (key, value) VALUES (?, ?)');
  insertWallet.run('owner_pin_hash', hashOwnerPin('7799'));
  insertWallet.run('receiving_vpa', '7735818294@slc');
  insertWallet.run('receiving_name', 'AuditPulse Digital Services');
  insertWallet.run('auto_payout_enabled', '0');
}

// Seed default email dispatcher configuration if empty
const checkEmail = db.prepare('SELECT COUNT(*) as count FROM email_config').get();
if (checkEmail.count === 0) {
  const insertEmail = db.prepare('INSERT INTO email_config (key, value) VALUES (?, ?)');
  insertEmail.run('provider_type', 'simulation'); // simulation, resend, brevo, smtp
  insertEmail.run('sender_email', 'support@auditpulse.in');
  insertEmail.run('sender_name', 'AuditPulse Official Support');
  insertEmail.run('resend_api_key', '');
  insertEmail.run('brevo_api_key', '');
  insertEmail.run('smtp_host', '');
  insertEmail.run('smtp_port', '587');
  insertEmail.run('smtp_user', '');
  insertEmail.run('smtp_pass', '');
} else {
  db.prepare("UPDATE email_config SET value = 'support@auditpulse.in' WHERE key = 'sender_email'").run();
  db.prepare("UPDATE email_config SET value = 'AuditPulse Official Support' WHERE key = 'sender_name'").run();
}

// Seed initial social autopilot posts if empty
const checkSocial = db.prepare('SELECT COUNT(*) as count FROM social_posts').get();
if (checkSocial.count === 0) {
  const insertPost = db.prepare(`
    INSERT INTO social_posts (id, platform, target_subreddit, title, content, status)
    VALUES (?, ?, ?, ?, ?, 'queued')
  `);
  
  insertPost.run(
    'PST-TW-001',
    'twitter',
    null,
    null,
    `We audited 50+ D2C brands spending ₹5L+/month on Meta ads.\n\nOver 82% of them were leaking at least 25% of their ad spend before visitors even scrolled.\n\nHere are the top 4 silent conversion killers (and the exact code fixes) 🧵👇\n\n1/ The 'Hidden Mobile CTA': Most themes place the "Buy Now" button 850px down on mobile. Result: 63% bounce before seeing it. Fix: Implement a sticky 1-tap mobile bottom bar (+14% immediate checkout starts).\n\n2/ Generic Headlines: "Premium Handcrafted Quality" tells visitors nothing. Shift to outcome promises.\n\nWant to know where your store is leaking revenue?\nInstant 30s free diagnostic: https://auditpulse-three.vercel.app`
  );

  insertPost.run(
    'PST-RD-001',
    'reddit',
    'r/ecommerce',
    'Free CRO Teardown: Dropping 5 comprehensive speed & conversion audits for fellow store owners today',
    `Hey everyone, I built an automated conversion diagnostic tool that analyzes page weight, mobile tap friction, and copywriting clarity.\n\nI want to give back to the community: Drop your store URL below, and I will run a 50-point teardown and reply with your top 2 revenue leaks and exact developer fixes for free!\n\nNo pitch, just actionable feedback. Try the instant engine yourself here: https://auditpulse-three.vercel.app`
  );

  insertPost.run(
    'PST-RD-002',
    'reddit',
    'r/shopify',
    'The 3 reasons why 97% of your paid mobile traffic leaves your Shopify store in 3 seconds',
    `Founders often assume their Meta CAC is high because of ad creative fatigue.\n\n9 out of 10 times, the ads aren't the problem — the mobile landing page experience is.\n\nHere are 3 quick fixes we routinely implement across client storefronts:\n1. Eliminate competing secondary buttons on mobile.\n2. Add loading="lazy" to uncompressed PNG banners (saves ~1.8s load time).\n3. State the primary transformation in the H1 headline.\n\nWe built an autonomous diagnostic engine at AuditPulse that reveals your store's top 3 friction points in 30 seconds for free: https://auditpulse-three.vercel.app`
  );
}

module.exports = {
  db,
  hashOwnerPin,
  logAgentAction: (agent_name, action, details = '', level = 'INFO') => {
    try {
      db.prepare('INSERT INTO agent_logs (agent_name, action, details, level) VALUES (?, ?, ?, ?)').run(
        agent_name,
        action,
        typeof details === 'object' ? JSON.stringify(details) : details,
        level
      );
    } catch (e) {
      console.error('Failed to log agent action:', e);
    }
  }
};
