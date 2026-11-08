"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

export function SummaryButton({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(
              `/api/host/conversations/${conversationId}/summary`,
              { method: "POST" },
            );
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) throw new Error(data.error ?? "Summary failed.");
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Summary failed.");
          } finally {
            setLoading(false);
          }
        }}
        className="btn-secondary btn-sm"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5 text-brand" />
        )}
        {loading ? "Summarising…" : "Generate summary"}
      </button>
      {error ? <p className="mt-1.5 text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}
