"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ACTIVITY_ICONS } from "@/components/activity/activity-icons";
import { useActivities } from "@/hooks/useActivities";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_TYPE_LABELS } from "@/lib/constants";
import { formatDateTime, toDatetimeLocalValue, fromDatetimeLocalValue } from "@/lib/time";
import type { Activity, ActivityType } from "@/lib/types";

const EMPTY_FORM = {
  title: "",
  description: "",
  location_name: "",
  location_url: "",
  starts_at: "",
  ends_at: "",
  type: "activite" as ActivityType,
  points_info: "",
  menu: "",
};

export default function OrgaProgrammePage() {
  const { activities, loading } = useActivities();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const sorted = [...activities].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(a: Activity) {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description ?? "",
      location_name: a.location_name ?? "",
      location_url: a.location_url ?? "",
      starts_at: toDatetimeLocalValue(a.starts_at),
      ends_at: toDatetimeLocalValue(a.ends_at),
      type: a.type,
      points_info: a.points_info ?? "",
      menu: a.menu ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.starts_at || !form.ends_at) {
      toast.error("Titre, début et fin sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location_name: form.location_name.trim() || null,
        location_url: form.location_url.trim() || null,
        starts_at: fromDatetimeLocalValue(form.starts_at),
        ends_at: fromDatetimeLocalValue(form.ends_at),
        type: form.type,
        points_info: form.points_info.trim() || null,
        menu: form.menu.trim() || null,
      };

      const { error } = editing
        ? await supabase.from("activities").update(payload).eq("id", editing.id)
        : await supabase.from("activities").insert(payload);

      if (error) throw error;
      toast.success(editing ? "Activité modifiée." : "Activité créée.");
      setOpen(false);
    } catch {
      toast.error("Impossible d'enregistrer l'activité.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible.");
      return;
    }
    toast.success("Activité supprimée.");
  }

  async function handleShift(id: string, minutes: number) {
    const supabase = createClient();
    const { error } = await supabase.rpc("shift_activity", { p_activity_id: id, p_minutes: minutes });
    if (error) {
      toast.error("Décalage impossible.");
      return;
    }
    toast.success(`Décalé de ${minutes > 0 ? "+" : ""}${minutes} min.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Programme</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="size-4" />
            Ajouter
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier l'activité" : "Nouvelle activité"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActivityType })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Début</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Lieu</Label>
                <Input
                  value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lien carte (facultatif)</Label>
                <Input
                  value={form.location_url}
                  onChange={(e) => setForm({ ...form, location_url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {form.type === "repas" && (
                <div className="space-y-1.5">
                  <Label>Menu</Label>
                  <Textarea rows={2} value={form.menu} onChange={(e) => setForm({ ...form, menu: e.target.value })} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Points en jeu (facultatif)</Label>
                <Input
                  value={form.points_info}
                  onChange={(e) => setForm({ ...form, points_info: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving}>
                {editing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!loading && sorted.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune activité, ajoutes-en une !</p>
      )}

      <ul className="space-y-2">
        {sorted.map((a) => {
          const Icon = ACTIVITY_ICONS[a.type];
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Icon className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.starts_at)}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => handleShift(a.id, 15)} aria-label="+15 min">
                <FastForward className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label="Modifier">
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(a.id)} aria-label="Supprimer">
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
