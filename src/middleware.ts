import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware for route protection.
 * 
 * Currently, admin route protection is handled client-side via:
 * - Admin authorization check in src/app/admin/page.tsx
 * - Firestore security rules (server-side enforcement)
 * 
 * This middleware can be extended in the future to:
 * - Verify Firebase auth tokens server-side
 * - Check admin status server-side using Firebase Admin SDK
 * - Redirect unauthorized users before page load
 * 
 * For now, this middleware serves as a placeholder and can be extended
 * when server-side admin verification is needed.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes - could add server-side verification here in the future
  if (pathname.startsWith('/admin')) {
    // Currently, admin protection is handled client-side
    // Future enhancement: Verify auth token and admin status server-side
    // const token = request.cookies.get('auth-token');
    // if (!token || !isAdmin(token)) {
    //   return NextResponse.redirect(new URL('/admin', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

