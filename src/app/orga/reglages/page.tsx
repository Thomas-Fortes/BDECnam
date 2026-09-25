"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTeams } from "@/hooks/useTeam";
import { useSettings } from "@/hooks/useSettings";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TEAM_COLORS } from "@/lib/constants";
import type { ContactInfo, SafetyContact, Team } from "@/lib/types";

export default function OrgaReglagesPage() {
  const { settings, loading: settingsLoading } = useSettings();
  const { teams, refresh: refreshTeams } = useTeams();

  const [general, setGeneral] = useState({
    event_name: "",
    start_date: "",
    end_date: "",
    address: "",
    address_url: "",
    transport_info: "",
  });
  const [checklistText, setChecklistText] = useState("");
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [safetyContacts, setSafetyContacts] = useState<SafetyContact[]>([]);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [deletingPhotos, setDeletingPhotos] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGeneral({
      event_name: settings.event_name ?? "",
      start_date: settings.start_date ?? "",
      end_date: settings.end_date ?? "",
      address: settings.address ?? "",
      address_url: settings.address_url ?? "",
      transport_info: settings.transport_info ?? "",
    });
    setChecklistText((settings.checklist ?? []).join("\n"));
    setContacts(settings.contacts ?? []);
    setSafetyContacts(settings.safety_contacts ?? []);
    setIncludeMembers(settings.team_points_include_members ?? true);
  }, [settings]);

  async function saveGeneral() {
    setSavingGeneral(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("settings")
        .update({
          ...general,
          checklist: checklistText.split("\n").map((s) => s.trim()).filter(Boolean),
          contacts,
          safety_contacts: safetyContacts,
          team_points_include_members: includeMembers,
        })
        .eq("id", true);
      if (error) throw error;
      toast.success("Réglages enregistrés.");
    } catch {
      toast.error("Enregistrement impossible.");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function handleAddTeam() {
    const supabase = createClient();
    const color = DEFAULT_TEAM_COLORS[teams.length % DEFAULT_TEAM_COLORS.length];
    const { error } = await supabase.from("teams").insert({ name: "Nouvelle équipe", color });
    if (error) {
      toast.error("Impossible de créer l'équipe.");
      return;
    }
    refreshTeams();
  }

  async function handleUpdateTeam(team: Team, patch: Partial<Team>) {
    const supabase = createClient();
    await supabase.from("teams").update(patch).eq("id", team.id);
    refreshTeams();
  }

  async function handleDeleteTeam(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible (des participants y sont peut-être rattachés).");
      return;
    }
    refreshTeams();
  }

  async function handleSetCode() {
    if (!code.trim()) return;
    setSavingCode(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_wei_code", { p_new_code: code.trim() });
      if (error) throw error;
      toast.success("Code du WEI mis à jour.");
      setCode("");
    } catch {
      toast.error("Impossible de changer le code.");
    } finally {
      setSavingCode(false);
    }
  }

  async function handleSetPin() {
    if (!pin.trim()) return;
    setSavingPin(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("set_orga_pin", { p_new_pin: pin.trim() });
      if (error) throw error;
      toast.success("PIN orga mis à jour.");
      setPin("");
    } catch {
      toast.error("Impossible de changer le PIN.");
    } finally {
      setSavingPin(false);
    }
  }

  async function handleMapUpload(file: File | undefined) {
    if (!file) return;
    setUploadingMap(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `site-map.${ext}`;
      const { error: uploadError } = await supabase.storage.from("settings").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("settings").update({ site_map_path: path }).eq("id", true);
      if (error) throw error;
      toast.success("Carte du site mise à jour.");
    } catch {
      toast.error("Envoi impossible.");
    } finally {
      setUploadingMap(false);
    }
  }

  async function handleDeleteAllPhotos() {
    setDeletingPhotos(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("delete_all_photos");
      if (error) throw error;

      const [{ data: avatarFiles }, { data: challengeFolders }] = await Promise.all([
        supabase.storage.from("avatars").list(),
        supabase.storage.from("challenges").list(),
      ]);
      if (avatarFiles?.length) {
        await supabase.storage.from("avatars").remove(avatarFiles.map((f) => f.name));
      }
      for (const folder of challengeFolders ?? []) {
        const { data: files } = await supabase.storage.from("challenges").list(folder.name);
        if (files?.length) {
          await supabase.storage.from("challenges").remove(files.map((f) => `${folder.name}/${f.name}`));
        }
      }

      toast.success("Toutes les photos ont été supprimées.");
    } catch {
      toast.error("Suppression incomplète, réessaie.");
    } finally {
      setDeletingPhotos(false);
    }
  }

  if (settingsLoading) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <h2 className="text-xl font-bold">Réglages</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Infos de l&apos;événement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nom de l&apos;événement</Label>
            <Input value={general.event_name} onChange={(e) => setGeneral({ ...general, event_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Date de début</Label>
              <Input type="date" value={general.start_date} onChange={(e) => setGeneral({ ...general, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de fin</Label>
              <Input type="date" value={general.end_date} onChange={(e) => setGeneral({ ...general, end_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={general.address} onChange={(e) => setGeneral({ ...general, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Lien Maps</Label>
            <Input value={general.address_url} onChange={(e) => setGeneral({ ...general, address_url: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Transport</Label>
            <Textarea rows={2} value={general.transport_info} onChange={(e) => setGeneral({ ...general, transport_info: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Checklist (une ligne = un objet)</Label>
            <Textarea rows={4} value={checklistText} onChange={(e) => setChecklistText(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
            <div>
              <p className="text-sm font-medium">Points d&apos;équipe incluent les points individuels</p>
              <p className="text-xs text-muted-foreground">Sinon, seuls les points donnés directement à l&apos;équipe comptent.</p>
            </div>
            <Switch checked={includeMembers} onCheckedChange={setIncludeMembers} />
          </div>

          <Button onClick={saveGeneral} disabled={savingGeneral} className="w-full">
            {savingGeneral ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Équipes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {teams.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <input
                type="color"
                value={t.color}
                onChange={(e) => handleUpdateTeam(t, { color: e.target.value })}
                className="size-8 shrink-0 rounded border"
              />
              <Input
                defaultValue={t.name}
                onBlur={(e) => e.target.value !== t.name && handleUpdateTeam(t, { name: e.target.value })}
                className="flex-1"
              />
              <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteTeam(t.id)} aria-label="Supprimer l'équipe">
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddTeam}>
            <Plus className="size-4" />
            Ajouter une équipe
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carte du site</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Upload className="size-4" />
            {uploadingMap ? "Envoi…" : "Choisir une image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMapUpload(e.target.files?.[0])} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code du WEI</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nouveau code" />
          <Button onClick={handleSetCode} disabled={savingCode}>
            Changer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PIN orga</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Nouveau PIN" inputMode="numeric" />
          <Button onClick={handleSetPin} disabled={savingPin}>
            Changer
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" className="w-full" />}>
              Supprimer toutes les photos
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer toutes les photos ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Avatars et photos de défis seront définitivement supprimés pour tout le monde. À utiliser après le WEI.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllPhotos} disabled={deletingPhotos}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
