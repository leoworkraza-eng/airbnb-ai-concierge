"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
          const response = await fetch("/api/host/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password }),
          });
          const data = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(data.error ?? "The account could not be created.");

          router.replace("/host");
          router.refresh();
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "The account could not be created.",
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <label htmlFor="signup-name" className="field-label">
          Your name
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="field-input"
          placeholder="Marta Serra"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="field-label">
          Email address
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input"
          placeholder="you@yourproperty.com"
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="field-label">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
          placeholder="At least 8 characters"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          The account is confirmed immediately so no email step is needed. Your password
          is held by Supabase auth, never by this app.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary h-11 w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {submitting ? "Creating your account…" : "Create host account"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
