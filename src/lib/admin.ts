import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionUserId } from '@/lib/session';

/** Site owners: emails listed in ADMIN_EMAILS (a server setting from a GitHub secret, never in the code) */
const ADMINS = (process.env.ADMIN_EMAILS || '')
  .split(/[,\s]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const uid = sessionUserId(request);
  if (!uid || ADMINS.length === 0) return false;
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { email: true } });
  return !!u?.email && ADMINS.includes(u.email.trim().toLowerCase());
}
