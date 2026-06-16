import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type SetAllCookie = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client.
 * Use inside Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_DATABASE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_DATABASE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SetAllCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any),
            );
          } catch {
            // setAll called from Server Component — handled by middleware refresh
          }
        },
      },
    },
  );
}
