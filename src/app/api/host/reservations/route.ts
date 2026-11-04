import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getHostRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { reservationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let parsed: z.infer<typeof reservationSchema>;
  try {
    parsed = reservationSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Check the reservation details."
        : "Check the reservation details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const repo = await getHostRepo();
    const properties = await repo.listProperties(session.hostId);
    if (!properties.some((property) => property.id === parsed.propertyId)) {
      return NextResponse.json(
        { error: "That property isn't on this account." },
        { status: 403 },
      );
    }

    const reservation = await repo.createReservation(session.hostId, {
      ...parsed,
      source: "manual",
      status: "upcoming",
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: error.message, migrationRequired: true },
        { status: 409 },
      );
    }
    console.error("[host/reservations] create failed", error);
    return NextResponse.json(
      { error: "The reservation could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
