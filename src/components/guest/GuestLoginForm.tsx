"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, UserRound } from "lucide-react";

export function GuestLoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [lastName, setLastName] = useState("");
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
        body: JSON.stringify({ email, lastName }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "We couldn't match those details to a stay.");
      }

      router.replace(data.redirect ?? "/welcome");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't match those details to a stay.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label htmlFor="guest-email" className="field-label">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" />
          <input
            id="guest-email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            maxLength={160}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error ? true : undefined}
            placeholder="you@example.com"
            className="field-input pl-10"
          />
        </div>
      </div>

      <div>
        <label htmlFor="guest-last-name" className="field-label">
          Last name
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" />
          <input
            id="guest-last-name"
            name="lastName"
            required
            autoComplete="family-name"
            maxLength={80}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            aria-invalid={error ? true : undefined}
            placeholder="Rivera"
            className="field-input pl-10"
          />
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          Use the email and surname on your booking. No password, no code.
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
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
        {submitting ? "Opening your profile…" : "Open my profile"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
