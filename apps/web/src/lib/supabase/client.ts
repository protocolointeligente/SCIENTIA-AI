import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client (singleton).
 * Use inside Client Components and event handlers.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_DATABASE_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_DATABASE_SUPABASE_ANON_KEY!,
  );
}
