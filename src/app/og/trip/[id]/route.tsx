import { tripImageResponse } from '@/lib/tripImage';

/** /og/trip/<id> → 1200×630 link-preview card; ?f=pin → 1000×1500 Pinterest pin (see src/lib/tripImage.tsx) */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return tripImageResponse(id, new URL(request.url).searchParams.get('f') === 'pin');
}
