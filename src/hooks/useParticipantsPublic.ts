"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ParticipantPublic } from "@/lib/types";

export function useParticipantsPublic() {
  const [participants, setParticipants] = useState<ParticipantPublic[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("participants_public").select("*").order("first_name");
    setParticipants((data as ParticipantPublic[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return { participants, loading, refresh: load };
}
