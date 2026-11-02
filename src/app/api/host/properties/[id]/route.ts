import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { propertySchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  let parsed: Partial<z.infer<typeof propertySchema>>;
  try {
    parsed = propertySchema.partial().parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Please check the property details."
        : "Please check the property details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const repo = await getHostRepo();
    // The repository scopes the update to the signed-in host (RLS in Supabase).
    const property = await repo.updateProperty(id, session.hostId, parsed);
    if (!property) {
      return NextResponse.json(
        { error: "That property wasn't found on your account." },
        { status: 404 },
      );
    }
    return NextResponse.json({ property });
  } catch (error) {
    console.error("[host/properties] update failed", error);
    return NextResponse.json(
      { error: "The changes could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
