import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestRepo } from "@/lib/data";
import { getGuestContext } from "@/lib/guest-context";
import { rateLimit } from "@/lib/rate-limit";
import { priorityLabels } from "@/lib/utils";

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue in a little more detail.")
    .max(2000),
  category: z.enum(["maintenance", "assistance", "service"]),
  urgent: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const context = await getGuestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Your guest session has ended. Start the demo again from the home page." },
      { status: 401 },
    );
  }

  const limit = rateLimit(`requests:${context.guest.id}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Please wait ${limit.retryAfter}s before submitting another request.` },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Please check the form."
        : "Please check the form.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const repo = await getGuestRepo();
  const priority = parsed.urgent ? "urgent" : "normal";

  try {
    const ticket = await repo.createMaintenanceRequest({
      propertyId: context.property.id,
      guestSessionId: context.guest.id,
      guestName: context.guest.guestName,
      description: parsed.description,
      category: parsed.category,
      priority,
      urgencyNote: parsed.urgent ? "Guest marked this as urgent in the support form." : "",
    });

    await repo.createNotification({
      hostId: context.property.hostId,
      propertyId: context.property.id,
      message: `${context.guest.guestName} submitted ${
        parsed.category === "maintenance" ? "a maintenance request" : `an ${parsed.category} request`
      }: ${parsed.description.slice(0, 140)} (${ticket.ticketCode}).`,
      type: parsed.urgent ? "maintenance" : "service",
    });

    return NextResponse.json({
      ticket: {
        code: ticket.ticketCode,
        priority: ticket.priority,
        priorityLabel: priorityLabels[ticket.priority],
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    console.error("[requests] Could not save maintenance request", error);
    return NextResponse.json(
      {
        error:
          "We couldn't save that request. Please try again, or contact your host directly.",
      },
      { status: 500 },
    );
  }
}
