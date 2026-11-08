"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { ConciergeAvatar, PulsingDots } from "@/components/brand";
import type { ToolEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type TicketSummary = { code: string; priority: string; status: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents: ToolEvent[];
  pending?: boolean;
  ticket?: TicketSummary;
  notice?: string;
};

const suggestions = [
  "What's the Wi-Fi password?",
  "How do I use the washing machine?",
  "What time is check-out?",
  "Can you recommend restaurants nearby?",
  "What's the best way to get around Barcelona?",
  "Is there anything interesting happening tonight?",
  "How can I report a problem with the apartment?",
];

export function ConciergeChat({
  initialMessages,
  guestName,
  propertyName,
  hostName,
  hostPhone,
  claudeReady,
  prefill,
}: {
  initialMessages: ChatMessage[];
  guestName: string;
  propertyName: string;
  hostName: string;
  hostPhone: string;
  claudeReady: boolean;
  prefill?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState(prefill ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(initialMessages.length === 0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const didInitialScroll = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: didInitialScroll.current ? "smooth" : "auto",
    });
    didInitialScroll.current = true;
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setSending(true);
    setShowSuggestions(false);
    setInput("");

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: trimmed,
      toolEvents: [],
      pending: true,
    };
    setMessages((current) => [...current, optimistic]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 75_000);

    try {
      const response = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: { id: string; content: string; toolEvents: ToolEvent[]; createdAt: string };
        ticket?: TicketSummary;
        notice?: string | null;
        error?: string;
        code?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error ??
            "The concierge couldn't answer just now. You can still report an issue from Support.",
        );
      }

      const reply = data.reply;
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimistic.id),
        { ...optimistic, pending: false },
        {
          id: reply.id,
          role: "assistant",
          content: reply.content,
          toolEvents: reply.toolEvents ?? [],
          ticket: data.ticket,
          notice: data.notice ?? undefined,
        },
      ]);
    } catch (caught) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setInput(trimmed);
      const aborted = caught instanceof Error && caught.name === "AbortError";
      setError(
        aborted
          ? "That answer took too long. Your message is back in the box — try again."
          : caught instanceof Error
            ? caught.message
            : "The concierge is unavailable right now.",
      );
    } finally {
      clearTimeout(timeout);
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="surface surface-shadow flex h-[calc(100svh-16rem)] min-h-[520px] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <ConciergeAvatar
            size="md"
            state={sending ? "thinking" : "idle"}
            className="avatar-breathe"
          />
          <div>
            <p className="text-[14px] font-semibold leading-tight">Concierge</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {sending ? "Checking your property record…" : `${propertyName} · here for your stay`}
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 text-[10.5px] text-muted sm:inline-flex">
          <Sparkles className="size-3 text-brand" />
          {claudeReady ? "Model connected" : "Guided mode"}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,#FFFDFB_0%,#FAF7F3_100%)] px-4 py-5 sm:px-6"
        role="log"
        aria-live="polite"
        aria-busy={sending}
      >
        {messages.length === 0 ? (
          <div className="bubble-in flex items-start gap-3">
            <ConciergeAvatar size="md" />
            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 text-[13.5px] leading-relaxed text-ink-soft">
              <p>
                Welcome to {propertyName}, {guestName}. I have the apartment
                details, the local guide and a direct line to {hostName} — so ask
                me anything about your stay.
              </p>
              <p className="mt-2 text-[13px] text-muted">
                I can help with Wi-Fi, appliances, check-out, getting around
                Barcelona, or reporting something that isn&rsquo;t working.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" ? (
              <div className="bubble-in flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[13.5px] leading-relaxed text-cream">
                  {message.content}
                </p>
              </div>
            ) : (
              <div className="bubble-in flex items-start gap-2.5">
                <ConciergeAvatar size="sm" />
                <div className="min-w-0 max-w-[88%]">
                  <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink-soft">
                    {message.content}
                  </div>
                  {message.toolEvents.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.toolEvents.map((event, index) => (
                        <span
                          key={`${message.id}-${index}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px]",
                            event.status === "ok"
                              ? "border-line bg-white text-muted"
                              : "border-red-200 bg-red-50 text-red-700",
                          )}
                          title={event.detail}
                        >
                          {event.status === "ok" ? (
                            <Wrench className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {event.label}
                          {event.status === "ok" ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {message.notice ? (
                    <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                      <AlertTriangle className="mt-px size-3 shrink-0" />
                      {message.notice}
                    </p>
                  ) : null}
                  {message.ticket ? (
                    <div className="mt-2.5 rounded-2xl border border-brand/25 bg-brand-soft/60 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-brand-dark uppercase">
                          <Wrench className="size-3.5" /> Request filed
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                          {message.ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-muted">
                        {message.ticket.code} · {message.ticket.priority} priority
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
                        <Check className="size-3 text-emerald-600" /> Saved to the host
                        dashboard
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-3 pl-0.5">
                    <button
                      type="button"
                      onClick={() => copy(message.content, message.id)}
                      className="inline-flex items-center gap-1 text-[10.5px] text-muted transition hover:text-ink"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="size-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {sending ? (
          <div className="bubble-in flex items-start gap-2.5">
            <ConciergeAvatar size="sm" state="thinking" />
            <div className="rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3">
              <PulsingDots />
            </div>
          </div>
        ) : null}

        {showSuggestions ? (
          <div className="pt-2">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={sending}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-left text-[12px] text-ink-soft transition hover:border-ink/25 hover:bg-sand/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="border-t border-red-100 bg-red-50/80 px-4 py-3 text-[12.5px] leading-relaxed text-red-800 sm:px-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{error}</p>
              {/concierge|claude|unavailable|reach/i.test(error) ? (
                <p className="mt-1 text-red-700/80">
                  You can also contact {hostName} on{" "}
                  <a className="link-underline font-medium" href={`tel:${hostPhone.replace(/\s/g, "")}`}>
                    {hostPhone}
                  </a>{" "}
                  or report the issue in Support.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!claudeReady ? (
        <div className="border-t border-line bg-cream/80 px-4 py-2.5 text-[11px] leading-relaxed text-muted sm:px-5">
          <strong className="font-semibold text-ink-soft">Guided mode.</strong> Replies
          are assembled from this property&rsquo;s record, the city guide and real ticket
          writes — no language model is connected. Add a free{" "}
          <code className="rounded bg-white px-1">AI_API_KEY</code> for free-form answers.
        </div>
      ) : null}

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-line bg-cream/70 px-3 py-2 sm:px-4">
        {[
          "What's the Wi-Fi password?",
          "What time is check-out?",
          "How do I use the washing machine?",
          "Something isn't working",
        ].map((action) => (
          <button
            key={action}
            type="button"
            disabled={sending}
            onClick={() => void send(action)}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1 text-[11px] text-ink-soft transition hover:border-ink/25 hover:bg-sand/50 disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      <form
        className="flex items-end gap-2 border-t border-line bg-white px-3 py-3 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor="concierge-input" className="sr-only">
          Message the concierge
        </label>
        <textarea
          id="concierge-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          maxLength={1500}
          placeholder="Ask anything about your stay…"
          disabled={sending}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-line bg-cream px-4 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-muted/70 focus:border-ink/25 focus:bg-white focus:ring-4 focus:ring-ink/5 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="grid size-[42px] shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>

      <p className="border-t border-line bg-cream px-4 py-2 text-[10.5px] leading-relaxed text-muted sm:px-5">
        For emergencies call 112. The concierge can file a request but cannot
        dispatch help or guarantee a repair time.
      </p>
    </div>
  );
}
