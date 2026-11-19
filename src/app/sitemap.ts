import type { MetadataRoute } from 'next';
import { publicTrips, destinationIndex } from '@/lib/destinations';

const SITE = 'https://tripshare.org';
export const revalidate = 3600; // rebuilt at most hourly

/** Every page Google should know about: the main pages, each destination, each shared trip */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/trips`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/destinations`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/creators`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/how-to`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${SITE}/terms`, changeFrequency: 'yearly', priority: 0.1 },
  ];
  try {
    const [trips, places] = await Promise.all([publicTrips(), destinationIndex()]);
    return [
      ...fixed,
      ...places.map((d) => ({ url: `${SITE}/destinations/${d.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
      ...trips.map((t) => ({ url: `${SITE}/trips/${t.id}`, lastModified: t.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ];
  } catch {
    return fixed;
  }
}
