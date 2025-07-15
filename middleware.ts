import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiLimiter, chatLimiter, authLimiter } from './lib/rate-limiter';

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';

    // Rate limiting
    try {
      if (pathname.startsWith('/api/auth')) {
        await authLimiter.consume(ip);
      } else if (pathname.startsWith('/api/chat')) {
        await chatLimiter.consume(ip);
      } else if (pathname.startsWith('/api/')) {
        await apiLimiter.consume(ip);
      }
    } catch (rejRes) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
      // Type-safe access to req.nextauth?.token
      type AuthenticatedRequest = NextRequest & { nextauth?: { token?: { role?: string } } };
      const authReq = req as AuthenticatedRequest;
      const token = authReq.nextauth?.token;
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes
        if (pathname.startsWith('/api/auth') || 
            pathname === '/' || 
            pathname.startsWith('/auth/')) {
          return true;
        }

        // Protected routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/chat/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};