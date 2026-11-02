/* Server-side environment access. Every private credential is read here and
   never exported to a client component. */

function read(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  anthropicKey: read("ANTHROPIC_API_KEY"),
  claudeModel: read("CLAUDE_MODEL") || "claude-sonnet-5-5",
  claudeMaxTokens: Number(read("CLAUDE_MAX_TOKENS") || 1200),

  // Free mode: any OpenAI-compatible chat API with tool calling. Groq is the
  // default because its free tier needs no card. Anthropic wins if both are set.
  aiApiKey: read("AI_API_KEY") || read("GROQ_API_KEY"),
  aiBaseUrl: read("AI_BASE_URL") || "https://api.groq.com/openai/v1",
  aiModel: read("AI_MODEL") || "llama-3.3-70b-versatile",

  supabaseUrl: read("SUPABASE_URL"),
  supabaseAnonKey: read("SUPABASE_ANON_KEY"),
  supabaseServiceKey: read("SUPABASE_SERVICE_ROLE_KEY"),

  googleMapsKey: read("GOOGLE_MAPS_API_KEY"),

  sessionSecret: read("SESSION_SECRET") || "dev-only-insecure-concierge-session-secret",
  demoHostEmail: read("DEMO_HOST_EMAIL") || "host@casabarcelona.demo",
  demoHostPassword: read("DEMO_HOST_PASSWORD") || "Concierge2026",
  demoPropertyId: read("DEMO_PROPERTY_ID"),

  siteUrl: read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000",
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceKey,
);

export const isClaudeConfigured = Boolean(env.anthropicKey);

export const isOpenAiCompatibleConfigured = Boolean(env.aiApiKey);

/** True when any tool-calling model is reachable, Claude or a free provider. */
export const isConciergeConfigured = isClaudeConfigured || isOpenAiCompatibleConfigured;

export const modelProvider: "claude" | "openai-compatible" | "none" = isClaudeConfigured
  ? "claude"
  : isOpenAiCompatibleConfigured
    ? "openai-compatible"
    : "none";

export const storageMode: "supabase" | "local" = isSupabaseConfigured
  ? "supabase"
  : "local";

export const googlePlacesEnabled = Boolean(env.googleMapsKey);
