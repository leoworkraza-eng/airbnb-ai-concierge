"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock3, Loader2, UserPlus, X } from "lucide-react";
import type { AffiliationStatus } from "@/lib/types";

export function AffiliationButton({
  hostId,
  propertyId,
  reservationId,
  hostName,
  signedIn,
  initialStatus = null,
  nextPath,
}: {
  hostId: string;
  propertyId: string;
  reservationId?: string | null;
  hostName: string;
  signedIn: boolean;
  initialStatus?: AffiliationStatus | null;
  nextPath: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AffiliationStatus | null>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!signedIn) {
    return (
      <Link
        href={`/guest/login?next=${encodeURIComponent(nextPath)}`}
        className="btn-primary"
      >
        <UserPlus className="size-4" /> Sign in to connect
      </Link>
    );
  }

  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-800">
        <Check className="size-3.5" /> Connected with {hostName}
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
        <Clock3 className="size-3.5" /> Request pending
      </span>
    );
  }

  async function requestAffiliation() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/guest/affiliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId, propertyId, reservationId: reservationId ?? null }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        affiliation?: { status: AffiliationStatus };
      };
      if (response.status === 401) {
        router.push(`/guest/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "The request could not be sent.");
      setStatus(data.affiliation?.status ?? "pending");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The request could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {status === "declined" ? (
        <p className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] text-muted">
          <X className="size-3.5" /> This host declined earlier. You can ask again.
        </p>
      ) : null}
      <button
        type="button"
        onClick={requestAffiliation}
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {submitting ? "Sending request…" : "Ask to connect"}
      </button>
      {error ? <p className="mt-2 text-[11.5px] text-red-700">{error}</p> : null}
    </div>
  );
}
