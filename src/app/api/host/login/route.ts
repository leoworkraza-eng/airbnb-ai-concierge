import { NextResponse } from "next/server";
import { z } from "zod";
import { signInHost } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`login:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof loginSchema>;
  try {
    parsed = loginSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Please check your details."
        : "Please check your details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = await signInHost(parsed.email, parsed.password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
