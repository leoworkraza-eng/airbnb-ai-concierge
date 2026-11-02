import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { statusSchema } from "@/lib/validation";

const schema = z.object({ status: statusSchema });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const repo = await getHostRepo();
  const properties = await repo.listProperties(session.hostId);
  const propertyIds = properties.map((property) => property.id);

  if (!propertyIds.length) {
    return NextResponse.json({ error: "No properties on this account." }, { status: 403 });
  }

  try {
    const updated = await repo.updateMaintenanceStatus(id, parsed.status, propertyIds);
    if (!updated) {
      return NextResponse.json(
        { error: "That ticket isn't on one of your properties." },
        { status: 404 },
      );
    }
    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("[host/maintenance] status update failed", error);
    return NextResponse.json(
      { error: "The status could not be updated." },
      { status: 500 },
    );
  }
}
