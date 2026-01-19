import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isForgotPasswordPage = pathname === '/login/forgot-password';
  const isUpdatePasswordPage = pathname === '/login/update-password';
  const isChangePasswordPage = pathname === '/dashboard/change-password';
  const isAuthCallback = pathname === '/auth/callback';
  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAppRoute = pathname.startsWith('/menu-builder') || pathname.startsWith('/settings');
  const isPublicRoute =
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/legal') ||
    pathname === '/';

  // Public routes - allow access
  if (isPublicRoute) {
    return response;
  }

  // Auth callback route - allow access (needed for PKCE flow)
  if (isAuthCallback) {
    return response;
  }

  // Not logged in
  if (!session) {
    if (isLoginPage || isForgotPasswordPage || isUpdatePasswordPage) {
      return response;
    }
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is logged in - get profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, must_change_password, is_2fa_required')
    .eq('id', session.user.id)
    .single();

  // Normalize role (trim and lowercase for consistency)
  const userRole = (profile?.role || 'user').trim().toLowerCase();
  const isActive = profile?.is_active ?? false;
  const mustChangePassword = profile?.must_change_password ?? false;

  // Inactive users - redirect to login
  if (!isActive) {
    if (isLoginPage || isForgotPasswordPage || isUpdatePasswordPage) {
      return response;
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'account_inactive');
    return NextResponse.redirect(loginUrl);
  }

  // Force password change check - must be after active check
  if (mustChangePassword) {
    // Allow access to change password page and login-related pages
    if (isChangePasswordPage || isLoginPage || isForgotPasswordPage || isUpdatePasswordPage) {
      return response;
    }
    // Redirect to change password page
    return NextResponse.redirect(new URL('/dashboard/change-password', request.url));
  }

  // User is on change password page but doesn't need to change password
  if (isChangePasswordPage && !mustChangePassword) {
    // Redirect to dashboard
    if (userRole === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2FA Enforcement Check
  // Check if profile requires 2FA and if user has enrolled factors
  const is2FASetupPage = pathname.endsWith('/two-factor-setup');

  // Only check for authenticated users who are active and don't need password change
  if ((profile as any)?.is_2fa_required) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    // check if any factor is verified (totp)
    const hasFactor = factors?.all?.some(f => f.status === 'verified');

    if (!hasFactor) {
      if (!is2FASetupPage && !isLoginPage && !isAuthCallback) {
        const base = userRole === 'super_admin' ? '/super-admin' : '/dashboard';
        return NextResponse.redirect(new URL(`${base}/two-factor-setup`, request.url));
      }
    }
  }

  // User is on login/forgot password pages but already logged in - redirect
  if (isLoginPage || isForgotPasswordPage) {
    // If must change password, redirect to change password page
    if (mustChangePassword) {
      return NextResponse.redirect(new URL('/dashboard/change-password', request.url));
    }

    // Check if there's a redirect parameter in the URL
    const redirectParam = request.nextUrl.searchParams.get('redirect');

    // Prevent infinite redirect loop - don't redirect to login page
    if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login') {
      // Validate that the redirect path matches user's role
      const isRedirectSuperAdmin = redirectParam.startsWith('/super-admin');
      const isRedirectDashboard = redirectParam.startsWith('/dashboard');
      const isRedirectAppRoute = redirectParam.startsWith('/menu-builder') ||
        redirectParam.startsWith('/settings');

      // Super admin can access super-admin routes
      if (isRedirectSuperAdmin && userRole === 'super_admin') {
        return NextResponse.redirect(new URL(redirectParam, request.url));
      }
      // Tenant admin and staff can access dashboard routes
      if (isRedirectDashboard && (userRole === 'tenant_admin' || userRole === 'staff')) {
        return NextResponse.redirect(new URL(redirectParam, request.url));
      }
      // All authenticated users can access app routes
      if (isRedirectAppRoute) {
        return NextResponse.redirect(new URL(redirectParam, request.url));
      }
      // If redirect doesn't match role, fall through to default redirect
    }

    // Default redirect based on role
    if (userRole === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
    if (userRole === 'tenant_admin' || userRole === 'staff') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ISTİSNA: Update password page - giriş yapmış kullanıcılar erişebilir (recovery flow için gerekli)
  if (isUpdatePasswordPage) {
    return response;
  }

  // Super Admin routes protection
  if (isSuperAdminRoute) {
    if (userRole !== 'super_admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Dashboard routes protection - only tenant_admin and staff
  if (isDashboardRoute) {
    if (userRole !== 'tenant_admin' && userRole !== 'staff') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // App routes - allow tenant_admin and regular users
  if (isAppRoute) {
    // Allow access for tenant_admin and regular users
    // Super admin can also access these routes if needed
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
