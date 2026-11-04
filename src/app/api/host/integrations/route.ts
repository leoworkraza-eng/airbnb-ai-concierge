import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHostSession } from "@/lib/auth";
import { getServiceRepo } from "@/lib/data";
import { MigrationRequiredError } from "@/lib/data/repo";
import { integrationActionSchema } from "@/lib/validation";
import type { IntegrationEvent } from "@/lib/types";

const PENDING_NOTE =
  "Connection details saved server-side. Airbnb grants API access per partner programme, so this stays pending until an approved app completes the authorisation flow. Nothing is sent to Airbnb today.";

const DEMO_NOTE =
  "Demo connection enabled. No Airbnb account is linked and no live data is imported — reservations in this workspace stay manually entered or sample rows.";

const SYNC_DEMO_ERROR =
  "This is a demo connection with no Airbnb transport, so there is nothing to sync. Reservations stay as they are.";
const SYNC_PENDING_ERROR =
  "Airbnb has not authorised this connection, so the sync was not attempted. No reservation data was imported.";

function event(kind: IntegrationEvent["kind"], message: string): IntegrationEvent {
  return { at: new Date().toISOString(), kind, message };
}

export async function POST(request: Request) {
  const session = await requireHostSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let parsed: z.infer<typeof integrationActionSchema>;
  try {
    parsed = integrationActionSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "That action isn't recognised."
        : "That action isn't recognised.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const repo = await getServiceRepo();
    const current = await repo.getIntegration(session.hostId);
    const history = current?.events ?? [];

    if (parsed.action === "save_credentials") {
      const integration = await repo.saveIntegration(session.hostId, {
        status: "pending_verification",
        mode: "oauth",
        accountRef: parsed.accountRef || current?.accountRef || "",
        lastError: "",
        credentials: {
          clientId: parsed.clientId,
          clientSecret: parsed.clientSecret,
        },
        events: [event("info", PENDING_NOTE), ...history],
      });
      return NextResponse.json({ integration });
    }

    if (parsed.action === "demo") {
      const integration = await repo.saveIntegration(session.hostId, {
        status: "demo",
        mode: "demo",
        accountRef: "casa-barcelona-demo",
        lastError: "",
        events: [event("info", DEMO_NOTE), ...history],
      });
      return NextResponse.json({ integration });
    }

    if (parsed.action === "sync") {
      const isDemo = current?.status === "demo";
      const message = isDemo ? SYNC_DEMO_ERROR : SYNC_PENDING_ERROR;
      const integration = await repo.saveIntegration(session.hostId, {
        status: isDemo ? "demo" : current?.status ?? "pending_verification",
        lastSyncAt: new Date().toISOString(),
        lastError: message,
        events: [event("error", message), ...history],
      });
      return NextResponse.json({ integration, error: message }, { status: 409 });
    }

    // disconnect
    const integration = await repo.saveIntegration(session.hostId, {
      status: "not_connected",
      mode: "oauth",
      accountRef: "",
      lastSyncAt: null,
      lastError: "",
      credentials: null,
      events: [
        event("info", "Connection record cleared and stored credentials deleted."),
        ...history,
      ],
    });
    return NextResponse.json({ integration });
  } catch (error) {
    if (error instanceof MigrationRequiredError) {
      return NextResponse.json(
        { error: error.message, migrationRequired: true },
        { status: 409 },
      );
    }
    console.error("[host/integrations] action failed", error);
    return NextResponse.json(
      { error: "The connection could not be updated. Please try again." },
      { status: 500 },
    );
  }
}
