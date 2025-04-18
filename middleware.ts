import type { NextRequest } from "next/server";

import { updateSession } from "./supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
  // const url = request.nextUrl;
  // const hostname = request.headers.get("host") || "";
  // // const isAppSubdomain = hostname.startsWith("app.");
  // const isDevelopment = process.env.NEXT_PUBLIC_CONTEXT === "development";
  // const protocol = isDevelopment ? "http" : "https";

  // If we're on the app subdomain

  // If we're on the root domain and trying to access app routes, redirect to app subdomain
  // if (
  //   (!isAppSubdomain &&
  //     (url.pathname.startsWith("/posts") ||
  //       url.pathname.startsWith("/explore") ||
  //       url.pathname.startsWith("/join") ||
  //       url.pathname === "/feed")) ||
  //   url.pathname.startsWith("/statements")
  // ) {
  //   return NextResponse.redirect(
  //     `${protocol}://app.${hostname}${url.pathname}`,
  //   );
  // }
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api|_next|static|[\\w-]+\\.\\w+).*)",
  ],
};
