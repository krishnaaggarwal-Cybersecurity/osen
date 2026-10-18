import { NextResponse } from 'next/server';
import {
  clearSupabaseSession,
  getAuthenticatedOperator,
  getSupabaseConfig,
  hasSameOrigin,
  operatorResponse,
  saveSupabaseSession,
} from '../../../lib/supabase/server';

export async function GET() {
  try {
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, operator: operatorResponse(operator) });
  } catch (error) {
    console.error('Failed to verify operator session:', error);
    return NextResponse.json({ error: 'Unable to verify operator session.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const body = await request.json();
    const { action = 'sign-in', email, password } = body;
    if (action === 'sign-up') {
      const displayName = body.displayName;
      if (
        typeof displayName !== 'string' ||
        displayName.trim().length < 2 ||
        displayName.trim().length > 80 ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' ||
        password.length < 8 ||
        password.length > 256
      ) {
        return NextResponse.json(
          { error: 'Enter your name, a valid email, and a password with at least 8 characters.' },
          { status: 400 },
        );
      }

      const { url, key } = getSupabaseConfig();
      const response = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          data: { display_name: displayName.trim() },
        }),
        cache: 'no-store',
      });

      if (response.status === 400 || response.status === 422) {
        const error = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: error.msg || error.message || 'Could not create account. Check the password requirements and whether the email is already registered.' },
          { status: 400 },
        );
      }
      if (!response.ok) {
        console.error('Supabase sign-up failed:', response.status, await response.text());
        return NextResponse.json({ error: 'Sign-up service is unavailable.' }, { status: 502 });
      }

      return NextResponse.json({
        created: true,
        message: 'Account created. If email confirmation is enabled, check your inbox. An administrator must approve operator access before you can sign in.',
      });
    }

    if (action !== 'sign-in') {
      return NextResponse.json({ error: 'Unsupported authentication action.' }, { status: 400 });
    }
    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' ||
      password.length < 1 ||
      password.length > 256
    ) {
      return NextResponse.json({ error: 'Enter a valid email address and password.' }, { status: 400 });
    }

    const { url, key } = getSupabaseConfig();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: 'no-store',
    });

    if (response.status === 400 || response.status === 401) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }
    if (!response.ok) {
      console.error('Supabase sign-in failed:', response.status, await response.text());
      return NextResponse.json({ error: 'Sign-in service is unavailable.' }, { status: 502 });
    }

    const session = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    const storedSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    };
    await saveSupabaseSession(storedSession);

    const operator = await getAuthenticatedOperator(storedSession);
    if (!operator) {
      await clearSupabaseSession();
      return NextResponse.json({ error: 'No active operator profile exists for this account.' }, { status: 403 });
    }
    return NextResponse.json({ authenticated: true, operator: operatorResponse(operator) });
  } catch (error) {
    console.error('Operator sign-in failed:', error);
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const operator = await getAuthenticatedOperator();
    if (operator) {
      const { url, key } = getSupabaseConfig();
      const response = await fetch(`${url}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${operator.accessToken}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        console.error('Supabase sign-out failed:', response.status, await response.text());
      }
    }
    await clearSupabaseSession();
    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Operator sign-out failed:', error);
    await clearSupabaseSession();
    return NextResponse.json({ error: 'Unable to sign out.' }, { status: 500 });
  }
}
