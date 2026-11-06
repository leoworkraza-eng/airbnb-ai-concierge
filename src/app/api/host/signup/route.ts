import { NextResponse } from "next/server";
import { z } from "zod";
import { signUpHost } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";

/* Creates a confirmed Supabase account and signs it in. The email step is
   skipped so the demo never depends on an inbox, and the password is only ever
   held by Supabase auth — this application stores no credentials. */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let parsed: z.infer<typeof signupSchema>;
  try {
    parsed = signupSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Please check your details."
        : "Please check your details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = await signUpHost(parsed);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
