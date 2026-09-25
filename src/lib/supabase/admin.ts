import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client service_role : bypass RLS. Ne jamais importer depuis un composant
 * client ni depuis une route exposée sans vérification préalable — réservé
 * aux scripts serveur (seed) et à d'éventuelles routes admin.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
