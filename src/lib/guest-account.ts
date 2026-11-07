import { getGuestRepo } from "./data";
import { createSupabaseAdminClient } from "./data/supabase";
import { isSupabaseConfigured } from "./env";
import { chooseCurrentStay } from "./guest-profile";
import { createSupabaseServerClient } from "./supabase/server";
import type { GuestAccount, Reservation } from "./types";

/* Guest accounts are real Supabase Auth users, tagged app_metadata.role =
   "guest" so the host session guard can never mistake them for a host. A stay
   is optional: if the account email matches a booking it is linked and offered
   after sign-in, otherwise the guest can browse hosts and request affiliation. */

type AccountResult =
  | { ok: true; booking: Reservation | null }
  | { ok: false; error: string; status?: number };

async function findBookableStay(email: string) {
  const repo = await getGuestRepo();
  const stays = await repo.listReservationsByEmail(email);
  return chooseCurrentStay(
    stays.filter((stay) => stay.status === "in_house" || stay.status === "upcoming"),
  );
}

export async function signUpGuestAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AccountResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: "Guest accounts need Supabase. Use the demo stay in local mode.",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName.trim() },
    app_metadata: { role: "guest" },
  });

  if (created.error) {
    const exists = /already|registered|exists/i.test(created.error.message);
    return {
      ok: false,
      error: exists
        ? "An account with that email already exists. Sign in instead."
        : "The guest account could not be created. Please try again.",
      status: exists ? 409 : 500,
    };
  }

  const supabase = await createSupabaseServerClient();
  const signedIn = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (signedIn.error || !signedIn.data.user) {
    if (created.data.user) {
      await admin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    }
    return {
      ok: false,
      error: "The account was created, but signing in failed. Try the sign-in form.",
      status: 500,
    };
  }

  // The account exists even when there is no booking. This is what lets a
  // first-time guest join the site and browse hosts on their own.
  const booking = await findBookableStay(email);
  return { ok: true, booking };
}

export async function signInGuestAccount(
  emailInput: string,
  password: string,
): Promise<AccountResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: "Guest accounts need Supabase. Use the demo stay in local mode.",
      status: 503,
    };
  }

  const email = emailInput.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return {
      ok: false,
      error: "That email and password combination doesn't match a guest account.",
      status: 401,
    };
  }

  if (data.user.app_metadata?.role !== "guest") {
    // Clear only this attempt. A host should not lose their existing host
    // session just because they used the guest form by mistake.
    await supabase.auth.signOut({ scope: "local" });
    return {
      ok: false,
      error: "That account is not a guest account. Use the host sign-in instead.",
      status: 403,
    };
  }

  const booking = await findBookableStay(data.user.email ?? email);
  return { ok: true, booking };
}

/** The signed-in Supabase user, only when it is a guest account. */
export async function getGuestAccount(): Promise<GuestAccount | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user || data.user.app_metadata?.role !== "guest") return null;

    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName:
        (data.user.user_metadata?.full_name as string | undefined) ??
        data.user.email?.split("@")[0] ??
        "Guest",
    };
  } catch {
    return null;
  }
}

/** Clear a guest account session without touching a host session. */
export async function signOutGuestAccount() {
  if (!isSupabaseConfigured) return;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.app_metadata?.role === "guest") {
      await supabase.auth.signOut();
    }
  } catch {
    // A guest cookie can still be cleared even if auth is unreachable.
  }
}
