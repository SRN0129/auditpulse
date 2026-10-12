const { db } = require('./database');
db.prepare("UPDATE wallet_settings SET value = '7735818294@slc', updated_at = CURRENT_TIMESTAMP WHERE key = 'receiving_vpa'").run();
db.prepare("UPDATE wallet_settings SET value = 'AuditPulse Digital Services', updated_at = CURRENT_TIMESTAMP WHERE key = 'receiving_name'").run();
console.log('ACTIVE SETTINGS IN DB:', db.prepare('SELECT * FROM wallet_settings').all());
