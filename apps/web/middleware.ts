import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.png");

  if (isPublicRoute || isAsset) {
    return NextResponse.next();
  }

  const token = request.cookies.get("operix_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};