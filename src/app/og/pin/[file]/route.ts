import { tripImageResponse } from '@/lib/tripImage';

/** /og/pin/<id>.png → the trip's 1000×1500 Pinterest image, at an address that ends in .png as Pinterest expects */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([A-Za-z0-9_-]{5,64})\.png$/.exec(file || '');
  if (!m) return new Response('Not found', { status: 404 });
  return tripImageResponse(m[1], true);
}
