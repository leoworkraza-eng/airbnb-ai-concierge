import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { reservationStatusSchema } from "@/lib/validation";

const schema = z.object({ status: reservationStatusSchema });

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
    return NextResponse.json({ error: "Unknown reservation status." }, { status: 400 });
  }

  try {
    const repo = await getHostRepo();
    const properties = await repo.listProperties(session.hostId);
    const propertyIds = properties.map((property) => property.id);

    if (!propertyIds.length) {
      return NextResponse.json(
        { error: "No properties on this account." },
        { status: 403 },
      );
    }

    const updated = await repo.updateReservationStatus(id, parsed.status, propertyIds);
    if (!updated) {
      return NextResponse.json(
        { error: "That reservation isn't on one of your properties." },
        { status: 404 },
      );
    }

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: error.message, migrationRequired: true },
        { status: 409 },
      );
    }
    console.error("[host/reservations] status update failed", error);
    return NextResponse.json(
      { error: "The status could not be updated." },
      { status: 500 },
    );
  }
}
