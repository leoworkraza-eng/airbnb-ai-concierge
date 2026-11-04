import { LocalRepository } from "./local";
import { SupabaseRepository, createSupabaseAdminClient } from "./supabase";
import { isSupabaseConfigured } from "../env";
import { createSupabaseServerClient } from "../supabase/server";
import type { Repository } from "./repo";

let localRepository: LocalRepository | undefined;

/** Server-side repository for guest and AI flows (service role / local file). */
export async function getGuestRepo(): Promise<Repository> {
  if (isSupabaseConfigured) {
    return new SupabaseRepository(createSupabaseAdminClient());
  }
  localRepository ??= new LocalRepository();
  return localRepository;
}

/**
 * Repository for host-facing flows.
 *
 * With Supabase configured this uses the signed-in host's own client, so RLS
 * restricts every read and write to properties that host owns. Without it, the
 * local development store filters by host id explicitly.
 */
export async function getHostRepo(): Promise<Repository> {
  if (isSupabaseConfigured) {
    const client = await createSupabaseServerClient();
    return new SupabaseRepository(client);
  }
  localRepository ??= new LocalRepository();
  return localRepository;
}

/**
 * Service-role repository for server-only records — integration credentials,
 * and the guest-side writes the unauthenticated flows perform. Never hand this
 * to a client component.
 */
export const getServiceRepo = getGuestRepo;

export type { Repository } from "./repo";
