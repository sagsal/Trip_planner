import type { MetadataRoute } from 'next';

/** Search engines: read the public pages; skip members' private areas and the API */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /api/tripadvisor/ must not be crawled (TripAdvisor Review Implementation Policy)
        disallow: ['/api/', '/account', '/sandbox', '/admin', '/feedback', '/trips/new', '/trips/import', '/login', '/register', '/outreach'],
      },
    ],
    sitemap: 'https://tripshare.org/sitemap.xml',
    host: 'https://tripshare.org',
  };
}
