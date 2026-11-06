"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";

export function GuestAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/guest/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "That email and password didn't work.");
      }

      router.replace(data.redirect ?? "/welcome");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That email and password didn't work.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label htmlFor="guest-account-email" className="field-label">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" />
          <input
            id="guest-account-email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            maxLength={160}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input pl-10"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="guest-account-password" className="field-label">
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted" />
          <input
            id="guest-account-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field-input pl-10"
            placeholder="Your password"
          />
        </div>
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
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
        {submitting ? "Signing in…" : "Sign in to my account"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
