import { NextResponse, NextRequest } from 'next/server';

/**
 * Middleware (proxy) for authentication and route protection
 *
 * This middleware:
 * 1. Protects dashboard routes - requires authentication
 * 2. Redirects authenticated users away from auth pages (login/signup)
 * 3. Allows public access to landing page and static assets
 */

// Define route patterns
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup'];
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];
const PROTECTED_ROUTES = ['/dashboard'];

/**
 * Check if user is authenticated by verifying presence of access token in cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get('accessToken');
  return !!accessToken?.value;
}

/**
 * Check if the path matches any of the route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  // Allow access to static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|json)$/)
  ) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!authenticated) {
      // Redirect to login with callback URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Auth routes - redirect authenticated users to dashboard
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Public routes - allow access
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
}

// Configure which routes trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
