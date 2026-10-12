/**
 * Autonomous Enterprise OS - C-Suite Agent Orchestration & HR Governance
 * Manages CEO, HR, Agent Manager, Finance Expert, Design Evolver, and Marketing agents.
 * HR Agent dynamically evaluates capacity and creates new specialized agents with strict safety rules.
 */

const { db, logAgentAction } = require('./database');

class AgentOrchestrator {
  constructor() {
    this.allowedAgentTypes = ['researcher', 'copywriter', 'seo_specialist', 'outreach_bot', 'support_agent'];
  }

  // Get live list of all C-Suite and operational agents
  getAllAgents() {
    const agents = db.prepare('SELECT * FROM agents ORDER BY created_at ASC').all();
    return agents;
  }

  // HR Agent: Dynamically creates and provisions a new specialized agent
  createAgentByHR({ name, role, systemPrompt, budgetRules = 'Zero-capital only' }) {
    if (!name || !role) {
      throw new Error('Agent Name and Role are required.');
    }

    const agentId = name.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + Date.now().toString(36);

    // Enforce strict safety governance in prompt
    const governedPrompt = `${systemPrompt || ''}\n\n[GOVERNANCE RULES]:\n1. Strictly 100% legal operations only.\n2. Zero external business capital; zero debt permitted.\n3. Never request or touch banking credentials, OTPs, or PINs.\n4. Budget limit: ${budgetRules}.\n5. Operating under Master CEO and HR Agent supervision.`;

    db.prepare(`
      INSERT INTO agents (id, name, role, status, system_prompt, actions_count)
      VALUES (?, ?, ?, 'active', ?, 0)
    `).run(agentId, name, role, governedPrompt);

    // Update HR action count
    db.prepare("UPDATE agents SET actions_count = actions_count + 1, last_heartbeat = CURRENT_TIMESTAMP WHERE id = 'hr'").run();

    logAgentAction(
      'HR_AGENT',
      'AGENT_PROVISIONED',
      `Provisioned new specialized agent: "${name}" (${role}) with strict safety governance rules.`
    );

    return {
      success: true,
      agentId,
      name,
      role
    };
  }

  // Record an action by an agent and update its heartbeat
  recordAgentHeartbeat(agentId, action, details) {
    db.prepare("UPDATE agents SET actions_count = actions_count + 1, last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?").run(agentId);
    logAgentAction(agentId.toUpperCase(), action, details);
  }
}

module.exports = new AgentOrchestrator();
