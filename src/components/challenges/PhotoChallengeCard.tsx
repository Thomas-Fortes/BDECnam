"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, Clock, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { prepareChallengePhoto } from "@/lib/image";
import type { PhotoChallenge, PhotoSubmission } from "@/lib/types";

const STATUS_LABEL: Record<PhotoSubmission["status"], string> = {
  en_attente: "En attente de validation",
  validee: "Validé",
  refusee: "Refusé",
};

export function PhotoChallengeCard({
  challenge,
  participantId,
  submission,
  onSubmitted,
}: {
  challenge: PhotoChallenge;
  participantId: string;
  submission: PhotoSubmission | null;
  onSubmitted: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await prepareChallengePhoto(file);
      const supabase = createClient();
      const path = `${participantId}/${challenge.id}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("challenges")
        .upload(path, prepared, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("photo_submissions").upsert(
        { challenge_id: challenge.id, participant_id: participantId, photo_path: path, status: "en_attente", reviewed_by: null },
        { onConflict: "challenge_id,participant_id" }
      );
      if (error) throw error;

      toast.success("Photo envoyée, en attente de validation !");
      onSubmitted();
    } catch {
      toast.error("Impossible d'envoyer la photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex-1">
          <p className="text-sm font-semibold">{challenge.title}</p>
          {challenge.description && <p className="text-xs text-muted-foreground">{challenge.description}</p>}
          <Badge variant="secondary" className="mt-1">
            +{challenge.points} pts
          </Badge>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />

        {submission ? (
          <div className="flex flex-col items-center gap-1 text-xs">
            {submission.status === "en_attente" && <Clock className="size-5 text-amber-500" />}
            {submission.status === "validee" && <Check className="size-5 text-emerald-500" />}
            {submission.status === "refusee" && <X className="size-5 text-rose-500" />}
            <span className="text-center text-muted-foreground">{STATUS_LABEL[submission.status]}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Envoyer une photo"
          >
            <Camera className="size-5" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}
