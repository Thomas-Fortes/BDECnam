"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, removeAvatar } from "@/lib/avatar";

export function AvatarUpload({
  participantId,
  firstName,
  lastName,
  photoPath,
  teamColor,
  onChanged,
}: {
  participantId: string;
  firstName: string;
  lastName: string;
  photoPath: string | null;
  teamColor: string | null;
  onChanged: (photoPath: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const path = await uploadAvatar(supabase, participantId, file);
      onChanged(path);
      toast.success("Photo mise à jour !");
    } catch {
      toast.error("Impossible d'envoyer la photo, réessaie.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!photoPath) return;
    setBusy(true);
    try {
      const supabase = createClient();
      await removeAvatar(supabase, participantId, photoPath);
      onChanged(null);
      toast.success("Photo supprimée.");
    } catch {
      toast.error("Impossible de supprimer la photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <ParticipantAvatar firstName={firstName} lastName={lastName} photoPath={photoPath} teamColor={teamColor} size="2xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          aria-label="Changer la photo"
        >
          <Camera className="size-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      {photoPath && (
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={busy}>
          <Trash2 className="size-4" />
          Supprimer la photo
        </Button>
      )}
    </div>
  );
}
