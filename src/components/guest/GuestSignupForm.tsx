"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";

export function GuestSignupForm({
  initialEmail = "",
  next,
}: {
  initialEmail?: string;
  next?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/guest/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "The guest account could not be created.");
      }

      const destination =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : (data.redirect ?? "/welcome");
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The guest account could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label htmlFor="guest-signup-name" className="field-label">
          Full name
        </label>
        <input
          id="guest-signup-name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="field-input"
          placeholder="Alex Rivera"
        />
      </div>

      <div>
        <label htmlFor="guest-signup-email" className="field-label">
          Email address
        </label>
        <input
          id="guest-signup-email"
          type="email"
          autoComplete="email"
          required
          maxLength={160}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input"
          placeholder="you@example.com"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          Any valid email works. If it matches a booking, we link the stay. You can
          also join with no booking and browse hosts.
        </p>
      </div>

      <div>
        <label htmlFor="guest-signup-password" className="field-label">
          Password
        </label>
        <input
          id="guest-signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
          placeholder="At least 8 characters"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          Use at least 8 characters.
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
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {submitting ? "Creating your account…" : "Create guest account"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
