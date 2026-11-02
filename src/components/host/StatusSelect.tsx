"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { statusLabels } from "@/lib/utils";
import type { MaintenanceStatus } from "@/lib/types";

export function StatusSelect({
  requestId,
  status,
}: {
  requestId: string;
  status: MaintenanceStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<MaintenanceStatus>(status);
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(next: MaintenanceStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/host/maintenance/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Could not update the ticket.");
      }
      startTransition(() => router.refresh());
    } catch (caught) {
      setValue(previous);
      setError(caught instanceof Error ? caught.message : "Could not update the ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[132px]">
      <div className="relative">
        <select
          value={value}
          disabled={saving}
          onChange={(event) => void update(event.target.value as MaintenanceStatus)}
          aria-label={`Status for ticket`}
          className="w-full appearance-none rounded-full border border-line bg-white py-1.5 pr-7 pl-3 text-[11.5px] font-medium text-ink-soft outline-none transition focus:border-ink/30 disabled:opacity-60"
        >
          {(Object.keys(statusLabels) as MaintenanceStatus[]).map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
        {saving || pending ? (
          <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted" />
        ) : (
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[9px] text-muted">
            ▾
          </span>
        )}
      </div>
      {error ? <p className="mt-1 text-[10.5px] text-red-700">{error}</p> : null}
    </div>
  );
}
