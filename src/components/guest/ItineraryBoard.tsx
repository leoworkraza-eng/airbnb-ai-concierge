"use client";

import { useState } from "react";
import { CalendarPlus, Check, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Note, Pill } from "@/components/ui";
import {
  itinerarySlotHints,
  itinerarySlotLabels,
  itinerarySlotOrder,
} from "@/lib/itinerary";
import type { ItineraryItem, ItinerarySlot } from "@/lib/types";
import { cn } from "@/lib/utils";

type PlaceOption = { id: string; name: string; category: string; neighbourhood: string };

/* ---------------------------------------------------------------------------
   The plan editor. Every action is a request to the server, and the list is
   replaced with what the database returned — so the screen can never show a
   stop that was not saved.
   --------------------------------------------------------------------------- */

export function ItineraryBoard({
  initialItems,
  days,
  dayLabels,
  places,
  migration,
  interests,
}: {
  initialItems: ItineraryItem[];
  days: number;
  dayLabels: string[];
  places: PlaceOption[];
  migration: string | null;
  interests: string[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ day: number; slot: ItinerarySlot } | null>(null);
  const [title, setTitle] = useState("");
  const [placeId, setPlaceId] = useState("");

  const locked = Boolean(migration);
  const doneCount = items.filter((item) => item.done).length;

  async function request(method: string, body?: unknown, query = "") {
    const response = await fetch(`/api/guest/itinerary${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json()) as { items?: ItineraryItem[]; error?: string };
    if (!response.ok) throw new Error(data.error ?? "That didn't save. Please try again.");
    if (data.items) setItems(data.items);
  }

  async function run(key: string, action: () => Promise<void>) {
    if (busy) return;
    setError(null);
    setBusy(key);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const build = () =>
    run("build", async () => {
      if (
        items.length &&
        !window.confirm("Rebuild the plan? Your current stops will be replaced.")
      ) {
        return;
      }
      await request("POST", { action: "build" });
    });

  const clear = () =>
    run("clear", async () => {
      if (!window.confirm("Remove every stop from your plan?")) return;
      await request("DELETE", undefined, "?all=1");
    });

  const toggle = (item: ItineraryItem) =>
    run(`toggle:${item.id}`, () => request("PATCH", { id: item.id, done: !item.done }));

  const remove = (item: ItineraryItem) =>
    run(`remove:${item.id}`, () =>
      request("DELETE", undefined, `?id=${encodeURIComponent(item.id)}`),
    );

  const save = (day: number, slot: ItinerarySlot) =>
    run("add", async () => {
      const trimmed = title.trim();
      if (trimmed.length < 2) {
        setError("Give the stop a name of at least two characters.");
        return;
      }
      await request("POST", {
        action: "add",
        day,
        slot,
        title: trimmed,
        placeId: placeId || null,
      });
      setEditing(null);
      setTitle("");
      setPlaceId("");
    });

  return (
    <div className="space-y-4">
      {migration ? (
        <Note tone="warning">
          <strong className="font-semibold">Plan storage is pending.</strong>{" "}
          {migration}
        </Note>
      ) : null}

      <div className="surface surface-shadow flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
            <CalendarPlus className="size-4 text-brand" />
            {days} day{days === 1 ? "" : "s"}
          </span>
          <span>
            {items.length} stop{items.length === 1 ? "" : "s"}
          </span>
          <span>{doneCount} done</span>
          {interests.length ? <Pill tone="gold">{interests.slice(0, 2).join(" · ")}</Pill> : null}
        </div>

        <div className="flex items-center gap-2">
          {items.length ? (
            <button
              type="button"
              onClick={() => void clear()}
              disabled={locked || busy !== null}
              className="btn btn-secondary btn-sm"
            >
              {busy === "clear" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void build()}
            disabled={locked || busy !== null}
            className="btn btn-primary btn-sm"
          >
            {busy === "build" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {items.length ? "Rebuild plan" : "Build a plan"}
          </button>
        </div>
      </div>

      {error ? <Note tone="danger">{error}</Note> : null}

      {items.length === 0 && !migration ? (
        <div className="rounded-[22px] border border-dashed border-line bg-white/70 px-6 py-10 text-center">
          <p className="text-[15px] font-medium">Nothing planned yet</p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">
            Build a plan from the curated guide — three stops a day, ordered around
            your interests — then edit it however you like. The concierge reads the
            same plan, so it can change a day for you.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
          const dayItems = items.filter((item) => item.day === day);

          return (
            <section key={day} className="surface surface-shadow overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-sand text-[11.5px] font-semibold">
                    {day}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold">Day {day}</p>
                    <p className="text-[10.5px] text-muted">{dayLabels[day - 1] ?? ""}</p>
                  </div>
                </div>
                <span className="text-[10.5px] text-muted">
                  {dayItems.length} stop{dayItems.length === 1 ? "" : "s"}
                </span>
              </header>

              <div className="space-y-3 px-4 py-4">
                {itinerarySlotOrder.map((slot) => {
                  const slotItems = dayItems.filter((item) => item.slot === slot);
                  const isEditing = editing?.day === day && editing.slot === slot;

                  return (
                    <div key={slot} className="grid gap-2 sm:grid-cols-[88px_1fr] sm:gap-3">
                      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase sm:pt-2.5">
                        {itinerarySlotLabels[slot]}
                      </p>

                      <div className="space-y-2">
                        {slotItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5"
                          >
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={item.done}
                              aria-label={
                                item.done
                                  ? `Mark ${item.title} as not done`
                                  : `Mark ${item.title} as done`
                              }
                              disabled={busy !== null}
                              onClick={() => void toggle(item)}
                              className={cn(
                                "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition disabled:opacity-50",
                                item.done
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-line bg-white hover:border-ink/30",
                              )}
                            >
                              {item.done ? <Check className="size-3" strokeWidth={3} /> : null}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "text-[12.5px] leading-snug font-medium",
                                  item.done && "text-muted line-through",
                                )}
                              >
                                {item.title}
                              </p>
                              {item.notes ? (
                                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() => void remove(item)}
                              disabled={busy !== null}
                              aria-label={`Remove ${item.title}`}
                              className="rounded-md p-1 text-muted transition hover:bg-sand hover:text-ink disabled:opacity-40"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}

                        {isEditing ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              void save(day, slot);
                            }}
                            className="space-y-2 rounded-xl border border-line bg-cream/70 p-3"
                          >
                            <select
                              value={placeId}
                              onChange={(event) => {
                                setPlaceId(event.target.value);
                                const chosen = places.find(
                                  (place) => place.id === event.target.value,
                                );
                                if (chosen) setTitle(chosen.name);
                              }}
                              aria-label="Choose a place from the guide"
                              className="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[12px] text-ink outline-none focus:border-ink/25"
                            >
                              <option value="">Choose from the guide…</option>
                              {places.map((place) => (
                                <option key={place.id} value={place.id}>
                                  {place.name} · {place.category}
                                </option>
                              ))}
                            </select>

                            <input
                              value={title}
                              onChange={(event) => setTitle(event.target.value)}
                              maxLength={120}
                              placeholder="Or type your own stop"
                              aria-label="Stop name"
                              className="w-full rounded-lg border border-line bg-white px-2.5 py-2 text-[12px] text-ink outline-none focus:border-ink/25"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="submit"
                                disabled={busy !== null || title.trim().length < 2}
                                className="btn btn-primary btn-sm"
                              >
                                {busy === "add" ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Plus className="size-3" />
                                )}
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(null);
                                  setTitle("");
                                  setPlaceId("");
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                Cancel
                              </button>
                              <span className="text-[10px] text-muted">
                                {itinerarySlotHints[slot]}
                              </span>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            disabled={locked || busy !== null}
                            onClick={() => {
                              setEditing({ day, slot });
                              setTitle("");
                              setPlaceId("");
                            }}
                            className="w-full rounded-xl border border-dashed border-line px-3 py-2 text-left text-[11.5px] text-muted transition hover:border-ink/25 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            + Add a stop
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Stops come from the curated Barcelona guide that ships with this prototype,
        not from live availability. Check opening hours before you go.
      </p>
    </div>
  );
}
