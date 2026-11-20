import type { NextRequest } from 'next/server';

/**
 * Where visitors come from: a short channel name taken from ?utm_source= (our own share links add it)
 * or from the site that linked here. Stored per day as counts only, plus the first channel on a
 * new member and on a newly shared trip. No personal data.
 */
export const SOURCE_COOKIE = 'ts_src';

const HOSTS: [RegExp, string][] = [
  [/(^|\.)pinterest\./, 'pinterest'],
  [/(^|\.)pin\.it$/, 'pinterest'],
  [/(^|\.)(facebook|fb)\.(com|me)$|(^|\.)m\.facebook\./, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
  [/(^|\.)(x\.com|t\.co|twitter\.com)$/, 'x'],
  [/(^|\.)(tiktok\.com)$/, 'tiktok'],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)(mail\.google|outlook\.|mail\.yahoo)/, 'email'],
  [/(^|\.)(chatgpt\.com|openai\.com|claude\.ai|perplexity\.ai)$/, 'ai-assistant'],
];

/** A safe channel name: lowercase letters, digits and dashes, at most 30 characters */
export function cleanSource(v: unknown): string {
  const s = String(v || '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  return s;
}

/** Channel from a utm_source value, else from the referring site's host, else "direct" */
export function channelFrom(utm: string | null | undefined, referrer: string | null | undefined, ownHost = 'tripshare.org'): string {
  const u = cleanSource(utm);
  if (u) return u;
  try {
    const host = new URL(String(referrer || '')).hostname.replace(/^www\./, '').toLowerCase();
    if (!host || host === ownHost || host.endsWith(`.${ownHost}`) || host === 'localhost') return 'direct';
    for (const [re, name] of HOSTS) if (re.test(host)) return name;
    return cleanSource(host.split('.').slice(-2).join('.')) || 'other';
  } catch {
    return 'direct';
  }
}

/** The first channel this browser came from (set by /api/track), or null */
export function sourceFromRequest(request: NextRequest): string | null {
  const v = cleanSource(request.cookies.get(SOURCE_COOKIE)?.value);
  return v && v !== 'direct' ? v : null;
}
