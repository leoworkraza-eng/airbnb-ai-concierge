"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarPlus, Loader2 } from "lucide-react";
import { Card, Field } from "@/components/ui";
import { todayISO } from "@/lib/utils";

/* Manual reservation entry. The form is the fallback the product documents:
   without an authorised Airbnb integration, this is how a host gets a real
   booking into the system. */

export function ReservationForm({
  properties,
  defaultPropertyId,
}: {
  properties: { id: string; name: string }[];
  defaultPropertyId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    propertyId: defaultPropertyId ?? properties[0]?.id ?? "",
    guestName: "",
    guestEmail: "",
    checkInDate: todayISO(7),
    checkOutDate: todayISO(11),
    guests: "2",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/host/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, guests: Number(form.guests) }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "The reservation could not be saved.");
      }
      router.push("/host/reservations");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The reservation could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarPlus className="size-4 text-brand" />
          <h2 className="text-[15px] font-semibold">Guest &amp; dates</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Property" htmlFor="propertyId" className="sm:col-span-2">
            <select
              id="propertyId"
              required
              value={form.propertyId}
              onChange={(event) => set("propertyId")(event.target.value)}
              className="field-input"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Guest name" htmlFor="guestName">
            <input
              id="guestName"
              required
              minLength={2}
              maxLength={80}
              value={form.guestName}
              onChange={(event) => set("guestName")(event.target.value)}
              className="field-input"
              placeholder="Ana Ruiz"
            />
          </Field>
          <Field label="Guest email" htmlFor="guestEmail" hint="Optional.">
            <input
              id="guestEmail"
              type="email"
              value={form.guestEmail}
              onChange={(event) => set("guestEmail")(event.target.value)}
              className="field-input"
              placeholder="ana@example.com"
            />
          </Field>

          <Field label="Check-in" htmlFor="checkInDate">
            <input
              id="checkInDate"
              type="date"
              required
              value={form.checkInDate}
              onChange={(event) => set("checkInDate")(event.target.value)}
              className="field-input"
            />
          </Field>
          <Field label="Check-out" htmlFor="checkOutDate">
            <input
              id="checkOutDate"
              type="date"
              required
              value={form.checkOutDate}
              onChange={(event) => set("checkOutDate")(event.target.value)}
              className="field-input"
            />
          </Field>

          <Field label="Guests" htmlFor="guests" hint="Between 1 and 30.">
            <input
              id="guests"
              type="number"
              required
              min={1}
              max={30}
              step={1}
              value={form.guests}
              onChange={(event) => set("guests")(event.target.value)}
              className="field-input"
            />
          </Field>

          <Field
            label="Internal note"
            htmlFor="notes"
            className="sm:col-span-2"
            hint="Only the host sees this. Never used as guest-facing content."
          >
            <textarea
              id="notes"
              rows={3}
              maxLength={600}
              value={form.notes}
              onChange={(event) => set("notes")(event.target.value)}
              className="field-input resize-y"
              placeholder="Arriving late, travelling with a small child…"
            />
          </Field>
        </div>
      </Card>

      <p className="text-[11.5px] leading-relaxed text-muted">
        This reservation is stored as <strong className="font-medium">manual</strong> data.
        It is never labelled as an Airbnb booking, and the concierge only uses the
        property record for accommodation answers.
      </p>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/host/reservations")}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
          {saving ? "Saving…" : "Save reservation"}
        </button>
      </div>
    </form>
  );
}
