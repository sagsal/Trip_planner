/**
 * Place details (photo and map/review link) used to be stored as JSON inside a
 * place's `review` text, e.g. {"locationId":"...","imageUrl":"...","webUrl":"..."}.
 * They now have their own columns (imageUrl, webUrl) and `review` is only the
 * traveller's own words. This helper reads both the old and new forms.
 */

export interface PlaceFields {
  review: string;
  imageUrl: string | null;
  webUrl: string | null;
}

const DETAIL_KEYS = ['locationId', 'imageUrl', 'webUrl', 'numReviews'];

export function splitReview(review: unknown): PlaceFields {
  const text = typeof review === 'string' ? review : '';
  const t = text.trim();
  if (t.startsWith('{') && t.endsWith('}')) {
    try {
      const j = JSON.parse(t);
      if (j && typeof j === 'object' && DETAIL_KEYS.some((k) => k in j)) {
        const own = typeof j.review === 'string' ? j.review : typeof j.userReview === 'string' ? j.userReview : '';
        return {
          review: own,
          imageUrl: typeof j.imageUrl === 'string' && j.imageUrl ? j.imageUrl : null,
          webUrl: typeof j.webUrl === 'string' && j.webUrl ? j.webUrl : null,
        };
      }
    } catch {
      // not JSON: ordinary review text
    }
  }
  return { review: text, imageUrl: null, webUrl: null };
}

/** A place's fields with old-style JSON reviews unpacked; real columns win. */
export function placeFields(p: { review?: unknown; imageUrl?: unknown; webUrl?: unknown } | null | undefined): PlaceFields {
  const s = splitReview(p?.review);
  return {
    review: s.review,
    imageUrl: (typeof p?.imageUrl === 'string' && p.imageUrl) || s.imageUrl,
    webUrl: (typeof p?.webUrl === 'string' && p.webUrl) || s.webUrl,
  };
}

/** Only allow links that are safe to show: this site's photo route or https pages. */
export function safeImageUrl(u: unknown): string | null {
  return typeof u === 'string' && (u.startsWith('/api/places/photo?') || /^https:\/\//.test(u)) ? u.slice(0, 2000) : null;
}
export function safeWebUrl(u: unknown): string | null {
  return typeof u === 'string' && /^https:\/\//.test(u) ? u.slice(0, 2000) : null;
}

/** Label for a place's link, by where it points. */
export function linkLabel(webUrl: string): string {
  if (/google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps/.test(webUrl)) return 'View on Google Maps';
  if (/tripadvisor\./.test(webUrl)) return 'Reviews on TripAdvisor';
  return 'More info';
}
