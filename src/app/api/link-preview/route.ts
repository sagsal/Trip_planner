import { NextRequest, NextResponse } from 'next/server';

/**
 * Name and main photo for a pasted rental link (Airbnb, VRBO, Booking.com …),
 * read from the page's preview tags (og:title / og:image), like a chat app's link preview.
 * GET /api/link-preview?url=...
 *
 * Only these sites are fetched (so the server can't be pointed at anything else),
 * redirects are followed only within them, and pages are read up to 1 MB.
 * Some sites block this; the form then just asks for a name.
 */
export const dynamic = 'force-dynamic';

const ALLOWED = /(^|\.)(airbnb\.[a-z.]+|abnb\.me|vrbo\.com|homeaway\.[a-z.]+|booking\.com|expedia\.[a-z.]+|hotels\.com|hostelworld\.com|agoda\.com|plumguide\.com|sonder\.com|tripadvisor\.[a-z.]+|homestay\.com|holidu\.[a-z.]+)$/i;

function allowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!ALLOWED.test(u.hostname)) return null;
    u.protocol = 'https:';
    return u;
  } catch {
    return null;
  }
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html: string, key: string): string {
  // <meta property="og:title" content="..."> in either attribute order
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? decode(m[1]) : '';
}

function siteName(host: string): string {
  if (/airbnb|abnb/.test(host)) return 'Airbnb';
  if (/vrbo|homeaway/.test(host)) return 'VRBO';
  if (/booking\.com/.test(host)) return 'Booking.com';
  if (/expedia/.test(host)) return 'Expedia';
  if (/hotels\.com/.test(host)) return 'Hotels.com';
  if (/hostelworld/.test(host)) return 'Hostelworld';
  if (/agoda/.test(host)) return 'Agoda';
  return host.replace(/^www\./, '');
}

export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get('url') || '';
  const first = allowedUrl(raw);
  if (!first) {
    return NextResponse.json({ ok: false, error: 'Paste a link from Airbnb, VRBO, Booking.com or a similar site.' }, { status: 400 });
  }
  let url: URL = first;
  const site = siteName(url.hostname);

  try {
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      res = await fetch(url.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TripShareLinkPreview/1.0; +https://tripshare.org)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en',
        },
      }).finally(() => clearTimeout(timer));
      if (res.status >= 300 && res.status < 400) {
        const next: string | null = res.headers.get('location');
        const nextUrl: URL | null = next ? allowedUrl(new URL(next, url).toString()) : null;
        if (!nextUrl) break;
        url = nextUrl;
        continue;
      }
      break;
    }
    if (!res || !res.ok) {
      return NextResponse.json({ ok: false, site, url: url.toString(), error: `${site} didn't share the details. Please type a name.` });
    }

    // Read at most 1 MB
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const dec = new TextDecoder();
      let total = 0;
      while (total < 1_000_000) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        html += dec.decode(value, { stream: true });
        if (/<\/head>/i.test(html)) break; // preview tags are in <head>
      }
      reader.cancel().catch(() => {});
    }

    const title = meta(html, 'og:title') || decode((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '');
    const image = meta(html, 'og:image') || meta(html, 'twitter:image');
    const description = meta(html, 'og:description');
    const imageUrl = /^https:\/\//.test(image) ? image.slice(0, 2000) : null;

    return NextResponse.json({
      ok: !!(title || imageUrl),
      site,
      url: url.toString(),
      name: title.slice(0, 200),
      description: description.slice(0, 300),
      imageUrl,
      error: title || imageUrl ? undefined : `${site} didn't share the details. Please type a name.`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, site, url: url.toString(), error: `Couldn't reach ${site}. Please type a name.` });
  }
}
