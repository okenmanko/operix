import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/super-login"];

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  );
}

function parseJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAsset(pathname)) return NextResponse.next();

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("operix_token")?.value;

  if (!token) {
    if (pathname.startsWith("/super-admin")) {
      return NextResponse.redirect(new URL("/super-login", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = parseJwtPayload(token);

  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("operix_token");
    return res;
  }

  if (pathname.startsWith("/super-admin")) {
    if (payload.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (payload.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/super-admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};