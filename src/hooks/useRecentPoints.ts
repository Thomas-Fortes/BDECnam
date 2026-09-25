"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ParticipantPublic, PointEvent, Team } from "@/lib/types";

export interface RecentPointItem extends PointEvent {
  participant: Pick<ParticipantPublic, "id" | "first_name" | "last_name" | "photo_path" | "team_id"> | null;
  team: Pick<Team, "id" | "name" | "color"> | null;
}

export function useRecentPoints(limit = 20) {
  const [items, setItems] = useState<RecentPointItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: events } = await supabase
        .from("point_events")
        .select("*")
        .eq("cancelled", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      const list = (events ?? []) as PointEvent[];
      const participantIds = [...new Set(list.map((e) => e.participant_id).filter(Boolean))] as string[];
      const teamIds = [...new Set(list.map((e) => e.team_id).filter(Boolean))] as string[];

      const [{ data: participants }, { data: teams }] = await Promise.all([
        participantIds.length
          ? supabase.from("participants_public").select("id, first_name, last_name, photo_path, team_id").in("id", participantIds)
          : Promise.resolve({ data: [] as ParticipantPublic[] }),
        teamIds.length
          ? supabase.from("teams").select("id, name, color").in("id", teamIds)
          : Promise.resolve({ data: [] as Team[] }),
      ]);

      const participantMap = new Map((participants ?? []).map((p) => [p.id, p]));
      const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));

      setItems(
        list.map((e) => ({
          ...e,
          participant: e.participant_id ? participantMap.get(e.participant_id) ?? null : null,
          team: e.team_id ? teamMap.get(e.team_id) ?? null : null,
        }))
      );
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("recent-points-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "point_events" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { items, loading };
}
