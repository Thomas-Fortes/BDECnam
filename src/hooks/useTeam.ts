"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("teams").select("*").order("name");
    setTeams((data as Team[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return { teams, loading, refresh };
}

export function useTeam(teamId: string | null): Team | null {
  const { teams } = useTeams();
  if (!teamId) return null;
  return teams.find((t) => t.id === teamId) ?? null;
}
