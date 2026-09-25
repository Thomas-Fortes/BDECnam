"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { writeSnapshot, readSnapshot } from "@/lib/offline-cache";
import type { Announcement } from "@/lib/types";

const CACHE_KEY = "announcements";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    () => readSnapshot<Announcement[]>(CACHE_KEY)?.data ?? []
  );
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(() => readSnapshot<Announcement[]>(CACHE_KEY)?.cachedAt ?? null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (data) {
        setAnnouncements(data as Announcement[]);
        writeSnapshot(CACHE_KEY, data);
        setCachedAt(new Date().toISOString());
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { announcements, loading, cachedAt };
}
