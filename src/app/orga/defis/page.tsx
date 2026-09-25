"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { publicStorageUrl } from "@/lib/constants";
import type { ParticipantPublic, PhotoChallenge, PhotoSubmission } from "@/lib/types";

interface Row extends PhotoSubmission {
  participant: ParticipantPublic | null;
  challenge: PhotoChallenge | null;
}

export default function OrgaDefisPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: subs } = await supabase
      .from("photo_submissions")
      .select("*")
      .eq("status", "en_attente")
      .order("created_at");

    const list = (subs ?? []) as PhotoSubmission[];
    const participantIds = [...new Set(list.map((s) => s.participant_id))];
    const challengeIds = [...new Set(list.map((s) => s.challenge_id))];

    const [{ data: participants }, { data: challenges }] = await Promise.all([
      participantIds.length
        ? supabase.from("participants_public").select("*").in("id", participantIds)
        : Promise.resolve({ data: [] as ParticipantPublic[] }),
      challengeIds.length
        ? supabase.from("photo_challenges").select("*").in("id", challengeIds)
        : Promise.resolve({ data: [] as PhotoChallenge[] }),
    ]);

    const pMap = new Map((participants ?? []).map((p) => [p.id, p]));
    const cMap = new Map((challenges ?? []).map((c) => [c.id, c]));

    setRows(
      list.map((s) => ({
        ...s,
        participant: pMap.get(s.participant_id) ?? null,
        challenge: cMap.get(s.challenge_id) ?? null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReview(id: string, approve: boolean) {
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("review_photo_submission", { p_submission_id: id, p_approve: approve });
      if (error) throw error;
      toast.success(approve ? "Défi validé, points attribués !" : "Défi refusé.");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Action impossible.");
    } finally {
      setBusyId(null);
    }
  }

  if (!loading && rows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aucun défi en attente de validation 🎉</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Défis photo à valider</h2>
      {rows.map((r) => (
        <Card key={r.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={publicStorageUrl("challenges", r.photo_path)} alt={r.challenge?.title ?? "Photo"} className="max-h-80 w-full object-cover" />
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.challenge?.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {r.participant ? `${r.participant.first_name} ${r.participant.last_name}` : "?"} · +{r.challenge?.points ?? 0} pts
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="icon" variant="destructive" disabled={busyId === r.id} onClick={() => handleReview(r.id, false)}>
                <X className="size-4" />
              </Button>
              <Button size="icon" disabled={busyId === r.id} onClick={() => handleReview(r.id, true)}>
                <Check className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
