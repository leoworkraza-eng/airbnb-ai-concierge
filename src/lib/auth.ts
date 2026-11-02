import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isSupabaseConfigured } from "./env";
import { getGuestRepo, getHostRepo } from "./data";
import { DEMO_HOST } from "./demo-data";
import type { HostSession } from "./types";
import { createSupabaseServerClient } from "./supabase/server";

/* ---------------------------------------------------------------------------
   Sessions

   Guests get an opaque, signed session cookie so their conversation and
   requests belong to them without creating an account. Hosts authenticate with
   Supabase email + password when configured, or the demo host account when the
   local store is in use. Passwords are never stored by this application.
   --------------------------------------------------------------------------- */

const HOST_COOKIE = "concierge_host";
const GUEST_COOKIE = "concierge_guest";
const MAX_AGE = 60 * 60 * 24 * 30;

function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      exp?: number;
    } & T;
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readCookie(name: string) {
  const store = await cookies();
  return store.get(name)?.value;
}

export async function getGuestSessionId() {
  const token = await readCookie(GUEST_COOKIE);
  const payload = verify<{ guestSessionId: string }>(token);
  return payload?.guestSessionId ?? null;
}

export async function createGuestCookie(guestSessionId: string) {
  const store = await cookies();
  store.set(GUEST_COOKIE, sign({ guestSessionId, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearGuestCookie() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}

export async function getHostSession(): Promise<HostSession | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const repo = await getGuestRepo();
    const profile = await repo.ensureProfile({
      id: data.user.id,
      email: data.user.email ?? "",
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        data.user.email?.split("@")[0] ??
        "Host",
    });

    return {
      hostId: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      mode: "supabase",
    };
  }

  const payload = verify<HostSession>(await readCookie(HOST_COOKIE));
  if (!payload || !payload.hostId) return null;
  return { ...payload, mode: "local" };
}

export async function requireHostSession(): Promise<HostSession> {
  const session = await getHostSession();
  if (!session) redirect("/host/login");
  return session;
}

export async function signInHost(
  email: string,
  password: string,
): Promise<{ ok: true; session: HostSession } | { ok: false; error: string }> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error:
          error?.message === "Invalid login credentials"
            ? "That email and password combination doesn't match an account."
            : "We couldn't sign you in. Please try again.",
      };
    }

    const repo = await getGuestRepo();
    const profile = await repo.ensureProfile({
      id: data.user.id,
      email: data.user.email ?? email,
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        email.split("@")[0],
    });

    return {
      ok: true,
      session: {
        hostId: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        mode: "supabase",
      },
    };
  }

  const emailMatches = email.trim().toLowerCase() === env.demoHostEmail.toLowerCase();
  if (!emailMatches || password !== env.demoHostPassword) {
    return {
      ok: false,
      error: "Those demo credentials don't match. Use the details shown below.",
    };
  }

  const repo = await getHostRepo();
  const profile = await repo.ensureProfile({
    id: DEMO_HOST.id,
    email: env.demoHostEmail,
    fullName: DEMO_HOST.fullName,
  });

  const session: HostSession = {
    hostId: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    mode: "local",
  };

  const store = await cookies();
  store.set(HOST_COOKIE, sign({ ...session, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return { ok: true, session };
}

export async function signOutHost() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(HOST_COOKIE);
}

export const demoHostHint = {
  email: env.demoHostEmail,
  password: env.demoHostPassword,
};
