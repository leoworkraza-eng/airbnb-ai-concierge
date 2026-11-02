import type { MaintenanceRequest, ToolEvent } from "../types";

/* ---------------------------------------------------------------------------
   Provider-neutral pieces of the concierge agent.

   Both the Claude path and the OpenAI-compatible path raise the same error type
   and return the same shape, so the API route and the UI never care which
   model produced the answer.
   --------------------------------------------------------------------------- */

export class ConciergeError extends Error {
  constructor(
    readonly code: "not_configured" | "upstream" | "loop" | "empty",
    message: string,
  ) {
    super(message);
    this.name = "ConciergeError";
  }
}

export type TurnResult = {
  reply: string;
  toolEvents: ToolEvent[];
  ticket: MaintenanceRequest | null;
};
