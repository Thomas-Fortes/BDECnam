"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { useTeams } from "@/hooks/useTeam";
import { createClient } from "@/lib/supabase/client";
import type { Participant } from "@/lib/types";

const NO_TEAM = "none";

function toCsv(rows: Participant[], teamNameById: Map<string, string>): string {
  const header = ["Prénom", "Nom", "Équipe", "Allergies / régime"];
  const lines = rows.map((p) =>
    [p.first_name, p.last_name, p.team_id ? teamNameById.get(p.team_id) ?? "" : "", p.diet_notes ?? ""]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function OrgaParticipantsPage() {
  const { teams } = useTeams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [keepId, setKeepId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("participants").select("*").order("first_name");
    setParticipants((data as Participant[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const teamNameById = useMemo(() => new Map(teams.map((t) => [t.id, t.name])), [teams]);

  const filtered = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.trim().toLowerCase();
    return participants.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q));
  }, [participants, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev));
  }

  async function handleTeamChange(participantId: string, teamId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("participants")
      .update({ team_id: teamId === NO_TEAM ? null : teamId })
      .eq("id", participantId);
    if (error) {
      toast.error("Impossible de changer l'équipe.");
      return;
    }
    load();
  }

  function handleExportCsv() {
    const csv = toCsv(participants, teamNameById);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants-wei.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openMergeDialog() {
    if (selected.length !== 2) {
      toast.error("Sélectionne exactement 2 participants à fusionner.");
      return;
    }
    setKeepId(selected[0]);
    setMergeOpen(true);
  }

  async function handleMerge() {
    if (!keepId || selected.length !== 2) return;
    const removeId = selected.find((id) => id !== keepId)!;
    const supabase = createClient();
    const { error } = await supabase.rpc("merge_participants", { p_keep_id: keepId, p_remove_id: removeId });
    if (error) {
      toast.error("Fusion impossible.");
      return;
    }
    toast.success("Doublon fusionné.");
    setMergeOpen(false);
    setSelected([]);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Participants</h2>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher…" className="flex-1" />
        <Button variant="secondary" size="sm" disabled={selected.length !== 2} onClick={openMergeDialog}>
          <GitMerge className="size-4" />
          Fusionner ({selected.length}/2)
        </Button>
      </div>

      {!loading && (
        <ul className="divide-y rounded-lg border">
          {filtered.map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-3 py-2.5">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleSelect(p.id)}
                className="size-4"
                aria-label={`Sélectionner ${p.first_name}`}
              />
              <ParticipantAvatar firstName={p.first_name} lastName={p.last_name} photoPath={p.photo_path} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.first_name} {p.last_name}
                </p>
                {p.diet_notes && <p className="truncate text-xs text-amber-600">⚠ {p.diet_notes}</p>}
              </div>
              <Select value={p.team_id ?? NO_TEAM} onValueChange={(v) => handleTeamChange(p.id, v as string)}>
                <SelectTrigger className="w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEAM}>Sans équipe</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fusionner les doublons</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Quel profil veux-tu garder ? L&apos;autre sera supprimé, ses points transférés.</p>
          <div className="space-y-2">
            {selected.map((id) => {
              const p = participants.find((x) => x.id === id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKeepId(id)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left ${keepId === id ? "ring-2 ring-primary" : ""}`}
                >
                  <ParticipantAvatar firstName={p.first_name} lastName={p.last_name} photoPath={p.photo_path} size="sm" />
                  <span className="text-sm font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={handleMerge}>Fusionner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
