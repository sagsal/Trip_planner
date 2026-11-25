import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';

// Set route runtime config to ensure proper timeout handling
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email in database
    const user = await prisma.user.findUnique({
      where: { email }
    });
    

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.blockedAt) {
      return NextResponse.json({ error: 'This account has been suspended.' }, { status: 403 });
    }

    // Return user data (excluding password) and start a signed session
    const { password: _, ...userWithoutPassword } = user;
    const res = NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200 });
    setSessionCookie(res, user.id);
    return res;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
