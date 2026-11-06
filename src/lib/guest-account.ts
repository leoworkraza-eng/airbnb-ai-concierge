import { getGuestRepo } from "./data";
import { createSupabaseAdminClient } from "./data/supabase";
import { isSupabaseConfigured } from "./env";
import { chooseCurrentStay } from "./guest-profile";
import { createSupabaseServerClient } from "./supabase/server";
import type { Reservation } from "./types";

/* Guest accounts are real Supabase Auth users, tagged app_metadata.role =
   "guest" so the host session guard can never mistake them for a host. The
   profile itself still comes from the reservation linked to their email. */

type AccountResult =
  | { ok: true; booking: Reservation }
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
  const booking = await findBookableStay(email);
  if (!booking) {
    return {
      ok: false,
      error:
        "We couldn't find an active or upcoming booking for that email. Use the email on your reservation, or ask your host to add it.",
      status: 404,
    };
  }

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
        ? "A guest account with that email already exists. Sign in instead."
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
    return {
      ok: false,
      error: "That account is not a guest account. Use the host sign-in instead.",
      status: 403,
    };
  }

  const booking = await findBookableStay(data.user.email ?? email);
  if (!booking) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error:
        "That guest account has no active or upcoming stay. Ask your host to add the booking email.",
      status: 404,
    };
  }

  return { ok: true, booking };
}

/** The signed-in Supabase user, only when it is a guest account. */
export async function getGuestAccount() {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user || data.user.app_metadata?.role !== "guest") return null;

    return {
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
