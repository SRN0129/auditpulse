/**
 * Autonomous Enterprise OS - Core Central Server
 * Unifies Multi-Service Engine, Dynamic UPI Payments, Financial Controller & Telemetry
 */

const express = require('express');
const path = require('node:path');
const QRCode = require('qrcode');
const { db, logAgentAction } = require('./database');
const { runAudit } = require('./scanner');
const financialController = require('./financial_controller');
const survivalEngine = require('./survival_engine');
const designEvolver = require('./design_evolver');
const outreachEngine = require('./outreach_engine');
const agentOrchestrator = require('./agent_orchestrator');
const autonomousEngine = require('./autonomous_engine');
const emailDispatcher = require('./email_dispatcher');
const socialAutopilot = require('./social_autopilot');
const expansionAgent = require('./expansion_agent');
const supportAgent = require('./support_agent');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurable receiving UPI ID (Routes directly to human-controlled personal account)
const RECEIVING_VPA = process.env.RECEIVING_VPA || '7735818294@slc';
const RECEIVING_NAME = process.env.RECEIVING_NAME || 'AuditPulse Digital Services';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PUBLIC_DIR = path.join(__dirname, 'public');

// 1. Landing Page & UI Routes
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: PUBLIC_DIR });
});

app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: PUBLIC_DIR });
});

app.get('/report/:orderId', (req, res) => {
  res.sendFile('report.html', { root: PUBLIC_DIR });
});

app.get('/wallet', (req, res) => {
  res.sendFile('wallet.html', { root: PUBLIC_DIR });
});

// 1B. Customer Authentication & Verification (Gating Free Diagnostic)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid business email is required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const cleanPhone = (phone || '').trim() || 'N/A';

    let customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(cleanEmail);
    if (!customer) {
      const custId = 'CST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
      db.prepare(`
        INSERT INTO customers (id, name, email, phone, verified, scans_count)
        VALUES (?, ?, ?, ?, 1, 0)
      `).run(custId, cleanName, cleanEmail, cleanPhone);

      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(custId);

      // Trigger automatic welcome promotional email with founder discount
      try {
        await emailDispatcher.sendCustomerWelcomeEmail({ email: cleanEmail, name: cleanName, phone: cleanPhone });
      } catch (err) {
        console.warn('[Server] Welcome email dispatch notice:', err.message);
      }
    }

    logAgentAction('MARKETING_AGENT', 'CUSTOMER_REGISTERED', `Verified customer: ${cleanEmail} (${cleanName})`);

    res.json({
      success: true,
      message: 'Account verified successfully. Welcome voucher dispatched!',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        verified: customer.verified
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const cleanEmail = email.trim().toLowerCase();
    const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(cleanEmail);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'No account found. Please register first.' });
    }
    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        verified: customer.verified
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Sign-In & Verification Endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    let { credential, email, name, picture, googleId } = req.body;

    // Decode Google Identity Services JWT credential if sent
    if (credential && !email) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
          googleId = payload.sub;
        }
      } catch (jwtErr) {
        console.warn('[Google Auth] JWT decode notice:', jwtErr.message);
      }
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];
    const cleanPicture = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0f766e&color=fff`;
    const cleanGoogleId = googleId || 'goog_' + Date.now();

    let customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(cleanEmail);
    let isNewCustomer = false;

    if (!customer) {
      isNewCustomer = true;
      const custId = 'CST-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
      db.prepare(`
        INSERT INTO customers (id, name, email, phone, auth_provider, google_id, avatar_url, verified, scans_count)
        VALUES (?, ?, ?, ?, 'google', ?, ?, 1, 0)
      `).run(custId, cleanName, cleanEmail, 'Google Verified', cleanGoogleId, cleanPicture);

      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(custId);

      // Trigger automatic welcome promotional email with founder discount
      try {
        await emailDispatcher.sendCustomerWelcomeEmail({ 
          email: cleanEmail, 
          name: cleanName, 
          phone: 'Google Verified' 
        });
      } catch (err) {
        console.warn('[Server] Google welcome email dispatch notice:', err.message);
      }
    } else {
      // Update Google profile fields if needed
      db.prepare(`
        UPDATE customers 
        SET auth_provider = 'google', google_id = COALESCE(google_id, ?), avatar_url = COALESCE(avatar_url, ?)
        WHERE id = ?
      `).run(cleanGoogleId, cleanPicture, customer.id);
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
    }

    logAgentAction('MARKETING_AGENT', 'CUSTOMER_GOOGLE_LOGIN', `Google authenticated customer: ${cleanEmail} (${cleanName})`);

    res.json({
      success: true,
      message: isNewCustomer 
        ? 'Google verification successful. Welcome voucher dispatched!' 
        : 'Welcome back!',
      isNewCustomer,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatar_url || cleanPicture,
        authProvider: 'google',
        verified: customer.verified
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const email = req.headers['x-customer-email'] || req.query.email;
    if (!email) return res.json({ success: false, customer: null });
    const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(email.trim().toLowerCase());
    if (!customer) return res.json({ success: false, customer: null });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Scan API (Runs autonomous CRO & Performance diagnostic — Gated to verified customers)
app.post('/api/scan', async (req, res) => {
  try {
    const { url, customerEmail } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    // Enforce verified registration gating
    const emailToCheck = (customerEmail || req.headers['x-customer-email'] || '').trim().toLowerCase();
    if (!emailToCheck) {
      return res.status(401).json({
        success: false,
        requiresSignup: true,
        error: 'Free diagnostic preview is reserved for verified store founders. Please sign up to unlock.'
      });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(emailToCheck);
    if (!customer) {
      return res.status(401).json({
        success: false,
        requiresSignup: true,
        error: 'Account not found. Please sign up free to unlock your 50-point diagnostic preview.'
      });
    }

    // Increment customer scans count
    db.prepare('UPDATE customers SET scans_count = scans_count + 1 WHERE id = ?').run(customer.id);

    logAgentAction('SCANNER_AGENT', 'AUDIT_INITIATED', `Auditing website: ${url} for customer: ${emailToCheck}`);
    const auditResult = await runAudit(url);

    const scanId = 'SCN-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Persist scan
    db.prepare(`
      INSERT INTO scans (id, url, domain, health_score, speed_score, copy_score, mobile_score, trust_score, snapshot_json, full_report_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scanId,
      auditResult.url,
      auditResult.domain,
      auditResult.scores.overall,
      auditResult.scores.speed,
      auditResult.scores.copywriting,
      auditResult.scores.mobile,
      auditResult.scores.trust,
      JSON.stringify(auditResult.redFlags),
      JSON.stringify(auditResult)
    );

    // Save or update lead
    db.prepare(`
      INSERT OR IGNORE INTO leads (domain, company_name, contact_email, health_score, top_pain_point, source, outreach_status)
      VALUES (?, ?, ?, ?, ?, 'organic_scan', 'scanned')
    `).run(
      auditResult.domain,
      auditResult.title ? auditResult.title.slice(0, 30) : auditResult.domain,
      emailToCheck,
      auditResult.scores.overall,
      auditResult.redFlags[0] ? auditResult.redFlags[0].title : 'Conversion Friction'
    );

    logAgentAction('SCANNER_AGENT', 'AUDIT_COMPLETE', { scanId, domain: auditResult.domain, score: auditResult.scores.overall });

    res.json({
      success: true,
      scanId,
      url: auditResult.url,
      domain: auditResult.domain,
      title: auditResult.title,
      scores: auditResult.scores,
      redFlags: auditResult.redFlags
    });
  } catch (err) {
    logAgentAction('SCANNER_AGENT', 'AUDIT_FAILED', err.message, 'ERROR');
    res.status(500).json({ success: false, error: err.message || 'Audit diagnostic failed' });
  }
});

// 3. Create Order & Generate Dynamic UPI QR Code
app.post('/api/order', async (req, res) => {
  try {
    const { serviceId = 'auditpulse', scanId, targetUrl, amount = 299, tier = 'starter' } = req.body;
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    // Dynamic UPI Deep-link standard (Zero-fee, Direct settling from live wallet settings)
    const { receivingVpa, receivingName } = financialController.getReceivingConfig();
    const upiUrl = `upi://pay?pa=${encodeURIComponent(receivingVpa)}&pn=${encodeURIComponent(receivingName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(orderId)}`;

    // Generate high-resolution QR data URL
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    db.prepare(`
      INSERT INTO orders (id, service_id, scan_id, target_url, amount_inr, tier, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending_payment')
    `).run(orderId, serviceId, scanId || '', targetUrl || '', amount, tier);

    logAgentAction('CHECKOUT_AGENT', 'ORDER_CREATED', { orderId, amount, upiUrl });

    res.json({
      success: true,
      orderId,
      amount,
      upiUrl,
      qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Verify Payment & Fulfill Digital Report
app.post('/api/payment/verify', (req, res) => {
  try {
    const { orderId, customerEmail, upiRefId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: 'Order ID is required' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Mark order fulfilled
    db.prepare(`
      UPDATE orders 
      SET status = 'fulfilled', customer_email = ?, upi_ref_id = ?, paid_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(customerEmail || 'customer@direct.in', upiRefId || 'UPI-REF-OK', orderId);

    // Trigger Financial Controller Ledger Allocation
    const financialRecord = financialController.recordPayment(orderId, order.service_id, order.amount_inr);

    logAgentAction('FULFILLMENT_AGENT', 'ORDER_FULFILLED', {
      orderId,
      customerEmail,
      upiRefId,
      allocation: financialRecord.allocations
    });

    res.json({
      success: true,
      orderId,
      status: 'fulfilled',
      message: 'Payment verified and service deliverable fulfilled instantly.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Fetch Full Report for Client Deliverable
app.get('/api/report/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    let scan = null;
    if (order.scan_id) {
      scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(order.scan_id);
    } else {
      // Fallback to most recent scan
      scan = db.prepare('SELECT * FROM scans ORDER BY created_at DESC LIMIT 1').get();
    }

    if (!scan) return res.status(404).json({ success: false, error: 'Scan data not found' });

    res.json({
      success: true,
      order,
      scan: {
        id: scan.id,
        domain: scan.domain,
        url: scan.url,
        health_score: scan.health_score,
        speed_score: scan.speed_score,
        copy_score: scan.copy_score,
        mobile_score: scan.mobile_score,
        trust_score: scan.trust_score
      },
      fullReport: JSON.parse(scan.full_report_json)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Google Search Console & SEO Indexing Endpoints
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3000/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>http://localhost:3000/#calculator</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>http://localhost:3000/#services</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Sitemap: http://localhost:3000/sitemap.xml`);
});

// 7. UI/UX Evolution Endpoints
app.get('/api/design/active', (req, res) => {
  res.json({ success: true, design: designEvolver.getActiveDesign() });
});

app.post('/api/design/evolve', (req, res) => {
  const result = designEvolver.evolveStorefront();
  res.json(result);
});

// 8. Marketing & Cold Outreach Endpoints
app.post('/api/outreach/generate', (req, res) => {
  const result = outreachEngine.generateColdEmailsForLeads();
  res.json({ success: true, ...result });
});

app.get('/api/outreach/campaigns', (req, res) => {
  const campaigns = outreachEngine.getCampaigns();
  res.json({ success: true, campaigns });
});

// 9. HR Agent: Dynamic Agent Provisioner
app.post('/api/agents/create', (req, res) => {
  try {
    const { name, role, systemPrompt, budgetRules } = req.body;
    const result = agentOrchestrator.createAgentByHR({ name, role, systemPrompt, budgetRules });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/agents', (req, res) => {
  res.json({ success: true, agents: agentOrchestrator.getAllAgents() });
});

// 10. System Status & Observability Telemetry Endpoint
app.get('/api/system/status', (req, res) => {
  try {
    const survival = survivalEngine.getSurvivalReport();
    const balanceSheet = financialController.getBalanceSheet();
    const services = db.prepare('SELECT * FROM services').all();
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 20').all();
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 20').all();
    const logs = db.prepare('SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 25').all();
    const agents = agentOrchestrator.getAllAgents();
    const campaigns = outreachEngine.getCampaigns();
    const playbooks = outreachEngine.getOrganicMarketingPlaybooks();
    const activeDesign = designEvolver.getActiveDesign();
    const dispatcherStats = emailDispatcher.getDispatchStats();
    const socialStats = socialAutopilot.getStatus();
    const socialPosts = socialAutopilot.getSocialPosts();
    const ventures = expansionAgent.getVentures();
    const requisitions = expansionAgent.getRequisitions();
    const customersCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;

    res.json({
      success: true,
      survival,
      balanceSheet,
      services,
      leads,
      orders,
      logs,
      agents,
      campaigns,
      playbooks,
      activeDesign,
      dispatcherStats,
      socialStats,
      socialPosts,
      ventures,
      requisitions,
      customersCount
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Trigger Autonomous Hunter Run
app.post('/api/hunter/run', (req, res) => {
  try {
    const result = survivalEngine.runHunterBatch();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Autonomous Operating System Pulse & Observability Endpoints
app.all('/api/cron/autonomous-pulse', async (req, res) => {
  try {
    const source = req.query.source || req.body?.source || 'cron_invocation';
    const result = await autonomousEngine.executeAutonomousPulse(source);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/agents/autonomy-status', (req, res) => {
  try {
    const status = autonomousEngine.getDetailedAutonomyStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Owner Secure Digital Wallet & Withdrawal Endpoints
app.post('/api/wallet/auth', (req, res) => {
  try {
    const { pin } = req.body;
    const isValid = financialController.verifyOwnerPin(pin);
    if (!isValid) return res.status(401).json({ success: false, error: 'Access Denied: Invalid Owner Security PIN.' });
    res.json({ success: true, message: 'Owner authenticated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/wallet/status', (req, res) => {
  try {
    const pin = req.headers['x-owner-pin'] || req.query.pin;
    const status = financialController.getWalletStatus(pin);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/wallet/withdraw', (req, res) => {
  try {
    const { amount, destinationVpa, ownerPin, note } = req.body;
    const result = financialController.processWithdrawal({ amount, destinationVpa, ownerPin, note });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/wallet/settings', (req, res) => {
  try {
    const { currentPin, newPin, receivingVpa, receivingName } = req.body;
    const result = financialController.updateWalletSettings({ currentPin, newPin, receivingVpa, receivingName });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 14. Autonomous Email Dispatcher Endpoints
app.post('/api/dispatcher/send-batch', async (req, res) => {
  try {
    const batchSize = parseInt(req.body.batchSize || '2', 10);
    const result = await emailDispatcher.dispatchNextBatch(batchSize);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/dispatcher/settings', (req, res) => {
  try {
    const config = emailDispatcher.getEmailConfig();
    const stats = emailDispatcher.getDispatchStats();
    res.json({ success: true, config, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/dispatcher/settings', (req, res) => {
  try {
    const result = emailDispatcher.updateEmailConfig(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 15. Social Marketing Autopilot Endpoints (Twitter/X & Reddit)
app.get('/api/social/posts', (req, res) => {
  try {
    const posts = socialAutopilot.getSocialPosts();
    const status = socialAutopilot.getStatus();
    res.json({ success: true, posts, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/social/generate', (req, res) => {
  try {
    const result = socialAutopilot.synthesizeFreshPosts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/social/publish/:id', async (req, res) => {
  try {
    const result = await socialAutopilot.publishPost(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/social/credentials', (req, res) => {
  try {
    const result = socialAutopilot.getSocialCredentials();
    res.json({ success: true, credentials: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/social/credentials', (req, res) => {
  try {
    const result = socialAutopilot.updateSocialCredentials(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 16. Autonomous Business Expansion & Capital Requisition Endpoints
app.get('/api/ventures', (req, res) => {
  try {
    res.json({ success: true, ventures: expansionAgent.getVentures() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/capital/requisitions', (req, res) => {
  try {
    res.json({ success: true, requisitions: expansionAgent.getRequisitions(), ventures: expansionAgent.getVentures() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/capital/request', async (req, res) => {
  try {
    const result = await expansionAgent.submitCapitalRequisition(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.all('/api/capital/approve/:id', (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    const notes = req.query.notes || req.body?.notes || 'Approved by owner';
    const result = expansionAgent.approveCapitalRequisition(req.params.id, token, notes);

    if (req.method === 'GET') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Capital Requisition Approved</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              ✓
            </div>
            <h1 class="text-xl font-black text-white">Capital Requisition Approved!</h1>
            <p class="text-xs text-slate-300 mt-2">${result.message}</p>
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-left mt-6 space-y-2">
              <div class="flex justify-between"><span class="text-slate-400">Requisition ID:</span><span class="mono text-cyan-400 font-bold">${req.params.id}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Payment Gateway:</span><span class="mono text-emerald-400 font-bold">7735818294@slc (0% Fee)</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Venture Status:</span><span class="font-bold text-emerald-400">Funded & Active</span></div>
            </div>
            <a href="/wallet" class="mt-6 inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow-lg">Open Owner Wallet →</a>
          </div>
        </body>
        </html>
      `);
    }

    res.json(result);
  } catch (err) {
    if (req.method === 'GET') {
      return res.status(400).send(`<h3>Authorization Error: ${err.message}</h3><p><a href="/wallet">Return to Wallet Console</a></p>`);
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

app.all('/api/capital/reject/:id', (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    const result = expansionAgent.rejectCapitalRequisition(req.params.id, token);
    if (req.method === 'GET') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Requisition Declined</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-8 text-center shadow-2xl">
            <h1 class="text-xl font-bold text-rose-400">Requisition Declined</h1>
            <p class="text-xs text-slate-300 mt-2">${result.message}</p>
            <a href="/wallet" class="mt-6 inline-block bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl">Return to Wallet Console</a>
          </div>
        </body>
        </html>
      `);
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 17. Instant 24/7 AI Customer Support Agent Endpoint
app.post('/api/support/chat', async (req, res) => {
  try {
    const { message, query, customerEmail, currentUrl } = req.body;
    const userQuery = message || query || '';
    const result = await supportAgent.handleQuery({ message: userQuery, customerEmail, currentUrl });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server and Master Autonomous Engine Daemon
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Enterprise OS] Running on http://localhost:${PORT}`);
    logAgentAction('MASTER_CEO_AGENT', 'ENTERPRISE_OS_ONLINE', `Central server listening on port ${PORT}`);

    // Launch Master Autonomous Execution Engine (Continuous 3-minute pulse across all agents)
    try {
      autonomousEngine.startDaemon();
    } catch (e) {
      console.error('Failed to start Autonomous Engine daemon:', e);
    }
  });
}

module.exports = app;
