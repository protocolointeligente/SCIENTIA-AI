import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiRequestOptions extends RequestInit {
  workspaceId?: string | null;
  /** Pass an explicit token to skip the Supabase session lookup (e.g. in Server Actions). */
  token?: string | null;
}

/**
 * Thin fetch wrapper that attaches the Supabase session token and the
 * active workspace context expected by the NestJS API guards.
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token: explicitToken, workspaceId, headers, ...rest } = options;

  // Resolve bearer token: use explicit token OR fetch from Supabase session
  let bearerToken = explicitToken ?? null;
  if (!bearerToken) {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    bearerToken = data.session?.access_token ?? null;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
