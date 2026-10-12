/**
 * Autonomous Enterprise OS - 24/7 Instant Live Chat Support Agent
 * Role: Customer Success & Instant Conversion Assistant
 * Mandate: Answer customer and visitor queries instantly 24/7 with accurate,
 * helpful guidance regarding conversion teardowns, Core Web Vitals, pricing (₹299),
 * zero-fee UPI payments, and turnaround times to maximize trust and sales.
 */

const { db, logAgentAction } = require('./database');

class SupportAgent {
  constructor() {
    this.agentId = 'support';
    this.companyEmail = 'support@auditpulse.in';
    this.enterpriseEmail = 'contact@auditpulse.in';
  }

  // Answer customer query in real time
  async handleQuery({ message, customerEmail, currentUrl }) {
    if (!message || !message.trim()) {
      return {
        success: false,
        reply: "Hello! I'm the AuditPulse Support Assistant. How can I help you optimize your website today?"
      };
    }

    const query = message.trim().toLowerCase();
    let reply = "";
    let suggestedQuestions = [];

    // Intelligent Knowledge Base Routing
    if (query.includes('how') && (query.includes('work') || query.includes('scan') || query.includes('audit'))) {
      reply = "AuditPulse crawls your public storefront in real time with mobile user-agent headers. In 30 seconds, our diagnostic engine evaluates 4 critical pillars: Mobile Response Speed, Headline Hook Clarity, Tap Target UX, and Trust Signals, highlighting the exact friction points costing you conversions.";
      suggestedQuestions = [
        "What is in the ₹299 report?",
        "How long does it take?",
        "Can I scan my Shopify store?"
      ];
    } else if (query.includes('299') || query.includes('price') || query.includes('cost') || query.includes('blueprint') || query.includes('report')) {
      reply = "Our Executive Blueprint is a one-time ₹299 investment (discounted from ₹799). It includes:\n• 3 tailored headline rewrites engineered for your niche\n• Mobile thumb-zone and tap target UX breakdown\n• 50-point ranked developer remediation checklist\n• Interactive web dashboard & PDF export\n• 100% money-back guarantee with zero subscriptions or hidden fees.";
      suggestedQuestions = [
        "How do I pay with UPI?",
        "Is there a money-back guarantee?",
        "How fast is it delivered?"
      ];
    } else if (query.includes('upi') || query.includes('pay') || query.includes('payment') || query.includes('qr') || query.includes('google pay') || query.includes('phonepe')) {
      reply = "We accept all direct UPI apps (Google Pay, PhonePe, Paytm, and BHIM) with ₹0 fee markup. Simply scan the dynamic checkout QR code on your screen or use the UPI deep-link, complete the payment, and enter your UTR/Reference ID to unlock your blueprint immediately.";
      suggestedQuestions = [
        "What if my payment isn't verified?",
        "Can I get an invoice?",
        "What is the turnaround time?"
      ];
    } else if (query.includes('time') || query.includes('fast') || query.includes('delivery') || query.includes('when')) {
      reply = "Your initial diagnostic preview is ready in just 30 seconds! After completing the ₹299 order, the complete 50-point Executive Blueprint is synthesized and delivered directly in your browser and to your email within 2 to 3 minutes.";
      suggestedQuestions = [
        "Run free diagnostic now",
        "What is in the ₹299 report?",
        "Contact official support"
      ];
    } else if (query.includes('shopify') || query.includes('wordpress') || query.includes('woocommerce') || query.includes('platform')) {
      reply = "Yes! AuditPulse is fully optimized for Shopify, WooCommerce, Webflow, BigCommerce, Wix, and custom React/Next.js landing pages. We detect platform-specific assets and bottlenecks like uncompressed theme scripts and app bloat.";
      suggestedQuestions = [
        "How does the audit work?",
        "Can I get developer fixes?",
        "What is the pricing?"
      ];
    } else if (query.includes('refund') || query.includes('guarantee') || query.includes('money back')) {
      reply = "We offer a 100% no-questions-asked money-back guarantee. If our 50-point teardown doesn't give your team actionable, high-impact fixes for your conversion funnel, simply write to support@auditpulse.in for an immediate refund.";
      suggestedQuestions = [
        "What is the official email?",
        "What is in the ₹299 report?",
        "How do I pay with UPI?"
      ];
    } else if (query.includes('email') || query.includes('contact') || query.includes('support') || query.includes('phone') || query.includes('call') || query.includes('human')) {
      reply = `You can reach our official team anytime at:\n• Customer Support: ${this.companyEmail}\n• Enterprise & Agency Inquiries: ${this.enterpriseEmail}\nOur team monitors tickets 24/7 and responds within 2 hours.`;
      suggestedQuestions = [
        "How does the audit work?",
        "What is the ₹299 blueprint?",
        "How do I scan my website?"
      ];
    } else if (query.includes('free') || query.includes('trial') || query.includes('test')) {
      reply = "Yes! The initial conversion diagnostic is 100% free. Simply sign in with your Google account or work email to verify access, and you'll get your overall conversion score and 3 primary red-flag friction points instantly.";
      suggestedQuestions = [
        "Run free diagnostic",
        "What is in the ₹299 report?",
        "What is the turnaround time?"
      ];
    } else {
      reply = "Thanks for asking! AuditPulse delivers instant website conversion rate and mobile speed teardowns in 30 seconds. You can run your free diagnostic on the homepage or unlock our full 50-point Executive Blueprint for ₹299. If you need dedicated assistance, feel free to write to support@auditpulse.in anytime!";
      suggestedQuestions = [
        "How does the audit work?",
        "What is included in the ₹299 report?",
        "How do I pay with UPI?",
        "Official company email"
      ];
    }

    // Increment agent action metrics
    try {
      db.prepare("UPDATE agents SET actions_count = actions_count + 1, last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?").run(this.agentId);
      logAgentAction(
        'SUPPORT_AGENT',
        'CUSTOMER_QUERY_RESOLVED',
        `Answered inquiry: "${message.slice(0, 60)}" -> Response sent.`
      );
    } catch (e) {
      // non-fatal
    }

    return {
      success: true,
      reply,
      suggestedQuestions,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}

module.exports = new SupportAgent();
