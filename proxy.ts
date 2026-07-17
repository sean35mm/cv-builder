import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';
import { NextResponse } from 'next/server';
import {
  classifyRequestHost,
  hasSingleHostHeaderValue,
  isAllowedCustomHostPath,
} from '@/lib/custom-domains/host-routing';
import { getHostRoutingConfig } from '@/lib/custom-domains/server-config';

const privateNotFound = () =>
  new NextResponse(null, {
    status: 404,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });

export default convexAuthNextjsMiddleware((request) => {
  const { pathname } = request.nextUrl;
  if (!hasSingleHostHeaderValue(request.headers)) return privateNotFound();
  const host = classifyRequestHost(
    request.headers.get('host'),
    getHostRoutingConfig()
  );
  if (host.kind === 'invalid') return privateNotFound();
  if (host.kind === 'custom') {
    if (!isAllowedCustomHostPath(pathname)) return privateNotFound();
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/host-profile';
      const response = NextResponse.rewrite(url);
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }
    if (/^\/[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/host-profile';
      url.searchParams.set('locale', pathname.slice(1));
      const response = NextResponse.rewrite(url);
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }
    return NextResponse.next();
  }
  if (pathname.startsWith('/@')) {
    const username = pathname.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = `/u/${username}`;
    const response = NextResponse.rewrite(url);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }
});

export const config = {
  matcher: '/:path*',
};
