#!/usr/bin/env node
/**
 * Minimal autonomous agent loop — no dependencies, Node 18+.
 *
 * Works with any OpenAI-compatible provider. Defaults to xAI's Grok.
 *
 *   XAI_API_KEY=xai-... node grok-agent.mjs "What is the weather in Barcelona?"
 *
 * Free alternative (no card) — just change the two env vars:
 *   AI_API_KEY=gsk_... AI_BASE_URL=https://api.groq.com/openai/v1 \
 *   AI_MODEL=openai/gpt-oss-120b node grok-agent.mjs "What is the weather in Barcelona?"
 *
 * How it works: send the question plus the tool list, let the model choose a
 * tool, run it yourself, feed the result back, repeat until it answers in text.
 * That loop is what "autonomous agent" means — the model picks the next step.
 */

const BASE_URL = (process.env.AI_BASE_URL || "https://api.x.ai/v1").replace(/\/+$/, "");
const MODEL = process.env.AI_MODEL || "grok-4.7";
const API_KEY = process.env.XAI_API_KEY || process.env.AI_API_KEY;
const MAX_STEPS = 6;

if (!API_KEY) {
  console.error(
    "Missing key. Set XAI_API_KEY (from console.x.ai) or AI_API_KEY (Groq/other).",
  );
  process.exit(1);
}

/* --- 1. Tools the model is allowed to call -------------------------------- */
/* Define the tool once; this JSON schema is what the model reads to decide. */
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Current weather for a city. Call this instead of guessing.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name, e.g. Barcelona" },
        },
        required: ["city"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_property_information",
      description: "Read a verified property record section (wifi, checkin, rules).",
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["wifi", "checkin", "rules", "appliances"],
          },
        },
        required: ["section"],
        additionalProperties: false,
      },
    },
  },
];

/* --- 2. What each tool actually does ------------------------------------- */
/* Replace these bodies with your own code, database calls, HTTP requests… */
async function executeTool(name, args) {
  switch (name) {
    case "get_weather":
      return { city: args.city, tempC: 21, conditions: "clear", source: "stub" };
    case "get_property_information":
      return {
        section: args.section,
        network: "CasaBarcelona_Guest",
        password: "Barcelona2026Demo",
        source: "stub",
      };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

/* --- 3. The loop -------------------------------------------------------- */
async function chat(messages) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${BASE_URL} returned ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response.json();
}

async function runAgent(question) {
  const messages = [
    {
      role: "system",
      content:
        "You are a helpful agent. Use the tools instead of guessing. " +
        "When you have the answer, reply in plain text and stop calling tools.",
    },
    { role: "user", content: question },
  ];

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const data = await chat(messages);
    const message = data.choices?.[0]?.message;

    if (!message) throw new Error("Provider returned no message.");

    const calls = message.tool_calls ?? [];

    // No tool call means the model is done: this is the final answer.
    if (!calls.length) {
      return message.content ?? "(empty reply)";
    }

    messages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      let args = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        args = {};
      }

      console.log(`  step ${step}: ${call.function?.name}(${JSON.stringify(args)})`);

      const result = await executeTool(call.function?.name, args);

      // The result goes back as a tool message tied to the call id.
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error(`Gave up after ${MAX_STEPS} steps without a final answer.`);
}

const question = process.argv.slice(2).join(" ") || "What is the Wi-Fi password?";
console.log(`provider: ${BASE_URL}  model: ${MODEL}\nquestion: ${question}\n`);

runAgent(question)
  .then((answer) => {
    console.log(`\nanswer: ${answer}`);
  })
  .catch((error) => {
    console.error(`\nfailed: ${error.message}`);
    process.exit(1);
  });
