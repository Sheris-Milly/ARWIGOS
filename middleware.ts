import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup', '/auth/callback', '/reset-password', '/about', '/terms', '/privacy']; // Keep original public paths + auth callback
// Define paths that require authentication
const protectedPaths = ['/', '/dashboard', '/portfolio', '/advisor', '/market', '/planning', '/profile'];
// Define paths that should always be allowed, regardless of authentication state
const alwaysAllowedPaths = ['/auth/callback']; // Add the Supabase auth callback path

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          // Set the cookie on the response
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies
          req.cookies.set({ name, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          // Set the cookie on the response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const path = req.nextUrl.pathname;

  // Check if the path is always allowed (e.g., Supabase auth callback)
  if (alwaysAllowedPaths.some(allowedPath => path === allowedPath)) {
    return response; // Allow the request to proceed
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedPaths.some(p => path.startsWith(p));
  // Check if the current path is an API route (excluding auth callback and public API routes if any)
  const isApiRoute = path.startsWith('/api/') && !path.startsWith('/api/auth/callback'); // Adjust if you have public API routes
  // Check if the current path is a public route
  const isPublicRoute = publicPaths.some(p => path === p);

  // If trying to access a protected route or a protected API route without a user session
  if (!user && (isProtectedRoute || (isApiRoute /* && !isPublicApiRoute */))) { // Add check for public API routes if needed
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', path); // Keep track of the original path
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is authenticated and tries to access login or signup pages
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Allow access to public paths and the root path '/' regardless of authentication state (unless handled above)
  // No explicit redirect needed here, just return the response

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};