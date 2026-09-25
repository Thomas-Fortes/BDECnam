"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { writeSnapshot, readSnapshot } from "@/lib/offline-cache";
import type { Activity } from "@/lib/types";

const CACHE_KEY = "activities";

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(() => readSnapshot<Activity[]>(CACHE_KEY)?.data ?? []);
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(() => readSnapshot<Activity[]>(CACHE_KEY)?.cachedAt ?? null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data, error } = await supabase.from("activities").select("*").order("starts_at");
      if (!error && data) {
        setActivities(data as Activity[]);
        writeSnapshot(CACHE_KEY, data);
        setCachedAt(new Date().toISOString());
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("activities-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { activities, loading, cachedAt };
}

export function currentAndNextActivity(activities: Activity[], now: Date) {
  const t = now.getTime();
  const sorted = [...activities].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const current = sorted.find((a) => new Date(a.starts_at).getTime() <= t && t < new Date(a.ends_at).getTime());
  const next = sorted.find((a) => new Date(a.starts_at).getTime() > t);

  return { current: current ?? null, next: next ?? null };
}
