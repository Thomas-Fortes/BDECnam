"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession, getMyParticipant } from "@/lib/auth";
import type { Participant } from "@/lib/types";

export function useParticipant() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    await ensureAnonymousSession(supabase);
    const p = await getMyParticipant(supabase);
    setParticipant(p);
    setLoading(false);
    return p;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { participant, loading, refresh };
}
