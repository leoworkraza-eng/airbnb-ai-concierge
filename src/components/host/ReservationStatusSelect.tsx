"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { reservationStatusLabels } from "@/lib/reservations";
import type { ReservationStatus } from "@/lib/types";

/* Inline status control on the reservations list. The optimistic value is
   reverted if the server rejects the change, so the list never lies. */

export function ReservationStatusSelect({
  id,
  status,
}: {
  id: string;
  status: ReservationStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ReservationStatus>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: ReservationStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/host/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update the status.");
      router.refresh();
    } catch (caught) {
      setValue(previous);
      setError(caught instanceof Error ? caught.message : "Could not update the status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-right">
      <label className="sr-only" htmlFor={`status-${id}`}>
        Reservation status
      </label>
      <div className="relative inline-flex items-center">
        <select
          id={`status-${id}`}
          value={value}
          disabled={saving}
          onChange={(event) => void change(event.target.value as ReservationStatus)}
          className="field-input h-8 w-[136px] py-0 text-[11.5px]"
        >
          {(Object.keys(reservationStatusLabels) as ReservationStatus[]).map((key) => (
            <option key={key} value={key}>
              {reservationStatusLabels[key]}
            </option>
          ))}
        </select>
        {saving ? (
          <Loader2 className="pointer-events-none absolute right-2 size-3 animate-spin text-muted" />
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 max-w-[180px] text-[10px] text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
