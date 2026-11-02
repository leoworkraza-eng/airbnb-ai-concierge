"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Save } from "lucide-react";
import type { Property, PropertyInput } from "@/lib/types";
import { Card, Field, Note } from "@/components/ui";

/* ---------------------------------------------------------------------------
   Property editor.

   The fields here are the only property facts the concierge is allowed to use,
   so the form is grouped by the questions guests actually ask.
   --------------------------------------------------------------------------- */

type FormState = {
  name: string;
  address: string;
  neighbourhood: string;
  city: string;
  description: string;
  hostName: string;
  hostPhone: string;
  hostEmail: string;
  checkIn: string;
  checkOut: string;
  checkInInstructions: string;
  checkOutInstructions: string;
  wifiName: string;
  wifiPassword: string;
  houseRules: string;
  amenities: string;
  applianceInstructions: string;
  emergencyInformation: string;
  faqs: string;
};

const blank: FormState = {
  name: "",
  address: "",
  neighbourhood: "",
  city: "",
  description: "",
  hostName: "",
  hostPhone: "",
  hostEmail: "",
  checkIn: "15:00",
  checkOut: "11:00",
  checkInInstructions: "",
  checkOutInstructions: "",
  wifiName: "",
  wifiPassword: "",
  houseRules: "",
  amenities: "",
  applianceInstructions: "",
  emergencyInformation: "",
  faqs: "",
};

function toForm(property?: Property): FormState {
  if (!property) return blank;
  return {
    name: property.name,
    address: property.address,
    neighbourhood: property.neighbourhood,
    city: property.city,
    description: property.description,
    hostName: property.hostName,
    hostPhone: property.hostPhone,
    hostEmail: property.hostEmail,
    checkIn: property.checkIn,
    checkOut: property.checkOut,
    checkInInstructions: property.checkInInstructions,
    checkOutInstructions: property.checkOutInstructions,
    wifiName: property.wifiName,
    wifiPassword: property.wifiPassword,
    houseRules: property.houseRules.join("\n"),
    amenities: property.amenities.join("\n"),
    applianceInstructions: property.applianceInstructions
      .map((item) => `${item.appliance} | ${item.instructions}`)
      .join("\n"),
    emergencyInformation: property.emergencyInformation,
    faqs: property.faqs.map((item) => `${item.question} | ${item.answer}`).join("\n"),
  };
}

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const pairs = (value: string) =>
  lines(value).flatMap((line) => {
    const [first, ...rest] = line.split("|");
    const second = rest.join("|").trim();
    if (!second) return [];
    return [{ first: first.trim(), second }];
  });

export function PropertyForm({ property }: { property?: Property }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(property));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const payload: PropertyInput = {
    name: form.name,
    address: form.address,
    neighbourhood: form.neighbourhood,
    city: form.city,
    description: form.description,
    hostName: form.hostName,
    hostPhone: form.hostPhone,
    hostEmail: form.hostEmail,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    checkInInstructions: form.checkInInstructions,
    checkOutInstructions: form.checkOutInstructions,
    wifiName: form.wifiName,
    wifiPassword: form.wifiPassword,
    houseRules: lines(form.houseRules),
    amenities: lines(form.amenities),
    applianceInstructions: pairs(form.applianceInstructions).map((pair) => ({
      appliance: pair.first,
      instructions: pair.second,
    })),
    emergencyInformation: form.emergencyInformation,
    faqs: pairs(form.faqs).map((pair) => ({
      question: pair.first,
      answer: pair.second,
    })),
    settings:
      property?.settings ?? {
        tone: "warm",
        extraInstructions: "",
        servicePreferences: "",
        escalationInstructions: "",
      },
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch(
        property ? `/api/host/properties/${property.id}` : "/api/host/properties",
        {
          method: property ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as { error?: string; property?: Property };
      if (!response.ok) throw new Error(data.error ?? "The changes could not be saved.");

      setSaved(true);
      router.refresh();
      if (!property && data.property) {
        router.push(`/host/properties/${data.property.id}`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The changes could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-24">
      <Note tone="neutral" className="bg-white">
        These fields are the concierge&rsquo;s only source of property facts. Any
        field left empty is answered as &ldquo;not on record&rdquo; — never guessed.
      </Note>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">The property</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Property name" htmlFor="name" className="sm:col-span-2">
            <input
              id="name"
              required
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              className="field-input"
              placeholder="Casa Barcelona"
            />
          </Field>
          <Field label="Address" htmlFor="address" className="sm:col-span-2">
            <input
              id="address"
              required
              value={form.address}
              onChange={(event) => set("address")(event.target.value)}
              className="field-input"
              placeholder="Carrer de Mallorca 245, 3º B"
            />
          </Field>
          <Field label="Neighbourhood" htmlFor="neighbourhood">
            <input
              id="neighbourhood"
              value={form.neighbourhood}
              onChange={(event) => set("neighbourhood")(event.target.value)}
              className="field-input"
              placeholder="Eixample"
            />
          </Field>
          <Field label="City" htmlFor="city">
            <input
              id="city"
              required
              value={form.city}
              onChange={(event) => set("city")(event.target.value)}
              className="field-input"
              placeholder="Barcelona"
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            className="sm:col-span-2"
            hint="Two or three sentences the concierge can use when welcoming a guest."
          >
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              className="field-input resize-y"
            />
          </Field>
          <Field label="Check-in from" htmlFor="checkIn">
            <input
              id="checkIn"
              type="time"
              required
              value={form.checkIn}
              onChange={(event) => set("checkIn")(event.target.value)}
              className="field-input"
            />
          </Field>
          <Field label="Check-out by" htmlFor="checkOut">
            <input
              id="checkOut"
              type="time"
              required
              value={form.checkOut}
              onChange={(event) => set("checkOut")(event.target.value)}
              className="field-input"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">Access &amp; Wi-Fi</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Check-in instructions" htmlFor="checkInInstructions">
            <textarea
              id="checkInInstructions"
              rows={4}
              value={form.checkInInstructions}
              onChange={(event) => set("checkInInstructions")(event.target.value)}
              className="field-input resize-y"
              placeholder="Street door, keypad code, lockbox location, floor…"
            />
          </Field>
          <Field label="Check-out instructions" htmlFor="checkOutInstructions">
            <textarea
              id="checkOutInstructions"
              rows={3}
              value={form.checkOutInstructions}
              onChange={(event) => set("checkOutInstructions")(event.target.value)}
              className="field-input resize-y"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Wi-Fi network" htmlFor="wifiName">
              <input
                id="wifiName"
                value={form.wifiName}
                onChange={(event) => set("wifiName")(event.target.value)}
                className="field-input font-mono text-[13.5px]"
                placeholder="CasaBarcelona_Guest"
              />
            </Field>
            <Field label="Wi-Fi password" htmlFor="wifiPassword">
              <input
                id="wifiPassword"
                value={form.wifiPassword}
                onChange={(event) => set("wifiPassword")(event.target.value)}
                className="field-input font-mono text-[13.5px]"
                placeholder="Barcelona2026Demo"
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">Guides &amp; rules</h2>
        <div className="mt-4 grid gap-4">
          <Field
            label="House rules"
            htmlFor="houseRules"
            hint="One rule per line. The concierge quotes these verbatim when asked."
          >
            <textarea
              id="houseRules"
              rows={4}
              value={form.houseRules}
              onChange={(event) => set("houseRules")(event.target.value)}
              className="field-input resize-y"
            />
          </Field>
          <Field
            label="Amenities"
            htmlFor="amenities"
            hint="One amenity per line."
          >
            <textarea
              id="amenities"
              rows={4}
              value={form.amenities}
              onChange={(event) => set("amenities")(event.target.value)}
              className="field-input resize-y"
            />
          </Field>
          <Field
            label="Appliance instructions"
            htmlFor="applianceInstructions"
            hint="One guide per line, formatted as: Appliance | Instructions"
          >
            <textarea
              id="applianceInstructions"
              rows={6}
              value={form.applianceInstructions}
              onChange={(event) => set("applianceInstructions")(event.target.value)}
              className="field-input resize-y font-mono text-[12.5px]"
              placeholder={"Washing machine | Turn the dial to Mix 40°, press Start…"}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">Safety &amp; FAQs</h2>
        <div className="mt-4 grid gap-4">
          <Field
            label="Emergency information"
            htmlFor="emergencyInformation"
            hint="Emergency numbers, shut-off valves, fuse box, lockout steps."
          >
            <textarea
              id="emergencyInformation"
              rows={4}
              value={form.emergencyInformation}
              onChange={(event) => set("emergencyInformation")(event.target.value)}
              className="field-input resize-y"
            />
          </Field>
          <Field
            label="Property FAQs"
            htmlFor="faqs"
            hint="One per line, formatted as: Question | Answer"
          >
            <textarea
              id="faqs"
              rows={5}
              value={form.faqs}
              onChange={(event) => set("faqs")(event.target.value)}
              className="field-input resize-y font-mono text-[12.5px]"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">Host contact</h2>
        <p className="mt-1 text-[12px] text-muted">
          Shared with the guest in the stay page and used for escalations.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="hostName">
            <input
              id="hostName"
              value={form.hostName}
              onChange={(event) => set("hostName")(event.target.value)}
              className="field-input"
              placeholder="Marta"
            />
          </Field>
          <Field label="Phone" htmlFor="hostPhone">
            <input
              id="hostPhone"
              value={form.hostPhone}
              onChange={(event) => set("hostPhone")(event.target.value)}
              className="field-input"
              placeholder="+34 600 123 456"
            />
          </Field>
          <Field label="Email" htmlFor="hostEmail">
            <input
              id="hostEmail"
              type="email"
              value={form.hostEmail}
              onChange={(event) => set("hostEmail")(event.target.value)}
              className="field-input"
              placeholder="marta@example.com"
            />
          </Field>
        </div>
      </Card>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3 pl-0 lg:pl-[248px]">
          <p className="text-[11.5px] text-muted">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Check className="size-3.5" /> Saved — the concierge will use this
                immediately.
              </span>
            ) : (
              "Changes apply to new concierge answers straight away."
            )}
          </p>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : property ? "Save property" : "Create property"}
          </button>
        </div>
      </div>
    </form>
  );
}
