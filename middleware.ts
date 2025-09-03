import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2);
    const url = req.nextUrl.clone();
    url.pathname = `/u/${username}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
