"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Send, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "maintenance" | "assistance" | "service";

const categories: Array<{ id: Category; label: string; hint: string }> = [
  { id: "maintenance", label: "Something is broken", hint: "A fault in the apartment" },
  { id: "assistance", label: "I need help", hint: "A question for the host" },
  { id: "service", label: "Extra service", hint: "Cleaning, cot, late check-out" },
];

export function RequestForm({ hostName }: { hostName: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("maintenance");
  const [description, setDescription] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{ code: string; priorityLabel: string } | null>(
    null,
  );

  if (ticket) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[14px] font-semibold text-emerald-900">
              Request saved as {ticket.code}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-800">
              {hostName} can now see it in the host dashboard with a{" "}
              {ticket.priorityLabel.toLowerCase()} priority. We won&rsquo;t promise a
              repair time — if it becomes dangerous, call 112.
            </p>
            <button
              type="button"
              onClick={() => {
                setTicket(null);
                setDescription("");
                setUrgent(false);
              }}
              className="btn-secondary btn-sm mt-3"
            >
              Report something else
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
          const response = await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, category, urgent }),
          });
          const data = (await response.json()) as {
            ticket?: { code: string; priorityLabel: string };
            error?: string;
          };
          if (!response.ok || !data.ticket) {
            throw new Error(data.error ?? "The request could not be saved.");
          }
          setTicket(data.ticket);
          router.refresh();
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "The request could not be saved.",
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div>
        <p className="field-label">What do you need?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={cn(
                "rounded-xl border px-3.5 py-3 text-left transition",
                category === item.id
                  ? "border-ink bg-ink text-cream"
                  : "border-line bg-white text-ink hover:border-ink/25",
              )}
            >
              <span className="block text-[12.5px] font-medium">{item.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px]",
                  category === item.id ? "text-cream/60" : "text-muted",
                )}
              >
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="request-description" className="field-label">
          Tell {hostName} what&rsquo;s happening
        </label>
        <textarea
          id="request-description"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. The living room radiator is cold and the thermostat shows an error."
          className="field-input resize-y"
        />
        <p className="field-hint">
          Include the room and anything you&rsquo;ve already tried. {description.length}/2000
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3">
        <input
          type="checkbox"
          checked={urgent}
          onChange={(event) => setUrgent(event.target.checked)}
          className="mt-0.5 size-4 accent-[#E22B4F]"
        />
        <span>
          <span className="block text-[13px] font-medium text-ink">
            This is urgent or unsafe
          </span>
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
            No water, no power, a leak, a lockout or anything involving gas. For
            immediate danger, call 112 first.
          </span>
        </span>
      </label>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {submitting ? "Saving request…" : "Send request"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <Wrench className="size-3" />
          Creates a ticket in the host dashboard
        </span>
      </div>
    </form>
  );
}
