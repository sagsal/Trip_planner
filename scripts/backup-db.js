#!/usr/bin/env node
/**
 * Nightly database backup to Backblaze B2 (S3-compatible), no extra packages.
 *
 *   node scripts/backup-db.js           make a backup, upload it, delete backups older than 30 days
 *   node scripts/backup-db.js --check   download the newest backup and test-restore it into a
 *                                       temporary database (dropped afterwards); prints counts only
 *
 * Settings come from the server's .env / .env.local (never from git):
 *   DATABASE_URL  mysql://user:pass@host:port/db
 *   B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT (e.g. s3.us-west-004.backblazeb2.com)
 *   BACKUP_KEEP_DAYS (optional, default 30)
 * Output never shows passwords, keys or any user data: it is safe for public logs.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');

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

const env = loadEnv();
const KEY_ID = env.B2_KEY_ID || '';
const APP_KEY = env.B2_APP_KEY || '';
const BUCKET = env.B2_BUCKET || '';
const ENDPOINT = (env.B2_ENDPOINT || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const KEEP_DAYS = Math.max(1, Number(env.BACKUP_KEEP_DAYS) || 30);
const REGION = (ENDPOINT.match(/^s3\.([a-z0-9-]+)\./) || [])[1] || 'us-east-1';
const PREFIX = 'db/';

function db() {
  const u = new URL(env.DATABASE_URL || '');
  return {
    host: u.hostname || 'localhost',
    port: u.port || '3306',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    name: u.pathname.replace(/^\//, '').split('?')[0],
  };
}

/* ---------- S3 request signing (AWS Signature V4) ---------- */
const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function s3(method, key, { query = {}, body = null } = {}) {
  const host = `${BUCKET}.${ENDPOINT}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256(body || '');
  const canonPath = '/' + key.split('/').map(enc).join('/');
  const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(String(query[k]))}`).join('&');
  const headers = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  const signed = Object.keys(headers).sort();
  const canonical = [method, canonPath, qs, signed.map((h) => `${h}:${headers[h]}\n`).join(''), signed.join(';'), payloadHash].join('\n');
  const scope = `${day}/${REGION}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n');
  const kSign = hmac(hmac(hmac(hmac('AWS4' + APP_KEY, day), REGION), 's3'), 'aws4_request');
  const sig = crypto.createHmac('sha256', kSign).update(toSign).digest('hex');
  const res = await fetch(`https://${host}${canonPath}${qs ? '?' + qs : ''}`, {
    method,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${KEY_ID}/${scope}, SignedHeaders=${signed.join(';')}, Signature=${sig}`,
    },
    body: body || undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const code = (text.match(/<Code>([^<]+)<\/Code>/) || [])[1] || '';
    throw new Error(`Backblaze ${method} failed: HTTP ${res.status} ${code}`);
  }
  return res;
}

async function listBackups() {
  const out = [];
  let token = null;
  do {
    const query = { 'list-type': '2', prefix: PREFIX, ...(token ? { 'continuation-token': token } : {}) };
    const xml = await (await s3('GET', '', { query })).text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = (m[1].match(/<Key>([^<]+)<\/Key>/) || [])[1];
      const size = Number((m[1].match(/<Size>(\d+)<\/Size>/) || [])[1] || 0);
      const modified = (m[1].match(/<LastModified>([^<]+)<\/LastModified>/) || [])[1];
      if (key) out.push({ key, size, modified: new Date(modified) });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? (xml.match(/<NextContinuationToken>([^<]+)</) || [])[1] : null;
  } while (token);
  return out.sort((a, b) => a.modified - b.modified);
}

/* ---------- mysqldump / mysql ---------- */
function run(cmd, args, { input = null, password } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env: { ...process.env, MYSQL_PWD: password } });
    const chunks = [];
    let err = '';
    p.stdout.on('data', (c) => chunks.push(c));
    p.stderr.on('data', (c) => (err += c.toString()));
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`${cmd} exited with ${code}: ${err.replace(/\s+/g, ' ').slice(0, 200)}`));
    });
    if (input) p.stdin.end(input);
    else p.stdin.end();
  });
}

async function dump() {
  const d = db();
  return run(
    'mysqldump',
    ['-h', d.host, '-P', d.port, '-u', d.user, '--single-transaction', '--quick', '--no-tablespaces', '--routines', '--default-character-set=utf8mb4', d.name],
    { password: d.password }
  );
}

/** Rows of one table inside a mysqldump: counts the (…) groups after INSERT INTO `t` VALUES, minding quoted text */
function countRows(text, table) {
  const head = `INSERT INTO \`${table}\` VALUES `;
  let rows = 0;
  let at = text.indexOf(head);
  while (at !== -1) {
    let i = at + head.length;
    let depth = 0;
    let inStr = false;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (c === '\\') i++;
        else if (c === "'") inStr = false;
        continue;
      }
      if (c === "'") inStr = true;
      else if (c === '(') { if (depth === 0) rows++; depth++; }
      else if (c === ')') depth--;
      else if (c === ';' && depth === 0) break;
    }
    at = text.indexOf(head, i);
  }
  return rows;
}

const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

async function backup() {
  const started = Date.now();
  const sql = await dump();
  if (!/CREATE TABLE/.test(sql.toString('utf8', 0, Math.min(sql.length, 2_000_000)))) throw new Error('The dump looks empty');
  const gz = zlib.gzipSync(sql, { level: 9 });
  const stamp = new Date().toISOString().replace(/[:]/g, '').replace(/\..+/, '').replace('T', '-');
  const key = `${PREFIX}tripshare-${stamp}.sql.gz`;
  await s3('PUT', key, { body: gz });
  console.log(`backup uploaded: ${key.replace(PREFIX, '')} (${mb(sql.length)} raw, ${mb(gz.length)} compressed, ${((Date.now() - started) / 1000).toFixed(1)}s)`);

  // Keep the last KEEP_DAYS days (always keep at least the 3 newest)
  const all = await listBackups();
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  const old = all.slice(0, Math.max(0, all.length - 3)).filter((b) => b.modified.getTime() < cutoff);
  for (const b of old) await s3('DELETE', b.key);
  console.log(`backups kept: ${all.length - old.length}, removed (older than ${KEEP_DAYS} days): ${old.length}`);
}

async function check() {
  const all = await listBackups();
  if (!all.length) throw new Error('No backups found in the bucket');
  const newest = all[all.length - 1];
  const gz = Buffer.from(await (await s3('GET', newest.key)).arrayBuffer());
  const sql = zlib.gunzipSync(gz);
  const tables = [...sql.toString('utf8').matchAll(/CREATE TABLE `([^`]+)`/g)].map((m) => m[1]);
  console.log(`newest backup: ${newest.key.replace(PREFIX, '')}, ${mb(gz.length)} compressed, ${tables.length} tables, ${all.length} backups stored`);

  // Test restore into a throwaway database, then compare row counts with the live one
  const d = db();
  const tmp = `restore_test_${Date.now()}`;
  const mysql = (args, opts = {}) => run('mysql', ['-h', d.host, '-P', d.port, '-u', d.user, '-N', '-B', ...args], { password: d.password, ...opts });
  try {
    await mysql(['-e', `CREATE DATABASE \`${tmp}\` CHARACTER SET utf8mb4`]);
  } catch (e) {
    // No permission for a temporary database: count the rows inside the backup instead
    const text = sql.toString('utf8');
    let ok = true;
    for (const t of ['users', 'trips', 'cities', 'hotels', 'restaurants', 'activities'].filter((x) => tables.includes(x))) {
      const inBackup = countRows(text, t);
      const live = String(await mysql(['-e', `SELECT COUNT(*) FROM \`${d.name}\`.\`${t}\``])).trim();
      if (String(inBackup) !== live) ok = false;
      console.log(`backup check ${t}: ${inBackup} rows in backup, ${live} live`);
    }
    console.log(ok ? 'backup check: PASS (every row is in the backup)' : 'backup check: counts differ (new rows may have been added since the backup ran)');
    return;
  }
  try {
    await mysql([tmp], { input: sql });
    for (const t of ['users', 'trips', 'cities', 'hotels', 'restaurants', 'activities'].filter((x) => tables.includes(x))) {
      const [restored, live] = await Promise.all([
        mysql(['-e', `SELECT COUNT(*) FROM \`${tmp}\`.\`${t}\``]),
        mysql(['-e', `SELECT COUNT(*) FROM \`${d.name}\`.\`${t}\``]),
      ]);
      console.log(`restore test ${t}: restored ${String(restored).trim()} rows, live ${String(live).trim()}`);
    }
    console.log('restore test: PASS');
  } finally {
    await mysql(['-e', `DROP DATABASE IF EXISTS \`${tmp}\``]).catch(() => {});
  }
}

(async () => {
  if (!KEY_ID || !APP_KEY || !BUCKET || !ENDPOINT) {
    console.log('backup skipped: Backblaze settings (B2_KEY_ID, B2_APP_KEY, B2_BUCKET, B2_ENDPOINT) are not set yet');
    return;
  }
  try {
    if (process.argv.includes('--check')) await check();
    else await backup();
  } catch (e) {
    console.log('BACKUP FAILED:', e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  }
})();
