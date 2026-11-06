"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";

export function GuestLoginForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/guest/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(data.error ?? "That reservation code didn't open a stay.");

      router.replace(data.redirect ?? "/welcome");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "That reservation code didn't open a stay.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label htmlFor="reservation-code" className="field-label">
          Reservation code
        </label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" />
          <input
            id="reservation-code"
            name="code"
            required
            autoFocus
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-invalid={error ? true : undefined}
            placeholder="CB-K4YCU"
            className="field-input pl-10 font-mono tracking-[0.14em] uppercase"
          />
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          It is in the arrival message from your host, usually in the form CB-K4YCU.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800"
        >
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary h-11 w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {submitting ? "Opening your stay…" : "Open my stay"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
