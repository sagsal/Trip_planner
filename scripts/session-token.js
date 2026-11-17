// Makes a session cookie for a test user (same format as src/lib/session.ts), for the post-deploy tests.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const p = path.join(__dirname, '..', '.env.local');
  const m = fs.existsSync(p) && fs.readFileSync(p, 'utf8').match(/^SESSION_SECRET=(.+)$/m);
  return m ? m[1].trim() : '';
}

module.exports = function sessionCookie(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `tp_session=${payload}.${sig}`;
};
