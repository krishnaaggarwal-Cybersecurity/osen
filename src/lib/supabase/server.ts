import { cookies } from 'next/headers';

const SESSION_COOKIE = 'netragrid_session';

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface SupabaseUser {
  id: string;
  email?: string;
}

interface OperatorProfile {
  id: string;
  display_name: string;
  role: 'pending' | 'operator' | 'supervisor' | 'admin';
  assigned_sector: string;
}

export interface AuthenticatedOperator {
  user: SupabaseUser;
  profile: OperatorProfile;
  accessToken: string;
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable key.');
  }

  return { url: url.replace(/\/$/, ''), key };
}

export function hasSameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function saveSupabaseSession(session: SupabaseSession) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    Buffer.from(JSON.stringify(session)).toString('base64url'),
    cookieOptions(60 * 60 * 24 * 30),
  );
}

export async function clearSupabaseSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', cookieOptions(0));
}

async function readSupabaseSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as SupabaseSession;
    if (!session.access_token || !session.refresh_token || !Number.isFinite(session.expires_at)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function refreshSession(refreshToken: string) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  });

  if (response.status === 400 || response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`Supabase token refresh failed (${response.status}).`);
  }

  const session = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const normalized = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
  };
  await saveSupabaseSession(normalized);
  return normalized;
}

export async function getAuthenticatedOperator(
  sessionOverride?: SupabaseSession,
): Promise<AuthenticatedOperator | null> {
  const { url, key } = getSupabaseConfig();
  let session = sessionOverride ?? await readSupabaseSession();
  if (!session) return null;

  if (session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
    session = await refreshSession(session.refresh_token);
    if (!session) {
      await clearSupabaseSession();
      return null;
    }
  }

  const authResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });
  if (authResponse.status === 401 || authResponse.status === 403) {
    await clearSupabaseSession();
    return null;
  }
  if (!authResponse.ok) {
    throw new Error(`Unable to verify Supabase session (${authResponse.status}).`);
  }

  const user = (await authResponse.json()) as SupabaseUser;
  const profileResponse = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,display_name,role,assigned_sector&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    },
  );
  if (!profileResponse.ok) {
    throw new Error(`Unable to load operator profile (${profileResponse.status}).`);
  }
  const profiles = (await profileResponse.json()) as OperatorProfile[];
  if (
    !profiles[0] ||
    (profiles[0].role !== 'operator' && profiles[0].role !== 'supervisor' && profiles[0].role !== 'admin')
  ) {
    return null;
  }

  return { user, profile: profiles[0], accessToken: session.access_token };
}

export async function supabaseRequest<T>(
  operator: AuthenticatedOperator,
  resource: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${operator.accessToken}`);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${url}/rest/v1/${resource}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function operatorResponse(operator: AuthenticatedOperator) {
  return {
    id: operator.user.email?.split('@')[0] || operator.profile.id.slice(0, 8),
    name: operator.profile.display_name,
    role: operator.profile.role,
    assignedSector: operator.profile.assigned_sector,
    email: operator.user.email,
  };
}
