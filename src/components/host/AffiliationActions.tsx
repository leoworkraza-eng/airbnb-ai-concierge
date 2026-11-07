"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import type { AffiliationStatus } from "@/lib/types";

export function AffiliationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<AffiliationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: Exclude<AffiliationStatus, "pending">) {
    setBusy(status);
    setError(null);
    try {
      const response = await fetch(`/api/host/affiliations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "That request could not be updated.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That request could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="text-right">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setStatus("declined")}
          disabled={busy !== null}
          className="btn-secondary btn-sm"
        >
          {busy === "declined" ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
          Decline
        </button>
        <button
          type="button"
          onClick={() => setStatus("accepted")}
          disabled={busy !== null}
          className="btn-primary btn-sm"
        >
          {busy === "accepted" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Accept
        </button>
      </div>
      {error ? <p className="mt-1.5 text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}
