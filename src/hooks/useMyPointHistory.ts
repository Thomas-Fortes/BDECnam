"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PointEvent } from "@/lib/types";

export function useMyPointHistory(participantId: string | null) {
  const [items, setItems] = useState<PointEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!participantId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("point_events")
        .select("*")
        .eq("participant_id", participantId)
        .order("created_at", { ascending: false });
      setItems((data as PointEvent[]) ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`my-points-${participantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "point_events", filter: `participant_id=eq.${participantId}` },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId]);

  return { items, loading };
}
