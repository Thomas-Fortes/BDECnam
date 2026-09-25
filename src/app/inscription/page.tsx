"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
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
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession, getMyParticipant } from "@/lib/auth";
import { uploadAvatar } from "@/lib/avatar";
import type { Team } from "@/lib/types";

const UNASSIGNED = "unassigned";

export default function InscriptionPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [checking, setChecking] = useState(true);
  const [bootFailed, setBootFailed] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamId, setTeamId] = useState<string>(UNASSIGNED);
  const [code, setCode] = useState("");
  const [dietNotes, setDietNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const boot = useCallback(async () => {
    setChecking(true);
    setBootFailed(false);
    try {
      const supabase = createClient();
      await ensureAnonymousSession(supabase);
      const existing = await getMyParticipant(supabase);
      if (existing) {
        router.replace("/accueil");
        return;
      }
      const { data } = await supabase.from("teams").select("*").order("name");
      setTeams((data as Team[]) ?? []);
      setChecking(false);
    } catch {
      setBootFailed(true);
    }
  }, [router]);

  useEffect(() => {
    boot();
  }, [boot]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !code.trim()) {
      toast.error("Prénom, nom et code du WEI sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: participant, error } = await supabase
        .rpc("join_wei", {
          p_code: code.trim(),
          p_first_name: firstName.trim(),
          p_last_name: lastName.trim(),
          p_team_id: teamId === UNASSIGNED ? null : teamId,
          p_diet_notes: dietNotes.trim() || null,
        })
        .single();

      if (error || !participant) {
        toast.error(error?.message === "Code du WEI invalide." ? "Code du WEI invalide 🤔" : "Impossible de t'inscrire, réessaie.");
        setSubmitting(false);
        return;
      }

      if (photoFile) {
        try {
          await uploadAvatar(supabase, (participant as { id: string }).id, photoFile);
        } catch {
          toast.warning("Inscription réussie, mais la photo n'a pas pu être envoyée.");
        }
      }

      toast.success(`Bienvenue ${firstName} !`);
      router.replace("/accueil");
    } finally {
      setSubmitting(false);
    }
  }

  if (bootFailed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
        <WifiOff className="size-8" />
        <p className="text-sm">Impossible de te connecter, vérifie ta connexion.</p>
        <Button size="sm" onClick={boot}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo size="lg" />
        <div>
          <h1 className="text-xl font-bold">WEI 2026</h1>
          <p className="text-sm text-muted-foreground">L&apos;énergie du campus — rejoins le WEI en quelques secondes !</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AvatarPicker onChange={setPhotoFile} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="team">Équipe</Label>
          <Select value={teamId} onValueChange={(v) => setTeamId((v as string) ?? UNASSIGNED)}>
            <SelectTrigger id="team" className="w-full">
              <SelectValue placeholder="Choisis ton équipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Je ne sais pas encore</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code">Code du WEI</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="Donné par les orgas"
            autoCapitalize="characters"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diet">Allergies / régime alimentaire (facultatif)</Label>
          <Textarea id="diet" value={dietNotes} onChange={(e) => setDietNotes(e.target.value)} rows={2} />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Ta photo est visible uniquement par les participants du WEI et sera supprimée après l&apos;événement.
        </p>

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : "Je rejoins le WEI 🎉"}
        </Button>
      </form>
    </div>
  );
}
