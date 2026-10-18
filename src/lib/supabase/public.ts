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

export async function supabaseRequest<T>(
  resource: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
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
