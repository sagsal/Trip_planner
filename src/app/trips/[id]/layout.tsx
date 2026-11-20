import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { prisma } from '@/lib/prisma';
import { monthYear, daysFromDates } from '@/lib/dates';

/**
 * Link previews for a shared trip: when a trip link is pasted into WhatsApp, Facebook,
 * iMessage, X etc. it shows the cover photo, the title and "10 days · 4 cities".
 * Only public, published trips get details; anything else gets the site's generic preview.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tripshare.org').replace(/\/$/, '');
const SITE_NAME = 'Share and Plan';
const DEFAULT_DESC = 'Real trips from real travelers: where they stayed, ate and explored, day by day. Build your next trip from theirs.';


function list(json: unknown): string[] {
  try {
    let v: any = typeof json === 'string' ? JSON.parse(json) : json;
    if (typeof v === 'string') v = JSON.parse(v);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const generic: Metadata = {
    title: `Trip · ${SITE_NAME}`,
    description: DEFAULT_DESC,
    openGraph: { siteName: SITE_NAME, type: 'website', images: [{ url: `${SITE}/sea-warm.jpg` }] },
  };
  if (!/^[A-Za-z0-9_-]{5,64}$/.test(id || '')) return generic;

  try {
    const t = await prisma.trip.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        isPublic: true,
        isDraft: true,
        user: { select: { blockedAt: true } },
        coverImageUrl: true,
        countries: true,
        tripType: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
        cities_data: { select: { name: true, numberOfDays: true, _count: { select: { hotels: true, restaurants: true, activities: true } } } },
      },
    });
    if (!t || !t.isPublic || t.isDraft || t.user?.blockedAt) return generic;

    const cities = t.cities_data || [];
    const days = daysFromDates(t.startDate, t.endDate) || cities.reduce((n, c) => n + (c.numberOfDays || 0), 0);
    const places = cities.reduce((n, c) => n + c._count.hotels + c._count.restaurants + c._count.activities, 0);
    const facts = [
      monthYear(t.startDate),
      days ? `${days} ${days === 1 ? 'day' : 'days'}` : '',
      cities.length > 1 ? `${cities.length} cities` : cities[0]?.name || list(t.countries).join(', '),
      t.tripType || '',
      places ? `${places} places` : '',
    ].filter(Boolean).join(' · ');
    const route = cities.length > 1 ? cities.map((c) => c.name).join(' → ') : '';
    const by = '';
    const comment = (t.description || '').replace(/\s+/g, ' ').trim();
    const description = `${facts}${route ? ` — ${route}` : ''}. ${by}${comment ? comment.slice(0, 160) : 'Where they stayed, ate and explored, day by day.'}`.slice(0, 300);

    // The journal-style card made for this trip (cover photo, title, days, route); ?v= refreshes it after edits
    const image = `${SITE}/og/trip/${id}?v=${t.updatedAt.getTime().toString(36)}`;
    const url = `${SITE}/trips/${id}`;
    // A title people search for: "Belompan & Hopkins, Belize: 7-day family with teens itinerary"
    const kind = [days ? `${days}-day` : '', (t.tripType || '').toLowerCase(), 'itinerary'].filter(Boolean).join(' ');
    const title = `${t.title}: ${kind} · ${SITE_NAME}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: t.title,
        description,
        url,
        siteName: SITE_NAME,
        type: 'article',
        images: [{ url: image, width: 1200, height: 630, alt: t.title }],
      },
      twitter: { card: 'summary_large_image', title: t.title, description, images: [image] },
      other: { 'pinterest-rich-pin': 'true' },
    };
  } catch {
    return generic;
  }
}

export default function TripLayout({ children }: { children: ReactNode }) {
  return children;
}
