import type { MaintenanceRequest, ToolEvent } from "../types";

/* ---------------------------------------------------------------------------
   Provider-neutral pieces of the concierge agent.

   Both the Claude path and the OpenAI-compatible path raise the same error type
   and return the same shape, so the API route and the UI never care which
   model produced the answer.
   --------------------------------------------------------------------------- */

export class ConciergeError extends Error {
  constructor(
    readonly code: "not_configured" | "upstream" | "loop" | "empty" | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "ConciergeError";
  }
}

/** Raised when the provider refuses a request because of its own quota. */
export class RateLimitedError extends ConciergeError {
  constructor(readonly retryAfterMs: number) {
    super("rate_limited", "The model provider's rate limit was reached.");
    this.name = "RateLimitedError";
  }
}

/** True for our own rate-limit error and for an SDK 429 (the Claude client). */
export function isRateLimited(error: unknown) {
  if (error instanceof RateLimitedError) return true;
  if (error instanceof ConciergeError) return error.code === "rate_limited";
  const status = (error as { status?: unknown } | null)?.status;
  return status === 429;
}

export type TurnResult = {
  reply: string;
  toolEvents: ToolEvent[];
  ticket: MaintenanceRequest | null;
  /** Set when the answer was produced by the fallback instead of the model. */
  notice?: string;
};
