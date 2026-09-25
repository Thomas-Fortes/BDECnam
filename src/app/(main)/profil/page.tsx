"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/avatar/AvatarUpload";
import { PhotoChallengeCard } from "@/components/challenges/PhotoChallengeCard";
import { useParticipantContext } from "@/components/providers/ParticipantProvider";
import { useTeam } from "@/hooks/useTeam";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { useMyPointHistory } from "@/hooks/useMyPointHistory";
import { usePhotoChallenges } from "@/hooks/usePhotoChallenges";
import { useOrganizer } from "@/hooks/useOrganizer";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/time";

export default function ProfilPage() {
  const { participant, refresh } = useParticipantContext();
  const team = useTeam(participant?.team_id ?? null);
  const { individual, teams } = useRealtimeLeaderboard();
  const { items: history } = useMyPointHistory(participant?.id ?? null);
  const { challenges, submissions, refresh: refreshChallenges } = usePhotoChallenges(participant?.id ?? null);
  const { isOrga, loading: orgaLoading } = useOrganizer();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  if (!participant) return null;

  const myRank = individual.findIndex((p) => p.participant_id === participant.id);
  const myPoints = myRank >= 0 ? individual[myRank].points : 0;
  const myTeamRank = team ? teams.findIndex((t) => t.team_id === team.id) : -1;

  async function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setPinBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("verify_orga_pin", { p_pin: pin.trim() });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) {
        toast.success("Accès orga débloqué !");
        setPin("");
        router.push("/orga");
      } else {
        toast.error("PIN incorrect.");
      }
    } finally {
      setPinBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <AvatarUpload
            participantId={participant.id}
            firstName={participant.first_name}
            lastName={participant.last_name}
            photoPath={participant.photo_path}
            teamColor={team?.color ?? null}
            onChanged={() => refresh()}
          />
          <p className="text-lg font-bold">
            {participant.first_name} {participant.last_name}
          </p>
          {team && (
            <Badge style={{ backgroundColor: team.color, color: "white" }}>{team.name}</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mes points</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg bg-muted py-3">
            <p className="text-2xl font-bold">{myPoints}</p>
            <p className="text-xs text-muted-foreground">points{myRank >= 0 ? ` · ${myRank + 1}e` : ""}</p>
          </div>
          <div className="rounded-lg bg-muted py-3">
            <p className="text-2xl font-bold">{team ? teams[myTeamRank]?.points ?? 0 : "—"}</p>
            <p className="text-xs text-muted-foreground">
              points équipe{myTeamRank >= 0 ? ` · ${myTeamRank + 1}e` : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className={`flex items-center justify-between text-sm ${h.cancelled ? "opacity-40 line-through" : ""}`}>
                <div>
                  <p className="font-medium">{h.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                </div>
                <span className={`font-bold ${h.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {h.amount >= 0 ? "+" : ""}
                  {h.amount}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {challenges.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Défis photo</h2>
          {challenges.map((c) => (
            <PhotoChallengeCard
              key={c.id}
              challenge={c}
              participantId={participant.id}
              submission={submissions.find((s) => s.challenge_id === c.id) ?? null}
              onSubmitted={refreshChallenges}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Espace orga
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgaLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : isOrga ? (
            <Button className="w-full" render={<Link href="/orga" />}>
              Ouvrir l&apos;espace orga
            </Button>
          ) : (
            <form onSubmit={handlePin} className="flex gap-2">
              <Input
                type="password"
                inputMode="numeric"
                placeholder="PIN orga"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <Button type="submit" disabled={pinBusy}>
                {pinBusy ? <Loader2 className="size-4 animate-spin" /> : "Valider"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
