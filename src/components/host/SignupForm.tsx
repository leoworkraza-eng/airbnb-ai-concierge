"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
import { Card, Field, Note } from "@/components/ui";
import {
  offeringCategories,
  offeringTypeLabels,
  offeringTypeNotes,
  OFFERING_TYPES,
} from "@/lib/offerings";
import type { OfferingType } from "@/lib/types";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  offeringName: string;
  offeringType: OfferingType;
  offeringCategory: string;
  city: string;
  neighbourhood: string;
  description: string;
  address: string;
  priceLabel: string;
  duration: string;
};

const initial: FormState = {
  fullName: "",
  email: "",
  password: "",
  offeringName: "",
  offeringType: "stay",
  offeringCategory: "Apartment",
  city: "",
  neighbourhood: "",
  description: "",
  address: "",
  priceLabel: "",
  duration: "",
};

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function changeType(type: OfferingType) {
    setForm((current) => ({
      ...current,
      offeringType: type,
      offeringCategory: offeringCategories[type][0],
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/host/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold">Your account</h2>
        <p className="mt-1 text-[12px] text-muted">
          This is how guests see you. Your email is never shown publicly.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="signup-name">
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={form.fullName}
              onChange={(event) => set("fullName", event.target.value)}
              className="field-input"
              placeholder="Marta Serra"
            />
          </Field>
          <Field label="Email" htmlFor="signup-email">
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              maxLength={160}
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              className="field-input"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="Password"
            htmlFor="signup-password"
            className="sm:col-span-2"
            hint="At least 8 characters."
          >
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(event) => set("password", event.target.value)}
              className="field-input"
              placeholder="Choose a password"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold">Your first offering</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          A place, an activity or a service. Keep it short; you can edit it later.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Offering type" htmlFor="offering-type">
            <select
              id="offering-type"
              value={form.offeringType}
              onChange={(event) => changeType(event.target.value as OfferingType)}
              className="field-input"
            >
              {OFFERING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {offeringTypeLabels[type]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted">
              {offeringTypeNotes[form.offeringType]}
            </p>
          </Field>
          <Field label="Category" htmlFor="offering-category">
            <select
              id="offering-category"
              value={form.offeringCategory}
              onChange={(event) => set("offeringCategory", event.target.value)}
              className="field-input"
            >
              {offeringCategories[form.offeringType].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Offering name" htmlFor="offering-name" className="sm:col-span-2">
            <input
              id="offering-name"
              required
              maxLength={120}
              value={form.offeringName}
              onChange={(event) => set("offeringName", event.target.value)}
              className="field-input"
              placeholder="Casa Barcelona · Eixample apartment"
            />
          </Field>
          <Field label="City" htmlFor="offering-city">
            <input
              id="offering-city"
              required
              maxLength={80}
              value={form.city}
              onChange={(event) => set("city", event.target.value)}
              className="field-input"
              placeholder="Barcelona"
            />
          </Field>
          <Field label="Neighbourhood (optional)" htmlFor="offering-neighbourhood">
            <input
              id="offering-neighbourhood"
              maxLength={80}
              value={form.neighbourhood}
              onChange={(event) => set("neighbourhood", event.target.value)}
              className="field-input"
              placeholder="Eixample"
            />
          </Field>
          <Field
            label="Description"
            htmlFor="offering-description"
            className="sm:col-span-2"
            hint="Two or three sentences. Guests read this on your profile."
          >
            <textarea
              id="offering-description"
              required
              minLength={20}
              maxLength={600}
              rows={4}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              className="field-input resize-y"
              placeholder="A restored Eixample apartment with a rooftop terrace, five minutes from Passeig de Gràcia."
            />
          </Field>
          <Field label="Public address or meeting point (optional)" htmlFor="offering-address" className="sm:col-span-2">
            <input
              id="offering-address"
              maxLength={220}
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
              className="field-input"
              placeholder="Carrer de Mallorca 245, Barcelona"
            />
          </Field>
          <Field label="Price guide (optional)" htmlFor="offering-price">
            <input
              id="offering-price"
              maxLength={40}
              value={form.priceLabel}
              onChange={(event) => set("priceLabel", event.target.value)}
              className="field-input"
              placeholder="From €120 / night"
            />
          </Field>
          <Field label="Duration or availability (optional)" htmlFor="offering-duration">
            <input
              id="offering-duration"
              maxLength={80}
              value={form.duration}
              onChange={(event) => set("duration", event.target.value)}
              className="field-input"
              placeholder="Nightly · 2-hour tour · Weekdays"
            />
          </Field>
        </div>
      </Card>

      <Note tone="neutral" className="bg-white">
        Creating an account confirms your email address immediately in this
        prototype. You can add more offerings after signing in.
      </Note>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800"
        >
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary h-11 w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {submitting ? "Creating your workspace…" : "Create host account"}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </button>
    </form>
  );
}
