import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { budgetForPath, checkRateLimit, clientKey } from "@/lib/security/rate-limit";

const hits = new Map<string, number[]>();

/**
 * API rate limiting: fixed window per client IP (uploads stricter).
 * In-memory per instance — correct on long-lived servers, approximate on
 * serverless (see ARCHITECTURE.md). Rejected callers get JSON + Retry-After.
 */
export default function proxy(request: NextRequest) {
  const budget = budgetForPath(request.nextUrl.pathname, request.method);
  const key = `${clientKey(request.headers.get("x-forwarded-for"))}:${request.nextUrl.pathname}`;
  const result = checkRateLimit(hits, key, Date.now(), budget);
  if (!result.allowed) {
    return NextResponse.json(
      {
        code: "rate-limited",
        message: "Too many requests. Wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil(result.resetMs / 1000)).toString(),
        },
      },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
