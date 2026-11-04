"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Plug, RefreshCw, Unplug } from "lucide-react";
import { Card, Field } from "@/components/ui";
import type { HostIntegration } from "@/lib/types";

type Action = "save_credentials" | "demo" | "sync" | "disconnect";

const successCopy: Record<Action, string> = {
  save_credentials:
    "Saved server-side. The connection stays pending until an approved Airbnb app completes the authorisation flow.",
  demo: "Demo connection enabled. No Airbnb account is linked.",
  sync: "Sync finished.",
  disconnect: "Connection record cleared and any stored credentials deleted.",
};

export function AirbnbConnectionForm({
  integration,
  migrationPending,
}: {
  integration: HostIntegration | null;
  migrationPending: boolean;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accountRef, setAccountRef] = useState(integration?.accountRef ?? "");
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  async function run(action: Action) {
    setBusy(action);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === "save_credentials") {
        body.clientId = clientId;
        body.clientSecret = clientSecret;
        body.accountRef = accountRef;
      }

      const response = await fetch("/api/host/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "The request failed." });
        router.refresh();
        return;
      }

      setMessage({ tone: "ok", text: successCopy[action] });
      if (action === "save_credentials") {
        setClientId("");
        setClientSecret("");
      }
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "The request could not be sent." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">Connection details</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Credentials are written straight to the server-side connection record. They are
        never returned to the browser, never logged, and never placed in a client
        component.
      </p>

      {migrationPending ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed text-amber-900">
          The connection table is not created yet. Run the migration in{" "}
          <code className="font-mono text-[11.5px]">
            supabase/migrations/2026-11-reservations-and-integrations.sql
          </code>{" "}
          to store connection details.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Client ID" htmlFor="clientId">
          <input
            id="clientId"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="field-input"
            placeholder="From your approved partner account"
            autoComplete="off"
          />
        </Field>
        <Field label="Client secret" htmlFor="clientSecret" hint="Stored server-side only.">
          <input
            id="clientSecret"
            type="password"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            className="field-input"
            placeholder="••••••••••••"
            autoComplete="new-password"
          />
        </Field>
        <Field
          label="Account reference"
          htmlFor="accountRef"
          className="sm:col-span-2"
          hint="Optional label for the Airbnb account this connection belongs to."
        >
          <input
            id="accountRef"
            value={accountRef}
            onChange={(event) => setAccountRef(event.target.value)}
            className="field-input"
            placeholder="Casa Barcelona — host account"
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={migrationPending || busy !== null || !clientId || !clientSecret}
          onClick={() => void run("save_credentials")}
          className="btn-primary btn-sm"
        >
          {busy === "save_credentials" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plug className="size-3.5" />
          )}
          Save connection details
        </button>
        <button
          type="button"
          disabled={migrationPending || busy !== null}
          onClick={() => void run("demo")}
          className="btn-secondary btn-sm"
        >
          {busy === "demo" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plug className="size-3.5" />
          )}
          Enable demo connection
        </button>
        <button
          type="button"
          disabled={migrationPending || busy !== null || !integration}
          onClick={() => void run("sync")}
          className="btn-secondary btn-sm"
        >
          {busy === "sync" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Attempt sync
        </button>
        {integration && integration.status !== "not_connected" ? (
          <button
            type="button"
            disabled={migrationPending || busy !== null}
            onClick={() => void run("disconnect")}
            className="btn-secondary btn-sm text-red-700"
          >
            {busy === "disconnect" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            Disconnect
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          className={`mt-3 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] leading-relaxed ${
            message.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.tone === "ok" ? (
            <Check className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          )}
          {message.text}
        </p>
      ) : null}
    </Card>
  );
}
