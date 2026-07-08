import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appConfig } from "@/lib/config/app";
import { env } from "@/lib/config/env";

const protectedRoutes = [
  "/dashboard",
  "/practice",
  "/learn",
  "/profile",
  "/analytics",
  "/leaderboard",
  "/rewards",
  "/battle",
  "/community",
  "/events",
  "/mentors",
  "/notes",
  "/questions",
  "/interview",
  "/teacher",
];

const publicRoutes = ["/login", "/onboarding", "/demo", "/demo-live"];
const secret = new TextEncoder().encode(env.JWT_SECRET);

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isPublicRoute(pathname: string) {
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/")
  );
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname) || !isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(appConfig.auth.sessionCookieName)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/practice/:path*",
    "/learn/:path*",
    "/profile/:path*",
    "/analytics/:path*",
    "/leaderboard/:path*",
    "/rewards/:path*",
    "/battle/:path*",
    "/community/:path*",
    "/events/:path*",
    "/mentors/:path*",
    "/notes/:path*",
    "/questions/:path*",
    "/interview/:path*",
    "/teacher/:path*",
  ],
};
