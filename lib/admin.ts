import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase Admin client for bypassing RLS
 * Uses SUPABASE_SERVICE_ROLE_KEY for full database access
 * 
 * WARNING: This client bypasses all Row Level Security (RLS) policies.
 * Only use this in server-side code and always verify user permissions
 * before using it.
 * 
 * @example
 * ```typescript
 * const supabaseAdmin = createAdminClient();
 * // Always verify user permissions first!
 * const { data } = await supabaseAdmin.from('table').select('*');
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // If we're on the server, this is a critical configuration error.
    // We log it and return a client that will fail gracefully instead of throwing during constructor.
    console.error('CRITICAL: Supabase Admin configuration is missing!');
    return createClient(supabaseUrl || 'http://missing-url.com', serviceRoleKey || 'missing-key');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
