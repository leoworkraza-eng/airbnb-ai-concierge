import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isSupabaseConfigured } from "./env";
import { getGuestRepo, getHostRepo } from "./data";
import { DEMO_HOST } from "./demo-data";
import { buildOfferingInput, type OfferingInput } from "./offerings";
import type { HostSession } from "./types";
import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./data/supabase";

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

    // Guest accounts are Supabase users too. Their app metadata keeps them out
    // of the host workspace even though both use the same auth cookie jar.
    if (data.user.app_metadata?.role === "guest") return null;

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

    if (data.user.app_metadata?.role === "guest") {
      // Clear only this attempt. A guest should not lose their existing guest
      // session just because they used the host form by mistake.
      await supabase.auth.signOut({ scope: "local" });
      return {
        ok: false,
        error: "That is a guest account. Use guest sign-in instead.",
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

/* Real account creation, without the Supabase dashboard.

   The admin client creates the account with a confirmed email, then the normal
   server client signs in so the session and its cookies are genuine. */

export async function signUpHost(input: {
  email: string;
  password: string;
  fullName?: string;
  offering: OfferingInput;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error:
        "Accounts need Supabase. In local mode, use the demo host account shown on the sign-in page.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName?.trim() || email.split("@")[0];
  const admin = createSupabaseAdminClient();

  const created = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: "host" },
  });

  if (created.error) {
    const exists = /already|registered|exists/i.test(created.error.message);
    return {
      ok: false,
      error: exists
        ? "An account with that email already exists. Sign in with the guest or host form you used."
        : "The account could not be created. Please try again.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: "The account was created, but signing in failed. Try the sign-in form.",
    };
  }

  const repo = await getGuestRepo();
  const profile = await repo.ensureProfile({ id: data.user.id, email, fullName });

  // The host describes their first offering during onboarding. We never seed a
  // property the host did not create: a real host should see their own place.
  try {
    await repo.createProperty(profile.id, buildOfferingInput(input.offering));
  } catch (error) {
    console.error("[host] Could not create the first offering", error);
    return {
      ok: false,
      error:
        "Your account was created, but the first offering could not be saved. Sign in and add it from your dashboard.",
    };
  }

  return { ok: true };
}

/* One-click entry for the demo host.

   Signing up through the Supabase dashboard is fine for a real account, but a
   demo cannot depend on it: this provisions the demo host on first use with the
   service-role client (email already confirmed), then signs in normally so the
   session still comes from Supabase auth. Idempotent — later calls just sign in. */

async function provisionDemoHostAccount() {
  const admin = createSupabaseAdminClient();
  const email = env.demoHostEmail;

  const created = await admin.auth.admin.createUser({
    email,
    password: env.demoHostPassword,
    email_confirm: true,
    user_metadata: { full_name: DEMO_HOST.fullName },
  });

  if (!created.error) return;
  if (!/already|registered|exists/i.test(created.error.message)) {
    throw new Error(created.error.message);
  }

  // The account exists with a different password: restore the documented one so
  // the demo button always works on this project.
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = listed.data?.users.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) throw new Error("The demo host could not be found in Supabase auth.");

  const updated = await admin.auth.admin.updateUserById(user.id, {
    password: env.demoHostPassword,
    email_confirm: true,
  });
  if (updated.error) throw new Error(updated.error.message);
}

export async function enterDemoHost(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) {
    const result = await signInHost(env.demoHostEmail, env.demoHostPassword);
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  }

  const supabase = await createSupabaseServerClient();
  const signIn = () =>
    supabase.auth.signInWithPassword({
      email: env.demoHostEmail,
      password: env.demoHostPassword,
    });

  let { data } = await signIn();

  if (!data?.user) {
    try {
      await provisionDemoHostAccount();
    } catch (error) {
      console.error("[host] Could not provision the demo account", error);
      return {
        ok: false,
        error:
          "The demo host account could not be created automatically. Sign in with a Supabase account instead, or check the service-role key.",
      };
    }
    ({ data } = await signIn());
  }

  if (!data?.user) {
    return {
      ok: false,
      error: "The demo host account exists but sign-in failed. Try the form with the credentials shown on this page.",
    };
  }

  const repo = await getGuestRepo();
  await repo.ensureProfile({
    id: data.user.id,
    email: env.demoHostEmail,
    fullName: DEMO_HOST.fullName,
  });

  return { ok: true };
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
