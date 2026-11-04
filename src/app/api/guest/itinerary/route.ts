import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestContext } from "@/lib/guest-context";
import { getGuestRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { planStay, stayDayCount } from "@/lib/itinerary";
import { rateLimit } from "@/lib/rate-limit";

/* ---------------------------------------------------------------------------
   The guest's plan.

   Every mutation is scoped to the guest session in the signed cookie — an id
   from the browser is never trusted on its own — and every response returns the
   saved list so the client never drifts from the database.
   --------------------------------------------------------------------------- */

export const dynamic = "force-dynamic";

const slotSchema = z.enum(["morning", "afternoon", "evening"]);

const postSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("build") }),
  z.object({
    action: z.literal("add"),
    day: z.coerce.number().int().min(1).max(14),
    slot: slotSchema,
    title: z.string().trim().min(2, "Give the stop a name.").max(120),
    placeId: z.string().trim().max(80).nullish(),
    notes: z.string().trim().max(240).optional(),
  }),
]);

const patchSchema = z.object({
  id: z.string().min(1),
  done: z.boolean().optional(),
  title: z.string().trim().min(2).max(120).optional(),
});

function failure(error: unknown) {
  if (error instanceof MigrationRequiredError) {
    return NextResponse.json({ error: error.message, migration: true }, { status: 409 });
  }
  console.error("[guest/itinerary]", error);
  return NextResponse.json(
    { error: "Your plan couldn't be saved just now. Please try again." },
    { status: 500 },
  );
}

async function context() {
  const guest = await getGuestContext();
  if (!guest) {
    return {
      error: NextResponse.json(
        { error: "Your guest session has ended. Start the demo again from the home page." },
        { status: 401 },
      ),
    };
  }

  const limit = rateLimit(`itinerary:${guest.guest.id}`, 30, 60_000);
  if (!limit.allowed) {
    return {
      error: NextResponse.json(
        { error: `One moment — try again in ${limit.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      ),
    };
  }

  return guest;
}

export async function POST(request: Request) {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "That stop isn't valid."
        : "That stop isn't valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const repo = await getGuestRepo();

  try {
    if (body.action === "build") {
      const days = stayDayCount(ctx.guest.checkInDate, ctx.guest.checkOutDate);
      const stops = planStay({
        days,
        interests: ctx.guest.preferences.interests,
      });

      if (!stops.length) {
        return NextResponse.json(
          { error: "The guide has nothing to build a plan from yet." },
          { status: 409 },
        );
      }

      await repo.clearItinerary(ctx.guest.id);
      for (const stop of stops) {
        await repo.addItineraryItem({
          guestSessionId: ctx.guest.id,
          propertyId: ctx.property.id,
          day: stop.day,
          slot: stop.slot,
          title: stop.title,
          placeId: stop.placeId,
          notes: stop.notes,
        });
      }
    } else {
      await repo.addItineraryItem({
        guestSessionId: ctx.guest.id,
        propertyId: ctx.property.id,
        day: body.day,
        slot: body.slot,
        title: body.title,
        placeId: body.placeId ?? null,
        notes: body.notes ?? "",
      });
    }

    return NextResponse.json({ items: await repo.listItinerary(ctx.guest.id) });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request) {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That change isn't valid." }, { status: 400 });
  }

  const repo = await getGuestRepo();

  try {
    const updated = await repo.updateItineraryItem(body.id, ctx.guest.id, {
      done: body.done,
      title: body.title,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "That stop is no longer in your plan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ items: await repo.listItinerary(ctx.guest.id) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;

  const params = new URL(request.url).searchParams;
  const repo = await getGuestRepo();

  try {
    if (params.get("all") === "1") {
      await repo.clearItinerary(ctx.guest.id);
      return NextResponse.json({ items: [] });
    }

    const id = params.get("id");
    if (!id) {
      return NextResponse.json({ error: "Which stop should be removed?" }, { status: 400 });
    }

    const removed = await repo.removeItineraryItem(id, ctx.guest.id);
    if (!removed) {
      return NextResponse.json(
        { error: "That stop is no longer in your plan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ items: await repo.listItinerary(ctx.guest.id) });
  } catch (error) {
    return failure(error);
  }
}
