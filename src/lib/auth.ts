import type { SupabaseClient } from "@supabase/supabase-js";
import type { Participant } from "@/lib/types";

/**
 * Garantit une session (anonyme si besoin). Idempotent : si une session
 * existe déjà (anonyme ou non), ne fait rien.
 */
export async function ensureAnonymousSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function getMyParticipant(supabase: SupabaseClient): Promise<Participant | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Participant | null;
}

export async function isOrganizer(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("organizers")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
