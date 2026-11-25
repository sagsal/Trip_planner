import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/session';
import { cleanProfile } from '@/lib/profile';
import { sourceFromRequest } from '@/lib/channel';

// Set route runtime config to ensure proper timeout handling
export const maxDuration = 30; // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try { body = await request.json(); } catch {}
    if (!body || typeof body !== 'object') body = {};
    // Only name, email, password and the terms box are required. Region, country and age are optional:
    // blank, missing or unexpected answers are simply left empty and never stop anyone signing up.
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    let profile: ReturnType<typeof cleanProfile> = { homeRegion: null, homeCountry: null, ageBracket: null };
    try { profile = cleanProfile(body); } catch {}

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please fill in your name, email and password.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
      return NextResponse.json({ error: 'That email address doesn’t look right. Please check it.' }, { status: 400 });
    }

    if (body.acceptTerms !== true) {
      return NextResponse.json(
        { error: 'Please agree to the Terms of Use and Privacy Policy' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'There’s already an account with this email. Try signing in instead.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ...profile,
        termsAcceptedAt: new Date(),
        signupSource: sourceFromRequest(request),
      }
    });


    // Return user data (excluding password)
    const { password: _, ...user } = newUser;

    const res = NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
    setSessionCookie(res, newUser.id);
    return res;

  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'There’s already an account with this email. Try signing in instead.' }, { status: 400 });
    }
    console.error('Registration error:', error?.code || '', error instanceof Error ? error.message.split('\n').slice(-1)[0] : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
