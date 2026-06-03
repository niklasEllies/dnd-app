import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/** Paths reachable without a session. Everything else requires auth. */
const PUBLIC_PATHS = ["/", "/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the Supabase auth session on every request and gates protected
 * routes. Must run in middleware so the refreshed tokens are written back to
 * cookies before Server Components read them.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  // getUser() revalidates the token with the Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Build a redirect that carries over any cookies Supabase rotated during the
  // getUser() call above. A token refresh that coincides with a redirect would
  // otherwise drop the new Set-Cookie headers and cause intermittent logouts.
  const redirectWithSession = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // Unauthenticated user on a protected route -> send to login (preserve target).
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the full target incl. query (e.g. /join?code=…) through login.
    url.search = "";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return redirectWithSession(url);
  }

  // Authenticated user on the login page -> send to their intended target.
  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    url.search = "";
    return redirectWithSession(url);
  }

  // IMPORTANT: return the supabaseResponse object as-is so refreshed cookies
  // are preserved.
  return supabaseResponse;
}
