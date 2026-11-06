import { NextResponse } from "next/server";
import { enterDemoHost } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/* Opens the demo host dashboard without the Supabase dashboard step. The route
   only ever touches the account named by DEMO_HOST_EMAIL, which is seeded by the
   application itself. */
export async function POST() {
  const limit = rateLimit("host-demo", 10, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `One moment — try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const result = await enterDemoHost();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
