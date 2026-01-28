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

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    console.error('CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
