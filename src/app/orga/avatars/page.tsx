"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ParticipantAvatar } from "@/components/avatar/ParticipantAvatar";
import { Button } from "@/components/ui/button";
import { useParticipantsPublic } from "@/hooks/useParticipantsPublic";
import { createClient } from "@/lib/supabase/client";
import { removeAvatar } from "@/lib/avatar";

export default function OrgaAvatarsPage() {
  const { participants, refresh } = useParticipantsPublic();
  const withPhoto = participants.filter((p) => p.photo_path);

  async function handleRemove(id: string, path: string) {
    try {
      const supabase = createClient();
      await removeAvatar(supabase, id, path);
      toast.success("Photo supprimée.");
      refresh();
    } catch {
      toast.error("Impossible de supprimer cette photo.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Modération des avatars</h2>
      {withPhoto.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Personne n&apos;a mis de photo pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {withPhoto.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1.5">
              <ParticipantAvatar firstName={p.first_name} lastName={p.last_name} photoPath={p.photo_path} size="lg" />
              <p className="w-full truncate text-center text-xs">{p.first_name}</p>
              <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(p.id, p.photo_path!)} aria-label="Supprimer">
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
