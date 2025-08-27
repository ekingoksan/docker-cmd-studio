import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",          // NextAuth callback/oturum uçları
  "/favicon.ico",
];

// Statik dosyalar, _next, asset’ler
function isPublic(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.startsWith("/_next")) return true;
  if (pathname.match(/\.(.*)$/)) return true; // *.png, *.jpg, *.css, *.js, vs.
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  if (isPublic(req)) return NextResponse.next();

  // Oturum var mı?
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  // Giriş yoksa /login'a yönlendir
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

// Tüm routes, ama public olanlar yukarıda filtrelenecek
export const config = {
  matcher: ["/:path*"],
};