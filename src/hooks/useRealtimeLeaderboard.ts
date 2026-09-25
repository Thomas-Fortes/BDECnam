"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { writeSnapshot, readSnapshot } from "@/lib/offline-cache";
import type { LeaderboardIndividualRow, LeaderboardTeamRow } from "@/lib/types";

export function useRealtimeLeaderboard() {
  const [individual, setIndividual] = useState<LeaderboardIndividualRow[]>(
    () => readSnapshot<LeaderboardIndividualRow[]>("leaderboard_individual")?.data ?? []
  );
  const [teams, setTeams] = useState<LeaderboardTeamRow[]>(
    () => readSnapshot<LeaderboardTeamRow[]>("leaderboard_teams")?.data ?? []
  );
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(
    () => readSnapshot<LeaderboardIndividualRow[]>("leaderboard_individual")?.cachedAt ?? null
  );
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: ind }, { data: tea }] = await Promise.all([
        supabase.from("leaderboard_individual").select("*"),
        supabase.from("leaderboard_teams").select("*"),
      ]);
      if (ind) {
        setIndividual(ind as LeaderboardIndividualRow[]);
        writeSnapshot("leaderboard_individual", ind);
      }
      if (tea) {
        setTeams(tea as LeaderboardTeamRow[]);
        writeSnapshot("leaderboard_teams", tea);
      }
      setCachedAt(new Date().toISOString());
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("point-events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "point_events" }, () => {
        setLastEventAt(new Date().toISOString());
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { individual, teams, loading, cachedAt, lastEventAt };
}
