"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";

export function LoginForm({
  demo,
}: {
  demo?: { email: string; password: string };
}) {
  const router = useRouter();
  const [email, setEmail] = useState(demo?.email ?? "");
  const [password, setPassword] = useState(demo?.password ?? "");
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
          const response = await fetch("/api/host/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(data.error ?? "Sign-in failed.");

          router.replace("/host");
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Sign-in failed.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <label htmlFor="host-email" className="field-label">
          Email address
        </label>
        <input
          id="host-email"
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
        <label htmlFor="host-password" className="field-label">
          Password
        </label>
        <input
          id="host-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary h-11 w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        {submitting ? "Signing in…" : "Sign in to dashboard"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>

      {demo ? (
        <button
          type="button"
          onClick={() => {
            setEmail(demo.email);
            setPassword(demo.password);
          }}
          className="w-full rounded-xl border border-dashed border-line px-3 py-2 text-[11.5px] text-muted transition hover:border-ink/25 hover:text-ink"
        >
          Fill the demo host credentials
        </button>
      ) : null}
    </form>
  );
}
