"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PhotoChallenge, PhotoSubmission } from "@/lib/types";

export function usePhotoChallenges(participantId: string | null) {
  const [challenges, setChallenges] = useState<PhotoChallenge[]>([]);
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: ch } = await supabase.from("photo_challenges").select("*").eq("active", true).order("created_at");
    setChallenges((ch as PhotoChallenge[]) ?? []);

    if (participantId) {
      const { data: subs } = await supabase
        .from("photo_submissions")
        .select("*")
        .eq("participant_id", participantId);
      setSubmissions((subs as PhotoSubmission[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  return { challenges, submissions, loading, refresh: load };
}
