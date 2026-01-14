import { createBrowserClient } from '@supabase/ssr';

// SSR-compatible browser client for client components
// This ensures cookies are properly set for middleware
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
