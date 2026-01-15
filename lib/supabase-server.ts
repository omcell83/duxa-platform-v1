import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for server components and route handlers
 * Uses SSR package for proper cookie handling
 * Gold Standard Next.js implementation for PKCE flow
 * 
 * Note: In Next.js 15+, cookies() is async, so this function is async
 * For route handlers, use createClient() directly (it handles async internally)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Component'lerde cookie yazarken hata alabiliriz, bu normaldir.
            // Ancak Route Handler'da çalışıyorsak bu blok çalışır.
          }
        },
      },
    }
  );
}

/**
 * Get current user session (for server components)
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user with profile (role information)
 */
export async function getUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    user: session.user,
    profile: profile || null,
  };
}
