import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/super-login"];

function base64UrlToBytes(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function safeJsonParse<T = any>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function verifyJwtHS256(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerRaw, payloadRaw, signatureRaw] = parts;
  const header = safeJsonParse<{ alg?: string }>(
    new TextDecoder().decode(base64UrlToBytes(headerRaw)),
  );

  if (!header || header.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signatureRaw),
    new TextEncoder().encode(`${headerRaw}.${payloadRaw}`),
  );

  if (!ok) return null;

  const payload = safeJsonParse<any>(
    new TextDecoder().decode(base64UrlToBytes(payloadRaw)),
  );

  if (!payload) return null;
  if (payload.exp && Date.now() / 1000 > Number(payload.exp)) return null;

  return payload;
}

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.png") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  );
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    ""
  );
}

function isIpAllowed(request: NextRequest) {
  const raw = process.env.SUPER_ADMIN_ALLOWED_IPS || "";
  const allowed = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const ip = getClientIp(request);
  if (!ip && process.env.NODE_ENV !== "production") return true;

  return allowed.includes(ip) || allowed.includes("*");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAsset(pathname)) return NextResponse.next();

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("operix_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const secret = process.env.JWT_SECRET || "operix_super_secret_123";
  const payload = await verifyJwtHS256(token, secret);

  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("operix_token");
    return res;
  }

  if (pathname.startsWith("/super-admin")) {
    if (payload.role !== "SUPER_ADMIN" || !isIpAllowed(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (!pathname.startsWith("/super-admin") && payload.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/super-admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};
