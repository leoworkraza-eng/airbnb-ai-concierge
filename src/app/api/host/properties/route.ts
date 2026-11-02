import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { propertySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let parsed: z.infer<typeof propertySchema>;
  try {
    parsed = propertySchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Please check the property details."
        : "Please check the property details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const repo = await getHostRepo();
    const property = await repo.createProperty(session.hostId, {
      ...parsed,
      settings:
        parsed.settings ?? {
          tone: "warm",
          extraInstructions: "",
          servicePreferences: "",
          escalationInstructions: "",
        },
    });
    return NextResponse.json({ property });
  } catch (error) {
    console.error("[host/properties] create failed", error);
    return NextResponse.json(
      { error: "The property could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
