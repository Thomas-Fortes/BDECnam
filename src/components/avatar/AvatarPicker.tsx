"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareAvatarFile } from "@/lib/image";

export function AvatarPicker({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await prepareAvatarFile(file);
      setPreview(URL.createObjectURL(prepared));
      onChange(prepared);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu de ta photo de profil" className="size-full object-cover" />
        ) : (
          <Camera className="size-8 text-muted-foreground" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Préparation…" : preview ? "Changer la photo" : "Selfie ou galerie"}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <X className="size-4" />
            Retirer
          </Button>
        )}
      </div>
    </div>
  );
}
