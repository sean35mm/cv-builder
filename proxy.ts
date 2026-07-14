import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';
import { NextResponse } from 'next/server';

export default convexAuthNextjsMiddleware((request) => {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/@')) {
    const username = pathname.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = `/u/${username}`;
    return NextResponse.rewrite(url);
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
