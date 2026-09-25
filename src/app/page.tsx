"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousSession, getMyParticipant } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, WifiOff } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const boot = useCallback(async () => {
    setFailed(false);
    try {
      const supabase = createClient();
      await ensureAnonymousSession(supabase);
      const participant = await getMyParticipant(supabase);
      router.replace(participant ? "/accueil" : "/inscription");
    } catch {
      setFailed(true);
    }
  }, [router]);

  useEffect(() => {
    boot();
  }, [boot]);

  if (failed) {
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">On prépare ton WEI…</p>
    </div>
  );
}
