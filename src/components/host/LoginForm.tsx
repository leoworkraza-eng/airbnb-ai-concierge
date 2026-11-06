"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";

export function LoginForm({
  demo,
}: {
  demo?: { email: string; password: string };
}) {
  async function enterDemo() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/host/demo", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not open the demo dashboard.");

      router.replace("/host");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the demo dashboard.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <>
          <div className="flex items-center gap-3 text-[10.5px] tracking-[0.18em] text-muted uppercase">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={() => void enterDemo()}
            disabled={submitting}
            className="btn-secondary h-11 w-full"
          >
            Enter the demo host dashboard
            <ArrowRight className="size-4" />
          </button>
          <p className="text-center text-[11px] leading-relaxed text-muted">
            Signs in as <span className="font-mono">{demo.email}</span>. The account is
            created automatically on first use — no Supabase dashboard step.
          </p>
        </>
      ) : null}
    </form>
  );
}
