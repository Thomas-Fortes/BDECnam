"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Search, Users, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { useParticipantsPublic } from "@/hooks/useParticipantsPublic";
import { useTeams } from "@/hooks/useTeam";
import { useActivities } from "@/hooks/useActivities";
import { createClient } from "@/lib/supabase/client";
import { QUICK_POINT_AMOUNTS } from "@/lib/constants";
import { cn } from "cn";

const NO_ACTIVITY = "none";

export default function OrgaPointsPage() {
  const [target, setTarget] = useState<"participant" | "team">("participant");
  const { participants } = useParticipantsPublic();
  const { teams } = useTeams();
  const { activities } = useActivities();

  const [search, setSearch] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [reason, setReason] = useState("");
  const [activityId, setActivityId] = useState<string>(NO_ACTIVITY);
  const [recentReasons, setRecentReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("point_events")
      .select("reason")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((d) => d.reason))].slice(0, 8);
        setRecentReasons(unique);
      });
  }, []);

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants.slice(0, 8);
    const q = search.trim().toLowerCase();
    return participants
      .filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [participants, search]);

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const finalAmount = customAmount.trim() ? Number(customAmount) : amount;

  function reset() {
    setSelectedParticipantId(null);
    setSelectedTeamId(null);
    setAmount(null);
    setCustomAmount("");
    setReason("");
    setActivityId(NO_ACTIVITY);
    setSearch("");
  }

  async function handleSubmit() {
    if (target === "participant" && !selectedParticipantId) {
      toast.error("Choisis un participant.");
      return;
    }
    if (target === "team" && !selectedTeamId) {
      toast.error("Choisis une équipe.");
      return;
    }
    if (!finalAmount || Number.isNaN(finalAmount)) {
      toast.error("Choisis un montant de points.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Indique une raison.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("point_events").insert({
        participant_id: target === "participant" ? selectedParticipantId : null,
        team_id: target === "team" ? selectedTeamId : null,
        amount: finalAmount,
        reason: reason.trim(),
        activity_id: activityId === NO_ACTIVITY ? null : activityId,
        given_by: user!.id,
      });

      if (error) throw error;

      toast.success(
        `${finalAmount > 0 ? "+" : ""}${finalAmount} pts pour ${
          target === "participant" ? `${selectedParticipant?.first_name}` : selectedTeam?.name
        } !`
      );
      reset();
    } catch {
      toast.error("Impossible d'enregistrer ces points.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <h2 className="text-xl font-bold">Donner des points</h2>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={target === "participant" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setTarget("participant")}
        >
          <UserIcon className="size-4" />
          Participant
        </Button>
        <Button
          type="button"
          variant={target === "team" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setTarget("team")}
        >
          <Users className="size-4" />
          Équipe
        </Button>
      </div>

      {target === "participant" ? (
        <div className="space-y-2">
          {selectedParticipant ? (
            <div className="flex items-center gap-3 rounded-lg border bg-primary/5 p-3">
              <ParticipantAvatar
                firstName={selectedParticipant.first_name}
                lastName={selectedParticipant.last_name}
                photoPath={selectedParticipant.photo_path}
                size="md"
              />
              <p className="flex-1 font-medium">
                {selectedParticipant.first_name} {selectedParticipant.last_name}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParticipantId(null)}>
                Changer
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher un prénom…"
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredParticipants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedParticipantId(p.id)}
                    className="flex items-center gap-2 rounded-lg border p-2 text-left hover:bg-muted"
                  >
                    <ParticipantAvatar firstName={p.first_name} lastName={p.last_name} photoPath={p.photo_path} size="sm" />
                    <span className="truncate text-sm font-medium">{p.first_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTeamId(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-left font-medium",
                selectedTeamId === t.id && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: `${t.color}20` }}
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
              {selectedTeamId === t.id && <Check className="ml-auto size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Montant</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_POINT_AMOUNTS.map((a) => (
            <Button
              key={a}
              type="button"
              variant={amount === a && !customAmount ? "default" : "outline"}
              onClick={() => {
                setAmount(a);
                setCustomAmount("");
              }}
            >
              {a > 0 ? `+${a}` : a}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          placeholder="Montant libre"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setAmount(null);
          }}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Raison</p>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Réveil le plus rapide" />
        {recentReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recentReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted-foreground/20"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Activité liée (facultatif)</p>
        <Select value={activityId} onValueChange={(v) => setActivityId((v as string) ?? NO_ACTIVITY)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Aucune" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ACTIVITY}>Aucune</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button size="lg" onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : "Valider"}
      </Button>
    </div>
  );
}
