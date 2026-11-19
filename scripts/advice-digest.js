#!/usr/bin/env node
/**
 * Weekly "your tips are wanted" email: asks the running site to send it.
 * Run by cron on the server (Mondays). `--dry` only counts who would get one. Prints counts only.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnv() {
  const env = {};
  for (const f of ['.env', '.env.local']) {
    const p = path.join(__dirname, '..', f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  }
  return { ...env, ...process.env };
}

(async () => {
  const env = loadEnv();
  if (!env.SESSION_SECRET) return console.log('advice digest: no SESSION_SECRET, skipped');
  const key = crypto.createHmac('sha256', env.SESSION_SECRET).update('advice-digest').digest('hex');
  const dry = process.argv.includes('--dry') ? '?dry=1' : '';
  try {
    const r = await fetch(`http://localhost:3000/api/advice/digest${dry}`, { method: 'POST', headers: { 'x-cron-key': key }, signal: AbortSignal.timeout(10 * 60 * 1000) });
    const d = await r.json().catch(() => ({}));
    console.log(new Date().toISOString(), 'advice digest:', r.status, JSON.stringify({ requests: d.requests ?? 0, members: d.members ?? 0, sent: d.sent ?? 0, failed: d.failed ?? 0, dryRun: !!d.dryRun }));
  } catch (e) {
    console.log('advice digest failed:', e.message);
  }
})();
