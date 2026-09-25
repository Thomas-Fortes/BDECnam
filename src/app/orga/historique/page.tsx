"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/time";
import type { ParticipantPublic, PointEvent, Team } from "@/lib/types";

interface Row extends PointEvent {
  participant: ParticipantPublic | null;
  team: Team | null;
}

export default function OrgaHistoriquePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: events } = await supabase
      .from("point_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const list = (events ?? []) as PointEvent[];
    const participantIds = [...new Set(list.map((e) => e.participant_id).filter(Boolean))] as string[];
    const teamIds = [...new Set(list.map((e) => e.team_id).filter(Boolean))] as string[];

    const [{ data: participants }, { data: teams }] = await Promise.all([
      participantIds.length
        ? supabase.from("participants_public").select("*").in("id", participantIds)
        : Promise.resolve({ data: [] as ParticipantPublic[] }),
      teamIds.length ? supabase.from("teams").select("*").in("id", teamIds) : Promise.resolve({ data: [] as Team[] }),
    ]);

    const pMap = new Map((participants ?? []).map((p) => [p.id, p]));
    const tMap = new Map((teams ?? []).map((t) => [t.id, t]));

    setRows(
      list.map((e) => ({
        ...e,
        participant: e.participant_id ? pMap.get(e.participant_id) ?? null : null,
        team: e.team_id ? tMap.get(e.team_id) ?? null : null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const name = r.participant ? `${r.participant.first_name} ${r.participant.last_name}` : r.team?.name ?? "";
      return name.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
    });
  }, [rows, search]);

  async function handleCancel(id: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("cancel_point_event", { p_id: id });
    if (error) {
      toast.error("Impossible d'annuler.");
      return;
    }
    toast.success("Points annulés.");
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Historique des points</h2>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filtrer par participant, équipe ou raison…"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 px-3 py-2.5 ${r.cancelled ? "opacity-40" : ""}`}>
              {r.participant ? (
                <ParticipantAvatar
                  firstName={r.participant.first_name}
                  lastName={r.participant.last_name}
                  photoPath={r.participant.photo_path}
                  size="sm"
                />
              ) : (
                <span className="size-8 shrink-0 rounded-full" style={{ backgroundColor: r.team?.color ?? "#64748B" }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {r.participant ? `${r.participant.first_name} ${r.participant.last_name}` : r.team?.name}
                  {r.cancelled && <span className="ml-1.5 text-xs font-normal">(annulé)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.reason} · {formatDateTime(r.created_at)}
                </p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${r.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {r.amount >= 0 ? "+" : ""}
                {r.amount}
              </span>
              {!r.cancelled && (
                <Button variant="ghost" size="icon-sm" onClick={() => handleCancel(r.id)} aria-label="Annuler">
                  <Undo2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">Aucun résultat.</li>
          )}
        </ul>
      )}
    </div>
  );
}
