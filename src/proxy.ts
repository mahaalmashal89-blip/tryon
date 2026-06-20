/**
 * Auth proxy stub — refreshes Supabase session on every request.
 * Uncomment and configure once Supabase auth is wired up.
 * File renamed from middleware.ts to proxy.ts (Next.js 16 convention).
 */

import { type NextRequest, NextResponse } from "next/server";

// import { createServerClient } from "@supabase/ssr";

export function proxy(request: NextRequest) {
  // Stub: pass all requests through.
  // Replace with real Supabase session refresh when auth is ready.
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
