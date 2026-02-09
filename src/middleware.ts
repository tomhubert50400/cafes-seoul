import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const SENSITIVE_API_PATHS = ['/api/submissions', '/api/photos'];

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    const isSensitive = SENSITIVE_API_PATHS.some((p) => pathname.startsWith(p));
    const isWrite = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

    const tier = isSensitive && isWrite
      ? RATE_LIMITS.SENSITIVE
      : isWrite
        ? RATE_LIMITS.AUTH_WRITE
        : RATE_LIMITS.PUBLIC_READ;

    const result = rateLimit(`${ip}:${isWrite ? 'write' : 'read'}`, tier.limit, tier.windowMs);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
