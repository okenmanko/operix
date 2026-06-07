import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/",
  "/clients",
  "/debts",
  "/payments",
  "/reports",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  });

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("operix_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/clients/:path*", "/debts/:path*", "/payments/:path*", "/reports/:path*", "/settings/:path*"],
};