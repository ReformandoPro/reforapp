import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Only protect /app/* (and allow the demo public routes to remain public).
  // Fast path: if there's no auth cookie at all, redirect immediately.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("auth-token"));

  if (!hasAuthCookie) {
    const redirectUrl = new URL("/login", request.url);
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set("redirectTo", returnTo);
    return NextResponse.redirect(redirectUrl);
  }

  const { supabase, response } = createMiddlewareSupabaseClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set("redirectTo", returnTo);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};

