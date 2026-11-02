"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, Save } from "lucide-react";
import { Card, Field, Note } from "@/components/ui";
import type { ConciergeTone, Property } from "@/lib/types";
import { cn } from "@/lib/utils";

const tones: Array<{ id: ConciergeTone; label: string; hint: string }> = [
  { id: "warm", label: "Warm & personal", hint: "Like a host who remembers your name" },
  { id: "professional", label: "Professional", hint: "Polished hotel front desk" },
  { id: "luxury", label: "Discreet & luxury", hint: "Understated, anticipatory, refined" },
];

export function SettingsForm({ property }: { property: Property }) {
  const router = useRouter();
  const [tone, setTone] = useState<ConciergeTone>(property.settings.tone);
  const [extraInstructions, setExtraInstructions] = useState(
    property.settings.extraInstructions,
  );
  const [servicePreferences, setServicePreferences] = useState(
    property.settings.servicePreferences,
  );
  const [escalationInstructions, setEscalationInstructions] = useState(
    property.settings.escalationInstructions,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">{property.name}</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            {property.neighbourhood}, {property.city}
          </p>
        </div>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-emerald-700">
            <Check className="size-3.5" /> Saved
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="field-label">Communication tone</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {tones.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTone(option.id)}
              aria-pressed={tone === option.id}
              className={cn(
                "rounded-xl border px-3.5 py-3 text-left transition",
                tone === option.id
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-white text-ink hover:border-ink/25",
              )}
            >
              <span className="block text-[12.5px] font-medium">{option.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[10.5px] leading-snug",
                  tone === option.id ? "text-cream/60" : "text-muted",
                )}
              >
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <Field
          label="Additional property instructions"
          htmlFor={`extra-${property.id}`}
          hint="Local tips, quirks of the building, anything the concierge should mention."
        >
          <textarea
            id={`extra-${property.id}`}
            rows={3}
            value={extraInstructions}
            onChange={(event) => setExtraInstructions(event.target.value)}
            className="field-input resize-y"
            maxLength={1500}
          />
        </Field>
        <Field
          label="Guest service preferences"
          htmlFor={`service-${property.id}`}
          hint="What you're happy to offer — late check-out, extra cleaning, a welcome bottle."
        >
          <textarea
            id={`service-${property.id}`}
            rows={3}
            value={servicePreferences}
            onChange={(event) => setServicePreferences(event.target.value)}
            className="field-input resize-y"
            maxLength={1500}
          />
        </Field>
        <Field
          label="Escalation instructions"
          htmlFor={`escalation-${property.id}`}
          hint="When the concierge should notify you instead of answering."
        >
          <textarea
            id={`escalation-${property.id}`}
            rows={3}
            value={escalationInstructions}
            onChange={(event) => setEscalationInstructions(event.target.value)}
            className="field-input resize-y"
            maxLength={1500}
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <Note tone="neutral" className="flex-1 bg-cream/70" icon={<Lock className="size-3.5" />}>
          Safety, honesty and privacy rules are fixed and cannot be disabled.
        </Note>
        <button
          type="button"
          disabled={saving}
          className="btn-primary btn-sm shrink-0"
          onClick={async () => {
            setSaving(true);
            setError(null);
            setSaved(false);
            try {
              const response = await fetch(`/api/host/properties/${property.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  settings: {
                    tone,
                    extraInstructions,
                    servicePreferences,
                    escalationInstructions,
                  },
                }),
              });
              const data = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(data.error ?? "Could not save settings.");
              setSaved(true);
              router.refresh();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : "Could not save settings.",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Card>
  );
}
