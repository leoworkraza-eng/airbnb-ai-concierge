import { NextResponse } from "next/server";
import { signUpHost } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { hostSignupSchema } from "@/lib/validation";

/* Creates a confirmed Supabase account, signs it in, and saves the host's first
   offering. No email confirmation step, and no seeded property the host did not
   describe. */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const limit = rateLimit(`host-signup:${ip}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please wait ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = hostSignupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const result = await signUpHost({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
    offering: {
      name: data.offeringName,
      type: data.offeringType,
      category: data.offeringCategory,
      city: data.city,
      neighbourhood: data.neighbourhood,
      description: data.description,
      address: data.address,
      hostName: data.fullName,
      hostEmail: data.email,
      priceLabel: data.priceLabel,
      duration: data.duration,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
