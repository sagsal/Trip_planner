import crypto from 'crypto';

/** A key only this server can make (from SESSION_SECRET), for its own scheduled jobs */
export function cronKey(name: string) {
  const s = process.env.SESSION_SECRET || '';
  return s ? crypto.createHmac('sha256', s).update(name).digest('hex') : '';
}
export function cronAllowed(got: string | null, name: string) {
  const key = cronKey(name);
  const g = got || '';
  return !!key && g.length === key.length && crypto.timingSafeEqual(Buffer.from(g), Buffer.from(key));
}
