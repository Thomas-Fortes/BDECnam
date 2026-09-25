"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { writeSnapshot, readSnapshot } from "@/lib/offline-cache";
import type { SettingsPublic } from "@/lib/types";

const CACHE_KEY = "settings_public";

export function useSettings() {
  const [settings, setSettings] = useState<SettingsPublic | null>(
    () => readSnapshot<SettingsPublic>(CACHE_KEY)?.data ?? null
  );
  const [loading, setLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<string | null>(() => readSnapshot<SettingsPublic>(CACHE_KEY)?.cachedAt ?? null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase.from("settings_public").select("*").maybeSingle();
      if (data) {
        setSettings(data as SettingsPublic);
        writeSnapshot(CACHE_KEY, data);
        setCachedAt(new Date().toISOString());
      }
      setLoading(false);
    }

    load();
  }, []);

  return { settings, loading, cachedAt };
}
