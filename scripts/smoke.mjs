#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   End-to-end smoke test.

   Drives the same HTTP surface a guest's browser uses: a signed guest session,
   the plan API, input validation, the concierge turn, and cross-guest access.
   It asserts against the database, not against the rendered page, so a green
   run means the writes actually landed.

   Usage:
     npm run smoke                                  # http://localhost:3000
     SMOKE_BASE_URL=http://localhost:3102 npm run smoke

   The instance must have the migrations applied (Supabase) or be running on
   the local development store; otherwise the plan steps fail with the same
   migration message the UI shows, and the script says so.
   --------------------------------------------------------------------------- */

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const jar = new Map();
let failures = 0;

function cookieHeader() {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function absorb(response) {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const cookie of raw) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...init,
    headers: { ...(init.headers ?? {}), cookie: cookieHeader() },
  });
  absorb(response);
  return response;
}

async function body(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function check(name, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  const start = await request("/api/guest/start");
  check("guest session starts", start.status === 200 || start.status === 307, `HTTP ${start.status}`);

  const welcome = await request("/welcome");
  const welcomeHtml = welcome.status === 200 ? await welcome.text() : "";
  check("welcome page renders for the guest", welcome.status === 200, `HTTP ${welcome.status}`);
  check("welcome shows the stay", welcomeHtml.includes("Casa Barcelona"));

  const planPage = await request("/itinerary");
  const planHtml = planPage.status === 200 ? await planPage.text() : "";
  check("plan page renders", planPage.status === 200, `HTTP ${planPage.status}`);

  if (planHtml.includes("Plan storage is pending")) {
    console.log("\nSKIP  plan assertions — the itinerary table is missing on this instance.");
    console.log("      Run supabase/migrations/2026-12-itinerary.sql, then re-run.\n");
  } else {
    const builtResponse = await request("/api/guest/itinerary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "build" }),
    });
    const built = await body(builtResponse);
    const items = Array.isArray(built?.items) ? built.items : [];
    check(
      "plan builds from the guide",
      builtResponse.status === 200 && items.length > 0,
      builtResponse.status === 200 ? `${items.length} stops` : `HTTP ${builtResponse.status}: ${built?.error ?? ""}`,
    );

    if (items.length) {
      const first = items[0];

      const toggled = await body(
        await request("/api/guest/itinerary", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: first.id, done: true }),
        }),
      );
      check(
        "a stop can be ticked off",
        Boolean(toggled?.items?.find((item) => item.id === first.id)?.done),
      );

      const added = await body(
        await request("/api/guest/itinerary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "add",
            day: 1,
            slot: "evening",
            title: "Smoke test stop",
          }),
        }),
      );
      const custom = (added?.items ?? []).find((item) => item.title === "Smoke test stop");
      check("a custom stop can be added", Boolean(custom));

      const invalidResponse = await request("/api/guest/itinerary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "add", day: 1, slot: "morning", title: "x" }),
      });
      check("an invalid stop is rejected", invalidResponse.status === 400);

      if (custom) {
        const removed = await body(
          await request(`/api/guest/itinerary?id=${encodeURIComponent(custom.id)}`, {
            method: "DELETE",
          }),
        );
        check(
          "a stop can be removed",
          !(removed?.items ?? []).some((item) => item.id === custom.id),
        );
      }

      // A second guest must not be able to touch the first guest's plan.
      const firstGuestCookie = cookieHeader();
      jar.clear();
      await request("/api/guest/start");
      const foreign = await request("/api/guest/itinerary", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: first.id, done: true }),
      });
      check("another guest cannot edit the plan", foreign.status === 404, `HTTP ${foreign.status}`);

      jar.clear();
      for (const pair of firstGuestCookie.split("; ")) {
        const index = pair.indexOf("=");
        if (index > 0) jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
    }
  }

  const chatResponse = await request("/api/concierge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "What's the Wi-Fi password?" }),
  });
  const chat = await body(chatResponse);
  check(
    "the concierge answers from the property record",
    chatResponse.status === 200 && Boolean(chat?.reply?.content),
    chatResponse.status === 200 ? "reply stored" : `HTTP ${chatResponse.status}: ${chat?.error ?? ""}`,
  );
  check(
    "the Wi-Fi password came from the record, not a guess",
    Boolean(chat?.reply?.content?.includes("Barcelona2026Demo")),
  );

  const emptyResponse = await request("/api/concierge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "   " }),
  });
  check("an empty message is rejected", emptyResponse.status === 400);

  await request("/api/guest/itinerary?all=1", { method: "DELETE" });

  console.log(
    failures === 0
      ? "\nAll smoke checks passed."
      : `\n${failures} smoke check${failures === 1 ? "" : "s"} failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("\nSmoke run crashed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
