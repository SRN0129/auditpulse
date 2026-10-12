const { db } = require('./database');
db.prepare("UPDATE outreach_campaigns SET body_markdown = REPLACE(body_markdown, 'http://localhost:3000', 'https://auditpulse-three.vercel.app')").run();
const sample = db.prepare('SELECT body_markdown FROM outreach_campaigns LIMIT 1').get();
console.log('SAMPLE PROD URL CHECK:', sample && sample.body_markdown.includes('https://auditpulse-three.vercel.app'));
