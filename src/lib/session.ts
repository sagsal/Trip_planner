import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Sign-in sessions: a signed, HttpOnly cookie set by the server when you sign in.
 * Pages can't read or forge it, so the server knows who is really asking
 * (instead of trusting a user id sent from the browser).
 */

export const SESSION_COOKIE = 'tp_session';
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 32) throw new Error('SESSION_SECRET is not set');
  return s;
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => crypto.createHmac('sha256', secret()).update(data).digest('base64url');

export function makeSessionToken(userId: string): string {
  const payload = b64(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  return `${payload}.${sign(payload)}`;
}

/** The signed-in user's id, or null */
export function sessionUserId(request: NextRequest): string | null {
  try {
    const raw = request.cookies.get(SESSION_COOKIE)?.value || '';
    const [payload, sig] = raw.split('.');
    if (!payload || !sig) return null;
    const expected = sign(payload);
    if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.uid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
    return data.uid;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, makeSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

/**
 * The user this request may act as. A user id sent by the page must match the session.
 * Returns the id, or a ready 401/403 response.
 */
export function requireUser(request: NextRequest, claimedUserId?: unknown): { userId: string } | { error: NextResponse } {
  const uid = sessionUserId(request);
  if (!uid) {
    return { error: NextResponse.json({ error: 'Please sign in again.', signIn: true }, { status: 401 }) };
  }
  if (typeof claimedUserId === 'string' && claimedUserId && claimedUserId !== uid) {
    return { error: NextResponse.json({ error: 'Not allowed.' }, { status: 403 }) };
  }
  return { userId: uid };
}
